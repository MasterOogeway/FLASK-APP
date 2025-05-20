// script.js for NeoFraudSight
document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // Navigation Smooth Scroll
    // ======================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // ======================
    // How It Works Section - Step Animations
    // ======================
    const steps = document.querySelectorAll('.step');
    
    function checkStepVisibility() {
        steps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const isVisible = (rect.top <= window.innerHeight * 0.8);
            
            if (isVisible) {
                // Add delay based on index for staggered animation
                setTimeout(() => {
                    step.classList.add('visible');
                }, index * 200);
            }
        });
    }

    // Initial check
    checkStepVisibility();
    
    // Check on scroll
    window.addEventListener('scroll', checkStepVisibility);

    // ======================
    // Data Scanner Section Functionality
    // ======================
    const scanButton = document.getElementById('scan-button');
    const dataInput = document.getElementById('data-input');
    const dataVisualization = document.getElementById('data-visualization');
    const scanLine = document.getElementById('scan-line');
    const processingStatus = document.getElementById('processing-status');
    const resultContainer = document.getElementById('result-container');
    const resultBadge = document.getElementById('result-badge');
    const resultText = document.getElementById('result-text');
    const resultDetails = document.getElementById('result-details');
    const dataParticles = document.getElementById('data-particles');

    // Animate scanner input group on load
    const scannerInputGroup = document.querySelector('.scanner-input-group');
    if (scannerInputGroup) {
        scannerInputGroup.style.animation = 'fadeInUp 0.5s forwards';
    }

    // Create data particles for visualization
    if (dataParticles) {
        createParticles();
    }

    // Scan button click handler
    if (scanButton) {
        scanButton.addEventListener('click', async function() {
            const userInput = dataInput ? dataInput.value.trim() : '';
            
            // Validate input
            if (!userInput) {
                alert("Please enter a transaction ID to scan");
                return;
            }

            // Show loading state
            if (dataVisualization) dataVisualization.classList.add('active');
            if (scanLine) scanLine.classList.add('active');
            if (processingStatus) processingStatus.style.display = "block";
            if (resultContainer) resultContainer.style.display = "none";
            
            try {
                // Send request to Flask backend
                const response = await fetch('/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: userInput })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();

                // Hide loading elements
                if (scanLine) scanLine.classList.remove("active");
                if (processingStatus) processingStatus.style.display = "none";
                if (resultContainer) resultContainer.style.display = "block";

                // Handle different response types
                if (result.status === 'error') {
                    // Error handling
                    if (resultBadge) {
                        resultBadge.textContent = "⚠️ " + (
                            result.type === 'not_found' ? 'Not Found' : 
                            result.type === 'validation' ? 'Invalid Input' :
                            'System Error'
                        );
                        
                        resultBadge.className = "result-badge " + (
                            result.type === 'not_found' ? 'warning' : 'danger'
                        );
                    }
                    
                    if (resultText) {
                        resultText.textContent = result.message;
                    }
                    
                    if (resultDetails) {
                        let detailsHTML = "";
                        if (result.suggestion) {
                            detailsHTML += `<p>${result.suggestion}</p>`;
                        }
                        if (result.example) {
                            detailsHTML += `<p class="example-id">Example: ${result.example}</p>`;
                        }
                        if (result.details) {
                            detailsHTML += `<div class="error-details">${result.details}</div>`;
                        }
                        resultDetails.innerHTML = detailsHTML;
                    }

                } else if (result.status === 'success') {
                    // Success - handle fraud prediction results
                    if (resultBadge) {
                        resultBadge.textContent = result.prediction ? "🚨 Fraud Detected" : "✅ Safe";
                        resultBadge.className = "result-badge " + (result.prediction ? "danger" : "safe");
                    }
                    
                    if (resultText) {
                        resultText.textContent = result.message;
                    }
                    
                    if (resultDetails) {
                        // Display confidence and model breakdown
                        let detailsHTML = `
                            <p><strong>Confidence:</strong> ${result.confidence}</p>
                            <div class="model-scores">
                                <h4>Model Breakdown:</h4>
                                <ul>
                                    ${Object.entries(result.details).map(([model, score]) => 
                                        `<li><strong>${formatModelName(model)}:</strong> ${score}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                        `;
                        resultDetails.innerHTML = detailsHTML;
                    }

                    // Add animation for particles when showing results
                    if (dataParticles) {
                        dataParticles.style.animation = result.prediction ? 
                            'pulse-red 2s infinite' : 'pulse-green 2s infinite';
                    }
                }

            } catch (error) {
                console.error('Error during scan:', error);
                
                // Reset and show error
                if (scanLine) scanLine.classList.remove("active");
                if (processingStatus) processingStatus.style.display = "none";
                
                if (resultBadge) {
                    resultBadge.textContent = "⚠️ System Error";
                    resultBadge.className = "result-badge danger";
                }
                
                if (resultText) {
                    resultText.textContent = "Failed to complete scan";
                }
                
                if (resultDetails) {
                    resultDetails.innerHTML = `
                        <p>Please try again later.</p>
                        <div class="error-details">${error.message}</div>
                    `;
                }
                
                if (resultContainer) {
                    resultContainer.style.display = "block";
                }
            }
        });
    }

    // Helper function to format model names for display
    function formatModelName(modelCode) {
        const modelNames = {
            'rf': 'Random Forest',
            'logreg': 'Logistic Regression',
            'gb': 'Gradient Boosting',
            'dnn': 'Deep Neural Network'
        };
        return modelNames[modelCode] || modelCode;
    }

    // Create animation particles for the data visualization
    function createParticles() {
        // Clear existing particles
        dataParticles.innerHTML = '';
        
        // Create 50 random particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'data-particle';
            
            // Random properties
            const size = Math.random() * 8 + 2;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const opacity = Math.random() * 0.5 + 0.3;
            const animationDuration = Math.random() * 3 + 2;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = opacity;
            particle.style.animation = `moveParticle ${animationDuration}s infinite ease-in-out`;
            
            dataParticles.appendChild(particle);
        }
    }

    // ======================
    // Terminal Animation (Demo Section)
    // ======================
    const terminal = document.querySelector('.terminal');
    if (terminal) {
        const commands = [
            { text: 'Initializing NeoFraudSight system...', delay: 800 },
            { text: 'Loading neural networks...', delay: 1000 },
            { text: 'Connecting to secure databases...', delay: 800 },
            { text: 'System ready.', delay: 500 },
            { text: '> scan transaction_id:TX98347291', delay: 1000 },
            { text: 'Analyzing transaction patterns...', delay: 1200 },
            { text: 'Comparing against known fraud signatures...', delay: 1500 },
            { text: 'Result: SAFE - No fraudulent activity detected', delay: 0, class: 'safe-result' }
        ];

        let currentIndex = 0;
        
        function typeNextLine() {
            if (currentIndex >= commands.length) return;
            
            const command = commands[currentIndex];
            const line = document.createElement('div');
            line.className = 'terminal-line';
            
            if (command.class) {
                line.classList.add(command.class);
            }
            
            if (currentIndex >= 4) { // Add prompt to commands
                const prompt = document.createElement('span');
                prompt.className = 'prompt';
                prompt.textContent = '>';
                line.appendChild(prompt);
            }
            
            const textNode = document.createElement('span');
            line.appendChild(textNode);
            terminal.appendChild(line);
            
            // Type effect
            let i = 0;
            const typing = setInterval(() => {
                if (i < command.text.length) {
                    textNode.textContent += command.text.charAt(i);
                    i++;
                    terminal.scrollTop = terminal.scrollHeight;
                } else {
                    clearInterval(typing);
                    currentIndex++;
                    setTimeout(typeNextLine, command.delay);
                }
            }, 20);
        }
        
        // Start typing after a short delay
        setTimeout(typeNextLine, 1000);
    }

    // ======================
    // Mobile Navigation
    // ======================
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
    
    const navContainer = document.querySelector('.nav-container');
    if (navContainer && window.innerWidth <= 768) {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.style.display = 'none';
            mobileMenuButton.addEventListener('click', function() {
                if (navLinks.style.display === 'flex') {
                    navLinks.style.display = 'none';
                } else {
                    navLinks.style.display = 'flex';
                    navLinks.style.flexDirection = 'column';
                    navLinks.style.position = 'absolute';
                    navLinks.style.top = '100%';
                    navLinks.style.right = '2rem';
                    navLinks.style.background = 'var(--dark)';
                    navLinks.style.padding = '1rem';
                    navLinks.style.border = '1px solid var(--primary)';
                }
            });
            navContainer.appendChild(mobileMenuButton);
        }
    }

    // ======================
    // Update Performance Metrics
    // ======================
    async function updateMetrics() {
        try {
            const response = await fetch('/metrics');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const metrics = await response.json();
            
            // Update metrics display
            const accuracyStat = document.getElementById('accuracy-stat');
            const aucStat = document.getElementById('auc-stat');
            const recallStat = document.getElementById('recall-stat');
            const responseStat = document.getElementById('response-stat');
            
            if (accuracyStat) accuracyStat.textContent = `${(metrics.accuracy * 100).toFixed(1)}%`;
            if (aucStat) aucStat.textContent = metrics.auc.toFixed(3);
            if (recallStat) recallStat.textContent = metrics.recall.toFixed(3);
            if (responseStat) responseStat.textContent = `${metrics.response_time}s`;
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    }

    // Initialize metrics on load
    updateMetrics();
    
    // Call setup functions
    setupLoginForm();
    setupLoginParticles(); // This was missing its implementation
});

// ======================
// Login Page Functionality
// ======================
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!username || !password) {
                if (loginError) {
                    loginError.textContent = 'Please enter both username and password';
                    loginError.style.display = 'block';
                }
                return;
            }
            
            // Show loading state
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = 'Logging in...';
            }
            
            try {
                // Send login request
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // Successful login - redirect
                    window.location.href = result.redirect;
                } else {
                    // Failed login - show error
                    if (loginError) {
                        loginError.textContent = result.message;
                        loginError.style.display = 'block';
                    }
                    // Reset button
                    if (loginButton) {
                        loginButton.disabled = false;
                        loginButton.textContent = 'Login';
                    }
                }
                
            } catch (error) {
                console.error('Login error:', error);
                
                // Show error message
                if (loginError) {
                    loginError.textContent = 'System error during login. Please try again.';
                    loginError.style.display = 'block';
                }
                
                // Reset button
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Login';
                }
            }
        });
    }
}

// ======================
// Login Particles Animation
// ======================
function setupLoginParticles() {
    const loginParticlesContainer = document.getElementById('login-particles');
    
    if (!loginParticlesContainer) {
        return; // Exit if the container isn't found
    }
    
    // Clear existing particles
    loginParticlesContainer.innerHTML = '';
    
    // Create particles for the login background
    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'login-particle';
        
        // Random properties
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.4 + 0.1;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.animation = `floatParticle ${animationDuration}s ${animationDelay}s infinite ease-in-out`;
        
        loginParticlesContainer.appendChild(particle);
    }
}

// Add particle movement and pulse animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes moveParticle {
        0% {
            transform: translate(0, 0);
        }
        25% {
            transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
        }
        50% {
            transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
        }
        75% {
            transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
        }
        100% {
            transform: translate(0, 0);
        }
    }
    
    @keyframes pulse-red {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; background-color: rgba(255, 60, 60, 0.4); }
        100% { opacity: 0.5; }
    }
    
    @keyframes pulse-green {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; background-color: rgba(60, 255, 100, 0.4); }
        100% { opacity: 0.5; }
    }
    
    @keyframes floatParticle {
        0% {
            transform: translate(0, 0) rotate(0deg);
        }
        25% {
            transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * 80 - 40}px) rotate(90deg);
        }
        50% {
            transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * 80 - 40}px) rotate(180deg);
        }
        75% {
            transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * 80 - 40}px) rotate(270deg);
        }
        100% {
            transform: translate(0, 0) rotate(360deg);
        }
    }
    
    .safe-result {
        color: var(--success);
    }
    
    .login-particle {
        position: absolute;
        background-color: var(--primary);
        border-radius: 50%;
        box-shadow: 0 0 10px var(--primary);
        pointer-events: none;
    }
`;
document.head.appendChild(style);