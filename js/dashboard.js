let user;
// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    updateWelcomeMessage();
    // Refresh dashboard every minute
    setInterval(loadDashboard, 60000);
});

function loadDashboard() {
    updateWelcomeMessage(); // Update time every minute
    loadTodayAttendance();
    loadLastUpdated();
    loadRecentActivity();
}

function updateWelcomeMessage() {
    // Get teacher's name from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const allUser = JSON.parse(localStorage.getItem('teachers'));
    user = allUser.find(u => u.username === currentUser.username);

    const teacherNameElement = document.getElementById('teacherName');
    teacherNameElement.textContent = user.fullName || user.name;

    // Update current date
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

function loadTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const todayRecords = records.filter(record => record.date === today);
    const list = document.getElementById('todayAttendanceList');

    if (!list) return; // Guard clause if element doesn't exist

    if (todayRecords.length === 0) {
        list.innerHTML = '<div class="no-data">No attendance records for today</div>';
        return;
    }

    list.innerHTML = '';
    todayRecords.forEach(record => {
        const li = document.createElement('li');
        li.className = 'attendance-item';
        li.innerHTML = `
            <span class="attendance-subject">${record.subjectName}</span>
            <span class="attendance-count">
                ${record.attendees.length}/${record.totalStudents}
            </span>
        `;
        list.appendChild(li);
    });
}

function loadLastUpdated() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const list = document.getElementById('lastUpdatedList');

    if (!list) return; // Guard clause if element doesn't exist

    if (records.length === 0) {
        list.innerHTML = '<div class="no-data">No attendance records found</div>';
        return;
    }

    // Sort records by timestamp, most recent first
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take only the last 5 records
    const recentRecords = records.slice(0, 5);

    list.innerHTML = '';
    recentRecords.forEach(record => {
        const li = document.createElement('li');
        li.className = 'attendance-item';
        const updateTime = new Date(record.timestamp);
        li.innerHTML = `
            <span class="attendance-subject">${record.subjectName}</span>
            <span class="activity-time">${formatTimeAgo(updateTime)}</span>
        `;
        list.appendChild(li);
    });
}

function loadRecentActivity() {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const list = document.getElementById('activityList');

    if (!list) return; // Guard clause if element doesn't exist

    if (activities.length === 0) {
        list.innerHTML = '<div class="no-data">No recent activity</div>';
        return;
    }

    // Take only the last 10 activities
    const recentActivities = activities.slice(0, 10);

    list.innerHTML = '';
    recentActivities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        const activityTime = new Date(activity.timestamp);
        

        let icon, actionText;
        switch (activity.action) {
            case 'attendance':
                icon = 'clipboard-check';
                actionText = `Marked attendance for ${activity.details.subjectName}`;
                break;
            case 'student_add':
                icon = 'user-plus';
                actionText = `Added new student: ${activity.details.name}`;
                break;
            case 'student_edit':
                icon = 'user-edit';
                actionText = `Updated student: ${activity.details.name}`;
                break;
            case 'student_delete':
                icon = 'user-minus';
                actionText = `Removed student: ${activity.details.name}`;
                break;
            case 'subject_add':
                icon = 'book';
                actionText = `Added new subject: ${activity.details.name}`;
                break;
            case 'subject_edit':
                icon = 'edit';
                actionText = `Updated subject: ${activity.details.name}`;
                break;
            case 'subject_delete':
                icon = 'trash';
                actionText = `Removed subject: ${activity.details.name}`;
                break;
            case 'login':
                icon = 'sign-in-alt';
                actionText = `User logged in: ${user.username || 'unknown user'}`;
                break;
            default:
                icon = 'info-circle';
                actionText = activity.details;
        }

        li.innerHTML = `
            <div class="activity-content">
                <i class="fas fa-${icon}"></i>
                <span>${actionText}</span>
            </div>
            <span class="activity-time">${formatTimeAgo(activityTime)}</span>
        `;
        list.appendChild(li);
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }
    
    return date.toLocaleDateString();
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function addActivity(action, details) {
    const activities = JSON.parse(localStorage.getItem('activities')) || [];
    const activity = {
        id: generateId(),
        action,
        details,
        timestamp: new Date().toISOString()
    };
    activities.unshift(activity); // Add to beginning of array
    
    // Keep only last 50 activities
    if (activities.length > 50) {
        activities.pop();
    }
    
    localStorage.setItem('activities', JSON.stringify(activities));
}
