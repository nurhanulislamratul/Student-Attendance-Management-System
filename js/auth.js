// Authentication related functions
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '../index.html';
        return null;
    }
    return JSON.parse(currentUser);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // In a real application, you would validate against a server
            // For demo, we'll just store in localStorage
            const teacher = {
                username,
                name: username // In real app, this would come from server
            };
            
            localStorage.setItem('currentUser', JSON.stringify(teacher));
            window.location.href = 'dashboard.html';
        });
    }
});

// Check authentication on non-login pages
const currentUser = checkAuth();
if (currentUser) {
    // Update UI with user info
    const teacherNameElement = document.getElementById('teacherName');
    if (teacherNameElement) {
        teacherNameElement.textContent = currentUser.name || currentUser.username;
    }
}
