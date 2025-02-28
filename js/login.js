document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Check for remembered credentials
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const { username, password } = JSON.parse(rememberedUser);
        usernameInput.value = username;
        passwordInput.value = password;
        rememberMeCheckbox.checked = true;
    }

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous error messages
        errorMessageDiv.textContent = '';
        errorMessageDiv.style.display = 'none';

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showError('Please enter both username and password.');
            return;
        }

        try {
            // In a real application, you would validate against a server
            // For demo purposes, we'll just check if the user exists in localStorage
            const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
            const teacher = teachers.find(t => t.username === username);

            if (!teacher || teacher.password !== password) {
                showError('Invalid username or password.');
                return;
            }

            // Handle remember me
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedUser', JSON.stringify({ username, password }));
            } else {
                localStorage.removeItem('rememberedUser');
            }

            // Store current user
            const currentUser = {
                id: teacher.id,
                username: teacher.username,
                name: teacher.name
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Add login activity
            addActivity('login', {
                name: teacher.name,
                time: new Date().toISOString()
            });

            // Redirect to dashboard
            window.location.href = 'pages/dashboard.html';

        } catch (error) {
            showError('An error occurred during login. Please try again.');
            console.error('Login error:', error);
        }
    });

    // Error handling function
    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    // Function to add activity
    function addActivity(action, details) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        const activity = {
            id: generateId(),
            action,
            details,
            timestamp: new Date().toISOString()
        };
        activities.unshift(activity);
        
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.pop();
        }
        
        localStorage.setItem('activities', JSON.stringify(activities));
    }

    // Function to generate id
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
});
