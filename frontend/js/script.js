// Get DOM elements
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
            const response = await fetch('/api/auth/register', {
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
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
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

// Handle Forgot Password
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    
    const email = prompt('Please enter your email address:');
    
    if (email) {
        const storedUser = localStorage.getItem('user_' + email);
        
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            alert(`Password reset link sent to ${email}!\n\nFor demo purposes, your password is: ${userData.password}`);
        } else {
            alert('No account found with this email address.');
        }
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
        if(buttonText === 'Rewards'){
            alert('Under Construction');
        }
        // Dashboard and Bins buttons can be handled here later
    }
});