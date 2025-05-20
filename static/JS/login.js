// login.js for NeoFraudSight
document.addEventListener('DOMContentLoaded', function() {
    // Create particles for background animation
    createParticles();
    
    // Login form submission handler
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form inputs
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            // Validate input
            if (!username || !password) {
                showError('Please enter both username and password');
                return;
            }
            
            // Show loading state
            const loginButton = document.getElementById('login-button');
            const originalButtonText = loginButton.textContent;
            loginButton.textContent = 'Authenticating...';
            loginButton.disabled = true;
            
            try {
                // Send authentication request to Flask backend
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    // Hide error message if visible
                    errorMessage.style.display = 'none';
                    
                    // Create animation effect for transition
                    document.querySelector('.login-container').style.animation = 'fadeOut 0.5s forwards';
                    
                    // Add fadeOut animation to CSS
                    const style = document.createElement('style');
                    style.textContent = `
                        @keyframes fadeOut {
                            from { opacity: 1; transform: translateY(0); }
                            to { opacity: 0; transform: translateY(-20px); }
                        }
                    `;
                    document.head.appendChild(style);
                    
                    // Redirect to main page after animation
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);
                    
                } else {
                    // Show error message
                    showError(result.message || 'Authentication failed');
                    
                    // Reset button
                    loginButton.textContent = originalButtonText;
                    loginButton.disabled = false;
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showError('Server error. Please try again later.');
                
                // Reset button
                loginButton.textContent = originalButtonText;
                loginButton.disabled = false;
            }
        });
    }
    
    // Show error message function
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // Add shake animation
            errorMessage.style.animation = 'shake 0.5s';
            setTimeout(() => {
                errorMessage.style.animation = '';
            }, 500);
            
            // Add shake animation to CSS
            const style = document.createElement('style');
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create background particles
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        // Clear existing particles
        particlesContainer.innerHTML = '';
        
        // Create random particles
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 6 + 2;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const opacity = Math.random() * 0.3 + 0.1;
            const animationDuration = Math.random() * 10 + 8;
            const animationDelay = Math.random() * 5;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = opacity;
            particle.style.animation = `float ${animationDuration}s infinite ease-in-out`;
            particle.style.animationDelay = `${animationDelay}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
});