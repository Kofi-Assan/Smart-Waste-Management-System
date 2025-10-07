// Get DOM elements
// Note: Point this to your running backend. Defaults to localhost:3000.
const API_BASE = 'http://localhost:3000';
const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');
const signupFormElement = document.getElementById('signupForm');
const signinFormElement = document.getElementById('signinForm');
const forgotPasswordLink = document.getElementById('forgotPassword');

// Toggle between Sign Up and Sign In forms
signUpButton.addEventListener('click', function(){
    signInForm.style.display = 'none';
    signUpForm.style.display = 'block';
});

signInButton.addEventListener('click', function(){
    signInForm.style.display = 'block';
    signUpForm.style.display = 'none';
});

// Handle Sign Up form submission
signupFormElement.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Basic validation
    if (firstName && lastName && email && password) {
        try {
            // Try to register with backend API
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password
                })
            });
            // Handle HTTP errors explicitly so we don't incorrectly trigger offline mode
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                alert(`Registration failed (${response.status} ${response.statusText})${errorText ? `: ${errorText}` : ''}`);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                alert('Registration successful! You can now sign in.');
                
                // Switch to sign in form
                signInForm.style.display = 'block';
                signUpForm.style.display = 'none';
                
                // Clear form
                signupFormElement.reset();
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            // Fallback to localStorage if backend is not available
            const userData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password
            };
            
            localStorage.setItem('user_' + email, JSON.stringify(userData));
            alert('Registration successful! (Using offline mode)');
            
            // Switch to sign in form
            signInForm.style.display = 'block';
            signUpForm.style.display = 'none';
            signupFormElement.reset();
        }
    } else {
        alert('Please fill in all fields.');
    }
});

// Handle Sign In form submission
signinFormElement.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    
    try {
        // Try to login with backend API
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        // Handle HTTP errors explicitly so we don't incorrectly trigger offline mode
        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            alert(`Login failed (${response.status} ${response.statusText})${errorText ? `: ${errorText}` : ''}`);
            return;
        }

        const data = await response.json();

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // Show dashboard view
            showDashboard(data.user);
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        // Fallback to localStorage if backend is not available
        const storedUser = localStorage.getItem('user_' + email);
        
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            
            if (userData.password === password) {
                showDashboard(userData);
            } else {
                alert('Invalid password. Please try again.');
            }
        } else {
            alert('No account found with this email. Please sign up first.');
        }
    }
});

// Function to show dashboard with user data
function showDashboard(userData) {
    const dashboard = document.getElementById('dashboard');
    const dashName = document.getElementById('dashName');
    const dashEmail = document.getElementById('dashEmail');
    
    dashName.textContent = `Welcome, ${userData.firstName} ${userData.lastName}`;
    dashEmail.textContent = userData.email;

    // Also populate the sliding side panel
    const panelName = document.getElementById('panelName');
    const panelEmail = document.getElementById('panelEmail');
    if (panelName) panelName.textContent = `${userData.firstName} ${userData.lastName}`;
    if (panelEmail) panelEmail.textContent = userData.email;

    document.getElementById('signIn').style.display = 'none';
    document.getElementById('signup').style.display = 'none';
    dashboard.style.display = 'block';
}

// Handle Forgot Password (secure flow via backend)
forgotPasswordLink.addEventListener('click', async function(e) {
    e.preventDefault();

    const email = prompt('Please enter your email address:');
    if (!email) return;

    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.error || 'Failed to initiate password reset.');
            return;
        }

        // In dev, backend returns resetToken for convenience
        let token = data.resetToken || prompt('A reset token was emailed to you. Enter the token:');
        if (!token) return;

        const newPassword = prompt('Enter a new password:');
        if (!newPassword) return;

        const resetRes = await fetch(`${API_BASE}/api/auth/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const resetData = await resetRes.json().catch(() => ({}));
        if (!resetRes.ok) {
            alert(resetData.error || 'Password reset failed.');
            return;
        }

        alert('Password has been reset. You can now sign in with your new password.');
    } catch (err) {
        console.error('Forgot password error:', err);
        alert('Network error. Please try again when you are online.');
    }
});

// Add some visual feedback for social login buttons
document.querySelectorAll('.icons i').forEach(icon => {
    icon.addEventListener('click', function() {
        const platform = this.classList.contains('fa-google') ? 'Google' : 'Facebook';
        alert(`${platform} Login is under construction.`);
    });
});

// Logout
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'logoutBtn'){
        // Show sign-in form again and hide dashboard
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('signIn').style.display = 'block';
        // Clear sign-in inputs
        signinFormElement.reset();
        // Clear panel info
        const panelName = document.getElementById('panelName');
        const panelEmail = document.getElementById('panelEmail');
        if (panelName) panelName.textContent = 'Username';
        if (panelEmail) panelEmail.textContent = 'email@example.com';
    }
});

// Handle side panel button clicks
document.addEventListener('click', function(e){
    if(e.target && e.target.classList.contains('panel-btn')){
        const buttonText = e.target.textContent.trim();
        if(buttonText === 'Bins'){
            showBinsPanel();
        }
        // Dashboard and Rewards buttons can be handled here later
    }
});

// Function to show bins panel
async function showBinsPanel() {
    const binsContent = document.getElementById('binsContent');
    const binsGrid = document.getElementById('binsGrid');
    
    // Show the panel
    binsContent.style.display = 'block';
    
    // Show loading state
    binsGrid.innerHTML = '<div class="loading">Loading bins...</div>';
    
    try {
        // Fetch bins from API
        const response = await fetch(`${API_BASE}/api/bins`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch bins');
        }
        
        const data = await response.json();
        const bins = data.bins || [];
        
        if (bins.length === 0) {
            binsGrid.innerHTML = '<div class="no-bins">No bins available at the moment.</div>';
            return;
        }
        
        // Display bins
        displayBins(bins);
    } catch (error) {
        console.error('Error fetching bins:', error);
        // Show fallback message
        binsGrid.innerHTML = '<div class="error-message">Unable to load bins. Please ensure the backend is running.</div>';
    }
}

// Function to display bins in grid
function displayBins(bins) {
    const binsGrid = document.getElementById('binsGrid');
    
    binsGrid.innerHTML = bins.map(bin => {
        const statusClass = getStatusClass(bin.status);
        const levelClass = getLevelClass(bin.level);
        const binTypeIcon = getBinTypeIcon(bin.bin_type);
        
        return `
            <div class="bin-card ${statusClass}">
                <div class="bin-icon">${binTypeIcon}</div>
                <div class="bin-info">
                    <h3>${bin.location || 'Unknown Location'}</h3>
                    <div class="bin-type">${formatBinType(bin.bin_type)}</div>
                    <div class="bin-status">
                        <span class="status-badge ${statusClass}">${bin.status || 'Unknown'}</span>
                    </div>
                    <div class="bin-level">
                        <div class="level-bar">
                            <div class="level-fill ${levelClass}" style="width: ${bin.level || 0}%"></div>
                        </div>
                        <span class="level-text">${bin.level || 0}% Full</span>
                    </div>
                    ${bin.last_emptied ? `<div class="bin-meta">Last emptied: ${formatDate(bin.last_emptied)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Helper functions
function getStatusClass(status) {
    const statusMap = {
        'active': 'status-active',
        'full': 'status-full',
        'maintenance': 'status-maintenance',
        'offline': 'status-offline'
    };
    return statusMap[status] || 'status-unknown';
}

function getLevelClass(level) {
    if (level >= 80) return 'level-critical';
    if (level >= 60) return 'level-warning';
    return 'level-normal';
}

function getBinTypeIcon(type) {
    const iconMap = {
        'plastic': '♻️',
        'paper': '📄',
        'glass': '🥃',
        'metal': '🥫',
        'organic': '🌱'
    };
    return iconMap[type] || '🗑️';
}

function formatBinType(type) {
    if (!type) return 'General';
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// Close bins panel
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'closeBinsBtn'){
        document.getElementById('binsContent').style.display = 'none';
    }
});

// QR Scanner functionality
let qrStream = null;
let qrScanning = false;

// Initialize QR scanner when trash can is clicked
document.addEventListener('click', function(e){
    if(e.target && (e.target.id === 'trashCanContainer' || e.target.id === 'trashCanImage' || e.target.closest('#trashCanContainer'))){
        openQrScanner();
    }
});

// Open QR scanner modal
async function openQrScanner() {
    const modal = document.getElementById('qrScannerModal');
    const resultDiv = document.getElementById('qrResult');
    
    // Hide any previous results
    resultDiv.style.display = 'none';
    
    // Show modal
    modal.style.display = 'flex';
    
    try {
        // Request camera access
        qrStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment', // Use back camera if available
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        const video = document.getElementById('qrVideo');
        video.srcObject = qrStream;
        
        // Start scanning when video is ready
        video.onloadedmetadata = function() {
            video.play();
            startQrScanning();
        };
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please ensure camera permissions are granted.');
        closeQrScanner();
    }
}

// Start QR code scanning
function startQrScanning() {
    if (qrScanning) return;
    
    qrScanning = true;
    const video = document.getElementById('qrVideo');
    const canvas = document.getElementById('qrCanvas');
    const context = canvas.getContext('2d');
    
    function scanFrame() {
        if (!qrScanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                handleQrResult(code.data);
                return;
            }
        }
        
        requestAnimationFrame(scanFrame);
    }
    
    scanFrame();
}

// Handle QR code scan result
function handleQrResult(data) {
    qrScanning = false;
    
    // Stop camera stream
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    // Show result
    const resultDiv = document.getElementById('qrResult');
    const resultText = document.getElementById('qrResultText');
    
    resultText.textContent = data;
    resultDiv.style.display = 'block';
    
    // Process the QR code data (you can customize this based on your needs)
    processQrData(data);
}

// Process QR code data
function processQrData(data) {
    console.log('QR Code scanned:', data);
    
    // Example processing - you can customize this based on your waste management needs
    if (data.startsWith('http')) {
        // If it's a URL, you might want to open it or process it
        alert(`QR Code contains a URL: ${data}`);
    } else if (data.includes('bin') || data.includes('waste')) {
        // If it contains waste-related keywords
        alert(`Waste bin QR code detected: ${data}`);
    } else {
        // Generic QR code
        alert(`QR Code scanned successfully: ${data}`);
    }
}

// Close QR scanner
function closeQrScanner() {
    qrScanning = false;
    
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    const modal = document.getElementById('qrScannerModal');
    modal.style.display = 'none';
    
    const video = document.getElementById('qrVideo');
    video.srcObject = null;
}

// Close QR scanner modal
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'closeQrScanner'){
        closeQrScanner();
    }
});

// Scan again button
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'scanAgainBtn'){
        const resultDiv = document.getElementById('qrResult');
        resultDiv.style.display = 'none';
        openQrScanner();
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'qrScannerModal'){
        closeQrScanner();
    }
});