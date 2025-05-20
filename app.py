from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import numpy as np
import pandas as pd
import joblib
import os
import logging
from pymongo import MongoClient
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import load_model  # type: ignore
import secrets

# Configure logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# MongoDB configuration
MONGO_URI = "mongodb+srv://dev_user:StrongPassword123@cluster0.0gmkxmi.mongodb.net/"
client = MongoClient(MONGO_URI)
mongo_db = client["FRAUD_DATASET_V2"]  # TODO: Replace with actual DB name
password_collection = mongo_db["PASSWORDS"]
fraud_collection = mongo_db["FRAUD_DATASET_V2"]

# Set base directory for model paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FEATURES = ['step', 'type', 'amount', 'oldbalanceorg', 'newbalanceorig', 'oldbalancedest', 'newbalancedest']
TYPE_ENCODER = {
    'CASH_OUT': 0,
    'PAYMENT': 1,
    'CASH_IN': 2,
    'TRANSFER': 3,
    'DEBIT': 4
}

# Load ML models and scaler
def load_ml_models():
    models = {}
    logger.info("Loading ML models...")
    models['rf'] = joblib.load(os.path.join(BASE_DIR, 'Models', 'all_models_V5', 'random_forest_model.pkl'))
    models['logreg'] = joblib.load(os.path.join(BASE_DIR, 'Models', 'all_models_V5', 'logistic_regression_model.pkl'))
    models['gb'] = joblib.load(os.path.join(BASE_DIR, 'Models', 'all_models_V5', 'gradient_boosting_model.pkl'))
    models['dnn'] = load_model(os.path.join(BASE_DIR, 'Models', 'all_models_V5', 'dnn_model.h5'))
    models['scaler'] = joblib.load(os.path.join(BASE_DIR, 'Models', 'all_models_V5', 'scaler.pkl'))
    logger.info("Models loaded successfully.")
    return models

try:
    models = load_ml_models()
except Exception as e:
    logger.critical(f"Failed to load models: {e}")
    models = None

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/login_page')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password required'})

        user = password_collection.find_one({"Username": username, "Password": password})
        if user:
            session['user_id'] = user['Username']
            session['username'] = user['Username']
            return jsonify({'success': True, 'message': 'Login successful', 'redirect': url_for('index')})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})

    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Server error'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/metrics')
@login_required
def metrics():
    return jsonify({
        'accuracy': 0.729,
        'auc': 0.981,
        'recall': 0.907,
        'response_time': 0.4
    })

@app.route('/scan', methods=['POST'])
@login_required
def scan():
    if models is None:
        return jsonify({'status': 'error', 'message': 'ML models not loaded'})

    try:
        data = request.json
        transaction_id = int(data.get('input', '').strip())
        transaction = fraud_collection.find_one({"TRANSACTIONAL_ID": transaction_id})

        if not transaction:
            return jsonify({'status': 'error', 'message': 'Transaction not found', 'type': 'not_found'})

        X = pd.DataFrame([{
            'step': transaction['STEP'],
            'type': TYPE_ENCODER.get(transaction['TYPE'].strip('"'), 0),
            'amount': transaction['AMOUNT'],
            'oldbalanceorg': transaction['OLDBALANCEORG'],
            'newbalanceorig': transaction['NEWBALANCEORIG'],
            'oldbalancedest': transaction['OLDBALANCEDEST'],
            'newbalancedest': transaction['NEWBALANCEDEST']
        }])

        X_scaled = models['scaler'].transform(X)

        preds = {
            'rf': float(models['rf'].predict_proba(X)[:, 1][0]),
            'logreg': float(models['logreg'].predict_proba(X)[:, 1][0]),
            'gb': float(models['gb'].predict_proba(X)[:, 1][0]),
            'dnn': float(models['dnn'].predict(X_scaled)[0][0])
        }

        ensemble = sum(preds.values()) / len(preds)
        is_fraud = ensemble > 0.5

        return jsonify({
            'status': 'success',
            'prediction': is_fraud,
            'confidence': round(ensemble, 3),
            'details': {k: round(v, 3) for k, v in preds.items()},
            'message': 'Fraud detected' if is_fraud else 'Transaction appears legitimate'
        })

    except Exception as e:
        logger.error(f"Scan error: {e}")
        return jsonify({'status': 'error', 'message': 'Processing error', 'details': str(e)})

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

if __name__ == '__main__':
    import webbrowser
    from threading import Timer

    def open_browser():
        if not os.environ.get("WERKZEUG_RUN_MAIN"):
            webbrowser.open_new("http://127.0.0.1:5000/login_page")

    Timer(1, open_browser).start()
    app.run(debug=True, host='0.0.0.0', port=5000)
