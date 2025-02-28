document.addEventListener('DOMContentLoaded', () => {
    // Initialize date inputs with default values
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
    document.getElementById('endDate').valueAsDate = today;

    loadSubjects();
    loadRecords();
    setupEventListeners();
});

function setupEventListeners() {
    // Filter change listeners
    document.getElementById('subjectFilter').addEventListener('change', loadRecords);
    document.getElementById('startDate').addEventListener('change', loadRecords);
    document.getElementById('endDate').addEventListener('change', loadRecords);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportRecords);
    
    // Modal close button
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('recordDetailsModal').style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

function loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const subjectFilter = document.getElementById('subjectFilter');
    
    // Clear existing options except the first one
    while (subjectFilter.options.length > 1) {
        subjectFilter.remove(1);
    }
    
    // Add subject options
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectFilter.appendChild(option);
    });
}

function loadRecords() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const filteredRecords = filterRecords(records);
    const tableBody = document.getElementById('recordsTableBody');
    
    if (filteredRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No attendance records found</td>
            </tr>
        `;
        updateSummary(filteredRecords);
        return;
    }

    // Sort records by date (most recent first)
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = '';
    filteredRecords.forEach(record => {
        const attendanceCount = record.attendees ? record.attendees.length : 0;
        const totalStudents = record.totalStudents || 0;
        const percentage = totalStudents > 0 ? Math.round((attendanceCount / totalStudents) * 100) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.subjectName}</td>
            <td>${attendanceCount}/${totalStudents}</td>
            <td>${percentage}%</td>
            <td>
                <button class="btn-icon" onclick="viewRecordDetails('${record.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    updateSummary(filteredRecords);
}

function filterRecords(records) {
    const subjectId = document.getElementById('subjectFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    return records.filter(record => {
        const matchesSubject = !subjectId || record.subjectId === subjectId;
        const recordDate = new Date(record.date).setHours(0, 0, 0, 0);
        const matchesStartDate = !startDate || recordDate >= new Date(startDate).setHours(0, 0, 0, 0);
        const matchesEndDate = !endDate || recordDate <= new Date(endDate).setHours(0, 0, 0, 0);
        
        return matchesSubject && matchesStartDate && matchesEndDate;
    });
}

function updateSummary(records) {
    let totalStudents = new Set();
    let totalAttendance = 0;
    let totalPossibleAttendance = 0;
    
    records.forEach(record => {
        if (record.attendees) {
            record.attendees.forEach(studentId => totalStudents.add(studentId));
            totalAttendance += record.attendees.length;
        }
        if (record.absentees) {
            record.absentees.forEach(studentId => totalStudents.add(studentId));
        }
        totalPossibleAttendance += record.totalStudents || 0;
    });
    
    document.getElementById('totalStudentsCount').textContent = totalStudents.size;
    document.getElementById('averageAttendance').textContent = 
        totalPossibleAttendance > 0 
            ? Math.round((totalAttendance / totalPossibleAttendance) * 100) + '%' 
            : '0%';
    document.getElementById('totalClasses').textContent = records.length;
}

function viewRecordDetails(recordId) {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const record = records.find(r => r.id === recordId);
    
    
    if (record) {
        let students = JSON.parse(localStorage.getItem('students')) || [];
        students = students.filter(student => student.subjects && student.subjects.includes(record.subjectId));
        
        const presentStudents = students.filter(student => record.attendees.includes(student.id));
        const absentStudents = students.filter(student => !record.attendees.includes(student.id));
        
        const modalContent = document.getElementById('recordDetailsContent');
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3><i class="fas fa-clipboard-list"></i> Attendance Details</h3>
            </div>
            <div class="record-details">
                <div class="detail-item">
                    <strong>Date:</strong> ${formatDate(record.date)}
                </div>
                <div class="detail-item">
                    <strong>Subject:</strong> ${record.subjectName}
                </div>
                <div class="detail-item">
                    <strong>Total Students:</strong> ${record.totalStudents}
                </div>
                <div class="detail-item">
                    <strong>Attendance:</strong> ${record.attendees.length}/${record.totalStudents} 
                    (${Math.round((record.attendees.length / record.totalStudents) * 100)}%)
                </div>
            </div>
            <div class="attendance-lists">
                <div class="present-list">
                    <h4><i class="fas fa-check-circle"></i> Present Students (${presentStudents.length})</h4>
                    ${presentStudents.length > 0 ? `
                        <ul>
                            ${presentStudents.map(student => `
                                <li>${student.name} (Roll No: ${student.rollNumber || 'No Roll Number'})</li>
                            `).join('')}
                        </ul>
                    ` : '<p>No students present</p>'}
                </div>
                <div class="absent-list">
                    <h4><i class="fas fa-times-circle"></i> Absent Students (${absentStudents.length})</h4>
                    ${absentStudents.length > 0 ? `
                        <ul>
                            ${absentStudents.map(student => `
                                <li>${student.name} (Roll No: ${student.rollNumber || 'No Roll Number'})</li>
                            `).join('')}
                        </ul>
                    ` : '<p>No students absent</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('recordDetailsModal').style.display = 'block';
    }
}

function exportRecords() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const filteredRecords = filterRecords(records);
    
    if (filteredRecords.length === 0) {
        alert('No records to export');
        return;
    }
    
    const csvContent = [
        ['Date', 'Subject', 'Total Students', 'Present', 'Percentage'],
        ...filteredRecords.map(record => [
            formatDate(record.date),
            record.subjectName,
            record.totalStudents,
            record.attendees.length,
            `${Math.round((record.attendees.length / record.totalStudents) * 100)}%`
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_records_${formatDate(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
