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
signupFormElement.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Basic validation
    if (firstName && lastName && email && password) {
        // Store user data in localStorage (for demo purposes)
        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password // In real app, never store plain text passwords!
        };
        
        localStorage.setItem('user_' + email, JSON.stringify(userData));
        
        alert('Registration successful! You can now sign in.');
        
        // Switch to sign in form
        signInForm.style.display = 'block';
        signUpForm.style.display = 'none';
        
        // Clear form
        signupFormElement.reset();
    } else {
        alert('Please fill in all fields.');
    }
});

// Handle Sign In form submission
signinFormElement.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    
    // Check if user exists in localStorage
    const storedUser = localStorage.getItem('user_' + email);
    
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        if (userData.password === password) {
            alert(`Welcome back, ${userData.firstName}!`);
            // Here you would typically redirect to a dashboard or main app
            // For now, we'll just show a success message
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: 'Poppins', sans-serif;">
                    <h1>Welcome to Smart Waste Management System!</h1>
                    <p>Hello, ${userData.firstName} ${userData.lastName}</p>
                    <p>You have successfully signed in.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; background: rgb(125,125,235); color: white; border: none; border-radius: 5px; cursor: pointer;">Back to Login</button>
                </div>
            `;
        } else {
            alert('Invalid password. Please try again.');
        }
    } else {
        alert('No account found with this email. Please sign up first.');
    }
});

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
        alert(`${platform} login is not implemented in this demo.`);
    });
});