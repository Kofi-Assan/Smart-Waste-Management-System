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

    // Load user coin balance and bin data
    loadUserCoinBalance(userData.id);
    startBinDataRefresh(); // Start auto-refresh for real-time updates

    document.getElementById('signIn').style.display = 'none';
    document.getElementById('signup').style.display = 'none';
    dashboard.style.display = 'block';
}

// Function to load user coin balance
async function loadUserCoinBalance(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/users/${userId}/coins`);
        if (response.ok) {
            const data = await response.json();
            const coinBalanceElement = document.getElementById('summaryCoins');
            if (coinBalanceElement) {
                coinBalanceElement.textContent = data.coinBalance || 0;
            }
        }
    } catch (error) {
        console.error('Error loading coin balance:', error);
        // Keep default value if fetch fails
    }
}

// Function to load bin data for dashboard
async function loadBinData() {
    try {
        const response = await fetch(`${API_BASE}/api/bins`);
        if (response.ok) {
            const data = await response.json();
            const bins = data.bins || [];
            
            if (bins.length > 0) {
                const bin1 = bins[0]; // Get the first (and only) bin
                const bin1StatusElement = document.getElementById('bin1Status');
                if (bin1StatusElement) {
                    const statusText = bin1.status === 'Full' ? 'Full' : `${bin1.level}% Full`;
                    bin1StatusElement.textContent = statusText;
                    
                    // Add visual indicator based on status
                    bin1StatusElement.className = getStatusClass(bin1.status);
                }
                
                // Update bin count
                const binsCountElement = document.getElementById('summaryBinsCount');
                if (binsCountElement) {
                    binsCountElement.textContent = bins.length;
                }
            }
        }
    } catch (error) {
        console.error('Error loading bin data:', error);
        const bin1StatusElement = document.getElementById('bin1Status');
        if (bin1StatusElement) {
            bin1StatusElement.textContent = 'Error loading';
            bin1StatusElement.className = 'error';
        }
    }
}

// Auto-refresh bin data every 30 seconds
let binDataInterval;

function startBinDataRefresh() {
    // Clear any existing interval
    if (binDataInterval) {
        clearInterval(binDataInterval);
    }
    
    // Load initial data
    loadBinData();
    
    // Set up auto-refresh every 30 seconds
    binDataInterval = setInterval(loadBinData, 30000);
}

function stopBinDataRefresh() {
    if (binDataInterval) {
        clearInterval(binDataInterval);
        binDataInterval = null;
    }
}

// Helper function to get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'Full': 'status-full',
        'Almost Full': 'status-warning',
        'Half Full': 'status-normal',
        'Not Full': 'status-empty',
        'Empty': 'status-empty'
    };
    return statusMap[status] || 'status-unknown';
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
        // Stop auto-refresh
        stopBinDataRefresh();
        
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

// Handle side panel button clicks with smooth scroll behavior
document.addEventListener('click', function(e){
    if(e.target && e.target.classList.contains('panel-btn')){
        const buttonText = e.target.textContent.trim();
        if(buttonText === 'Bins'){
            showBinsPanel();
            return;
        }
        if(buttonText === 'Scan'){
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if(buttonText === 'Dashboard'){
            const target = document.getElementById('landingHero');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        if(buttonText === 'Rewards'){
            showRewardsPanel();
            return;
        }
    }
});

// Function to show bins panel
async function showBinsPanel() {
    const binsContent = document.getElementById('binsContent');
    const binsGrid = document.getElementById('binsGrid');
    
    // Show the panel
    binsContent.style.display = 'block';
    // Activate background blur
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.classList.add('blur-active');
    
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
    
    // Check for coin awards before displaying
    checkForCoinAwards(bins);
    
    binsGrid.innerHTML = bins.map(bin => {
        const statusClass = getStatusClass(bin.status);
        const levelClass = getLevelClass(bin.level);
        const binTypeIcon = getBinTypeIcon(bin.bin_type);
        
        return `
            <div class="bin-card ${statusClass}">
                <div class="bin-id">${bin.id}</div>
                <div class="bin-icon">${binTypeIcon}</div>
                <div class="bin-info">
                    <h3>${bin.location || 'Unknown Location'}</h3>
                    <div class="bin-type">General</div>
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

// Function to check for coin awards from bin level increases
function checkForCoinAwards(bins) {
    // Store previous bin levels in localStorage for comparison
    const previousLevels = JSON.parse(localStorage.getItem('previousBinLevels') || '{}');
    const currentLevels = {};
    let totalCoinsAwarded = 0;
    
    bins.forEach(bin => {
        const binId = bin.id;
        const currentLevel = Math.round(bin.level || 0);
        const previousLevel = previousLevels[binId] || 0;
        
        currentLevels[binId] = currentLevel;
        
        // Calculate coins for level increase
        if (currentLevel > previousLevel) {
            const levelIncrease = currentLevel - previousLevel;
            const tenPercentIncrements = Math.floor(levelIncrease / 10);
            const coinsAwarded = tenPercentIncrements * 5;
            
            if (coinsAwarded > 0) {
                totalCoinsAwarded += coinsAwarded;
                showCoinAwardNotification(coinsAwarded, binId, previousLevel, currentLevel);
            }
        }
    });
    
    // Update stored levels
    localStorage.setItem('previousBinLevels', JSON.stringify(currentLevels));
    
    // Update coin balance if any coins were awarded
    if (totalCoinsAwarded > 0) {
        updateCoinBalance(totalCoinsAwarded);
    }
}

// Function to show coin award notification
function showCoinAwardNotification(coins, binId, fromLevel, toLevel) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'coin-award-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">🪙</div>
            <div class="notification-text">
                <div class="notification-title">Coins Earned!</div>
                <div class="notification-details">
                    +${coins} coins for Bin ${binId}<br>
                    Level: ${fromLevel}% → ${toLevel}%
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Function to update coin balance
function updateCoinBalance(coinsToAdd) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) return;
    
    // Update local display
    const summaryCoinsElement = document.getElementById('summaryCoins');
    const headerCoinBalance = document.getElementById('headerCoinBalance');
    
    if (summaryCoinsElement) {
        const currentBalance = parseInt(summaryCoinsElement.textContent.replace(/,/g, '') || 0);
        const newBalance = currentBalance + coinsToAdd;
        summaryCoinsElement.textContent = newBalance.toLocaleString();
    }
    
    if (headerCoinBalance) {
        const currentBalance = parseInt(headerCoinBalance.textContent.replace(/,/g, '') || 0);
        const newBalance = currentBalance + coinsToAdd;
        headerCoinBalance.textContent = newBalance.toLocaleString();
    }
    
    // Update backend (optional - for persistence)
    updateUserCoinBalance(userData.id, coinsToAdd);
}

// Function to update user coin balance in backend
async function updateUserCoinBalance(userId, coinsToAdd) {
    try {
        const response = await fetch(`${API_BASE}/api/users/${userId}/coins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                coins: coinsToAdd,
                action: 'add'
            })
        });
        
        if (response.ok) {
            console.log(`✅ Updated user ${userId} coin balance by +${coinsToAdd}`);
        } else {
            console.error('❌ Failed to update coin balance in backend');
        }
    } catch (error) {
        console.error('❌ Error updating coin balance:', error);
    }
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
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.classList.remove('blur-active');
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
    
    // Stop QR scanning immediately to prevent multiple scans
    qrScanning = false;
    
    // Close QR scanner modal
    closeQrScanner();
    
    // Define valid QR code patterns for the Smart Waste Management System
    const validPatterns = {
        // User QR codes (generated during registration)
        userQr: /^GEGE_USER_\d+_[a-zA-Z0-9]+$/,
        // Trash collection confirmation QR codes
        trashCollection: /^TRASH_COLLECTION_\d+_[a-zA-Z0-9]+$/,
        // Bin QR codes
        binQr: /^BIN_\d+_[a-zA-Z0-9]+$/,
        // Waste deposit QR codes
        wasteDeposit: /^WASTE_DEPOSIT_\d+_[a-zA-Z0-9]+$/
    };
    
    let isValidQr = false;
    let coinsEarned = 0;
    let message = '';
    
    try {
        // Try to parse as JSON (for structured trash collection QR codes)
        const qrData = JSON.parse(data);
        console.log('Parsed QR data:', qrData);
        
        if (qrData.type === 'trash_collection_confirmation' && qrData.binId && qrData.location) {
            console.log('✅ Valid trash collection QR code - processing...');
            // Handle structured trash collection confirmation
            handleTrashCollectionConfirmation(qrData);
            return; // Exit function after successful processing
        } else {
            console.log('❌ JSON QR code but invalid format');
            // JSON but not a valid trash collection confirmation
            // message = `❌ Invalid QR Code\n\nThis QR code is not recognized by the Smart Waste Management System.\n\nQR Code: ${JSON.stringify(qrData, null, 2)}\n\nPlease scan a valid waste management QR code to earn coins.`;
            message = ''; // No message for invalid QR codes
        }
    } catch (e) {
        console.log('Not JSON, checking pattern matching...');
        
        // Check for valid QR code patterns
        if (validPatterns.userQr.test(data)) {
            isValidQr = true;
            coinsEarned = 30;
            message = `✅ Valid User QR Code Scanned!\n\n🪙 +${coinsEarned} Coins Earned!\n\nQR Code: ${data}`;
            
        } else if (validPatterns.trashCollection.test(data)) {
            isValidQr = true;
            coinsEarned = 50;
            message = `✅ Trash Collection QR Code Scanned!\n\n🪙 +${coinsEarned} Coins Earned!\n\nQR Code: ${data}`;
            
        } else if (validPatterns.binQr.test(data)) {
            isValidQr = true;
            coinsEarned = 25;
            message = `✅ Smart Bin QR Code Scanned!\n\n🪙 +${coinsEarned} Coins Earned!\n\nQR Code: ${data}`;
            
        } else if (validPatterns.wasteDeposit.test(data)) {
            isValidQr = true;
            coinsEarned = 40;
            message = `✅ Waste Deposit QR Code Scanned!\n\n🪙 +${coinsEarned} Coins Earned!\n\nQR Code: ${data}`;
            
        } else {
            // Invalid QR code - no coins awarded
            // message = `❌ Invalid QR Code\n\nThis QR code is not recognized by the Smart Waste Management System.\n\nQR Code: ${data}\n\nPlease scan a valid waste management QR code to earn coins.`;
            message = ''; // No message for invalid QR codes
        }
    }
    
    // Show single message and award coins if valid
    if (isValidQr) {
        awardCoinsForScanning(coinsEarned);
    }
    
    // Show the message only if there's a message to show
    if (message) {
        alert(message);
    }
}

// Handle trash collection confirmation
function handleTrashCollectionConfirmation(qrData) {
    console.log('🎯 handleTrashCollectionConfirmation called with:', qrData);
    
    // Validate required fields
    if (!qrData.binId || !qrData.location || !qrData.action) {
        console.log('❌ Missing required fields in trash collection QR');
        alert(`❌ Invalid Trash Collection QR Code\n\nMissing required information. Please scan a valid trash collection QR code.`);
        return;
    }
    
    console.log('✅ All required fields present, awarding coins...');
    
    // Award coins for scanning valid QR code
    const coinsEarned = 50; // Award 50 coins for each scan
    awardCoinsForScanning(coinsEarned);
    
    // Show confirmation message
    const confirmationMessage = `✅ Trash Collection Confirmed!\n\nBin ID: ${qrData.binId}\nLocation: ${qrData.location}\nAction: ${qrData.action}\nSystem: ${qrData.system || 'Smart Waste Management'}\n\n🪙 +${coinsEarned} Coins Earned!\n\nCollection has been successfully recorded.`;
    
    alert(confirmationMessage);
    
    // Update bin status (you would need to implement the API call)
    updateBinAfterCollection(qrData.binId);
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

// Function to show rewards panel
async function showRewardsPanel() {
    const rewardsContent = document.getElementById('rewardsContent');
    const rewardsGrid = document.getElementById('rewardsGrid');
    
    // Show the panel
    rewardsContent.style.display = 'block';
    // Activate background blur
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.classList.add('blur-active');
    
    // Update coin balance in header
    updateHeaderCoinBalance();
    
    // Show loading state
    rewardsGrid.innerHTML = '<div class="loading">Loading rewards...</div>';
    
    try {
        // Load and display rewards
        displayRewards();
    } catch (error) {
        console.error('Error loading rewards:', error);
        // Show fallback message
        rewardsGrid.innerHTML = '<div class="error-message">Unable to load rewards. Please try again later.</div>';
    }
}

// Function to display rewards in grid
function displayRewards() {
    const rewardsGrid = document.getElementById('rewardsGrid');
    
    const rewards = [
        {
            id: 1,
            name: "Amazon Gift Card",
            type: "Gift Card",
            description: "$25 Amazon Gift Card",
            cost: 1000,
            icon: "🎁",
            category: "gift-cards"
        },
        {
            id: 2,
            name: "Starbucks Gift Card",
            type: "Gift Card", 
            description: "$15 Starbucks Gift Card",
            cost: 600,
            icon: "🎁",
            category: "gift-cards"
        },
        {
            id: 3,
            name: "PlayStation 5",
            type: "Game Console",
            description: "Sony PlayStation 5 Console",
            cost: 50000,
            icon: "🎮",
            category: "electronics"
        }
    ];
    
    rewardsGrid.innerHTML = rewards.map(reward => {
        const categoryClass = getRewardCategoryClass(reward.category);
        
        return `
            <div class="reward-card ${categoryClass}" data-category="${reward.category}">
                <div class="reward-badge">${reward.id}</div>
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-info">
                    <h3>${reward.name}</h3>
                    <div class="reward-type">${reward.type}</div>
                    <div class="reward-description">${reward.description}</div>
                    <div class="reward-price">
                        <span class="coin-cost">${reward.cost.toLocaleString()}</span>
                        <span class="coin-symbol">🪙</span>
                    </div>
                    <button class="redeem-btn" onclick="redeemReward(${reward.id}, '${reward.name}', ${reward.cost})">Redeem</button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to get reward category class
function getRewardCategoryClass(category) {
    const categoryMap = {
        'gift-cards': 'reward-gift-cards',
        'electronics': 'reward-electronics', 
        'entertainment': 'reward-entertainment',
        'discounts': 'reward-discounts',
        'vouchers': 'reward-vouchers'
    };
    return categoryMap[category] || 'reward-general';
}

// Update coin balance in header
function updateHeaderCoinBalance() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.id) {
        loadUserCoinBalance(userData.id).then(() => {
            const headerCoinBalance = document.getElementById('headerCoinBalance');
            const summaryCoinsElement = document.getElementById('summaryCoins');
            if (headerCoinBalance && summaryCoinsElement) {
                headerCoinBalance.textContent = summaryCoinsElement.textContent;
            }
        });
    } else {
        // If no user data, sync from current summary display
        const headerCoinBalance = document.getElementById('headerCoinBalance');
        const summaryCoinsElement = document.getElementById('summaryCoins');
        if (headerCoinBalance && summaryCoinsElement) {
            headerCoinBalance.textContent = summaryCoinsElement.textContent;
        }
    }
}

// Close rewards panel
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'closeRewardsBtn'){
        document.getElementById('rewardsContent').style.display = 'none';
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.classList.remove('blur-active');
    }
});

// Update coin balance in rewards panel
function updateRewardsCoinBalance() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.id) {
        loadUserCoinBalance(userData.id).then(() => {
            const coinBalanceElement = document.getElementById('userCoinBalance');
            const summaryCoinsElement = document.getElementById('summaryCoins');
            if (coinBalanceElement && summaryCoinsElement) {
                coinBalanceElement.textContent = summaryCoinsElement.textContent;
            }
        });
    }
}

// Filter rewards by category
function filterRewards(category) {
    const rewardCards = document.querySelectorAll('.reward-card');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide reward cards based on category
    rewardCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Redeem reward function
async function redeemReward(rewardId, rewardName, cost) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) {
        alert('Please log in to redeem rewards.');
        return;
    }
    
    // Get current balance from the main dashboard (summaryCoins)
    const currentBalance = parseInt(document.getElementById('summaryCoins').textContent.replace(/,/g, '') || 0);
    
    // Check if user has enough coins
    if (currentBalance < cost) {
        alert(`Insufficient coins! You need ${cost.toLocaleString()} coins but only have ${currentBalance.toLocaleString()}.`);
        return;
    }
    
    // Confirm redemption
    const confirmMessage = `Are you sure you want to redeem "${rewardName}" for ${cost.toLocaleString()} coins?`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Call backend API to process redemption
        const response = await fetch(`${API_BASE}/api/users/${userData.id}/redeem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                rewardId: rewardId,
                rewardName: rewardName,
                cost: cost
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update coin balance in all locations
            const newBalance = data.newBalance || (currentBalance - cost);
            document.getElementById('summaryCoins').textContent = newBalance.toLocaleString();
            document.getElementById('headerCoinBalance').textContent = newBalance.toLocaleString();
            
            // Show success message with email confirmation
            const emailMessage = data.emailSent ? 
                `\n\n📧 A confirmation email has been sent to ${data.emailAddress}` : 
                '\n\n📧 Email confirmation will be sent shortly';
            
            alert(`🎉 Congratulations! You have successfully redeemed "${rewardName}"!\n\nYour new coin balance: ${newBalance.toLocaleString()} coins${emailMessage}\n\nYour reward will be processed and delivered to your registered email address.`);
            
            // Disable the redeem button for this reward
            const redeemBtn = event.target;
            redeemBtn.disabled = true;
            redeemBtn.textContent = 'Redeemed';
            redeemBtn.style.background = '#9ca3af';
            
        } else {
            const errorData = await response.json();
            alert(`Redemption failed: ${errorData.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('Redemption error:', error);
        
        // Fallback: Update balance locally (for demo purposes)
        const newBalance = currentBalance - cost;
        document.getElementById('summaryCoins').textContent = newBalance.toLocaleString();
        document.getElementById('headerCoinBalance').textContent = newBalance.toLocaleString();
        
        alert(`🎉 Demo Mode: You have successfully redeemed "${rewardName}"!\n\nYour new coin balance: ${newBalance.toLocaleString()} coins\n\nNote: This is a demo. In a real system, your reward would be processed.`);
        
        // Disable the redeem button
        const redeemBtn = event.target;
        redeemBtn.disabled = true;
        redeemBtn.textContent = 'Redeemed';
        redeemBtn.style.background = '#9ca3af';
    }
}

// Award coins for QR code scanning (called from QR scanner)
function awardCoinsForScanning(amount = 50) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) return;
    
    // Update coin balance
    const currentBalance = parseInt(document.getElementById('summaryCoins').textContent.replace(/,/g, '') || 0);
    const newBalance = currentBalance + amount;
    
    document.getElementById('summaryCoins').textContent = newBalance.toLocaleString();
    
    // Update rewards panel if it's open
    const rewardsBalance = document.getElementById('userCoinBalance');
    if (rewardsBalance) {
        rewardsBalance.textContent = newBalance.toLocaleString();
    }
    
    // Persist to backend so coins are recorded in the database
    // Reuse the same endpoint used elsewhere for coin updates
    updateUserCoinBalance(userData.id, amount);
    
    // Show notification
    showCoinNotification(amount, newBalance);
}

// Show coin earning notification
function showCoinNotification(earned, newTotal) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 15px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        font-weight: bold;
        animation: slideIn 0.5s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">🪙</span>
            <div>
                <div>+${earned} Coins Earned!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Total: ${newTotal.toLocaleString()}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);