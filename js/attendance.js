document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();
    setupEventListeners();
});

function setupEventListeners() {
    // Subject selection change
    document.getElementById('subjectSelect').addEventListener('change', loadStudentList);
    
    // Date selection change
    document.getElementById('attendanceDate').addEventListener('change', loadStudentList);
    
    // Save attendance button
    document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendance);
    
    // Date input - set to today by default
    const dateInput = document.getElementById('attendanceDate');
    dateInput.valueAsDate = new Date();
}

function loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const subjectSelect = document.getElementById('subjectSelect');
    
    subjectSelect.innerHTML = '<option value="">Choose a subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
    });
}

function loadStudentList() {
    const subjectId = document.getElementById('subjectSelect').value;
    const selectedDate = document.getElementById('attendanceDate').value;
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const tableBody = document.getElementById('attendanceTableBody');
    
    if (!subjectId) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">Please select a subject first</td>
            </tr>
        `;
        return;
    }
    
    // Filter students who are enrolled in the selected subject
    const enrolledStudents = students.filter(student => 
        student.subjects && student.subjects.includes(subjectId)
    );
    
    if (enrolledStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">No students enrolled in this subject</td>
            </tr>
        `;
        return;
    }

    // Get existing attendance record for this date and subject
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const existingRecord = records.find(record => 
        record.date === selectedDate && record.subjectId === subjectId
    );



    tableBody.innerHTML = '';
    enrolledStudents.forEach(student => {
        // Check if student was present in existing record
        const isPresent = existingRecord ? existingRecord.attendees.includes(student.id) : false;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.rollNumber || '-'}</td>
            <td>${student.name}</td>
            <td class="text-center">
                <input type="checkbox" id="attendance_${student.id}" class="attendance-checkbox" ${isPresent ? 'checked' : ''}>
                <label for="attendance_${student.id}" class="attendance-label"></label>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update save button text based on whether we're editing or creating
    const saveBtn = document.getElementById('saveAttendanceBtn');
    if (existingRecord) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Attendance';
    } else {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Attendance';
    }
}

function getPresentStudentsList(presentIds, allStudents) {
    return presentIds.map(id => {
        const student = allStudents.find(s => s.id === id);
        return student ? `<div>${student.name} (${student.rollNumber || '-'})</div>` : '';
    }).join('');
}

function getAbsentStudentsList(absentIds, allStudents) {
    return absentIds.map(id => {
        const student = allStudents.find(s => s.id === id);
        return student ? `<div>${student.name} (${student.rollNumber || '-'})</div>` : '';
    }).join('');
}

function validateAttendanceForm() {
    const subjectId = document.getElementById('subjectSelect').value;
    const date = document.getElementById('attendanceDate').value;

    if (!subjectId || !date) {
        messageDialog.show({
            type: 'error',
            title: 'Error',
            message: 'Please select subject and date',
            showCancel: false
        });
        return false;
    }

    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!subject) {
        messageDialog.show({
            type: 'error',
            title: 'Error',
            message: 'Selected subject not found',
            showCancel: false
        });
        return false;
    }

    return true;
}

function saveAttendance(event) {
    event.preventDefault();
    
    if (!validateAttendanceForm()) {
        return;
    }

    const subjectId = document.getElementById('subjectSelect').value;
    const date = document.getElementById('attendanceDate').value;
    
    if (!subjectId || !date) {
        messageDialog.show({
            type: 'error',
            title: 'Error',
            message: 'Please select subject and date',
            showCancel: false
        });
        return;
    }
    
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!subject) {
        messageDialog.show({
            type: 'error',
            title: 'Error',
            message: 'Selected subject not found',
            showCancel: false
        });
        return;
    }
    
    // Get enrolled students for this subject
    const enrolledStudents = students.filter(student => 
        student.subjects && student.subjects.includes(subjectId)
    );
    
    // Collect attendance data
    const attendees = [];
    const absentees = [];
    
    enrolledStudents.forEach(student => {
        const checkbox = document.getElementById(`attendance_${student.id}`);
        if (checkbox && checkbox.checked) {
            attendees.push(student.id);
        } else if (checkbox) {
            absentees.push(student.id);
        }
    });
    
    // Create attendance record
    const attendanceRecord = {
        id: generateId(),
        date: date,
        subjectId: subject.id,
        subjectName: subject.name,
        attendees,
        absentees,
        totalStudents: enrolledStudents.length,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    
    // Check for duplicate entry
    const existingRecord = records.find(r => 
        r.date === date && r.subjectId === subjectId
    );
    
    if (existingRecord) {
        messageDialog.show({
            type: 'warning',
            title: 'Duplicate Record',
            message: 'Attendance record already exists for this date and subject. Do you want to update it?',
            confirmText: 'Update',
            cancelText: 'Cancel',
            onConfirm: () => {
                // Update existing record
                Object.assign(existingRecord, attendanceRecord);
                localStorage.setItem('attendanceRecords', JSON.stringify(records));
                
                // Track attendance activity
                addActivity('attendance', {
                    subjectName: subject.name,
                    date: date,
                    present: attendees.length,
                    total: enrolledStudents.length
                });
                
                // Show success message
                messageDialog.show({
                    type: 'success',
                    title: 'Success',
                    message: 'Attendance updated successfully!',
                    showCancel: false
                });
                
                // Update button text
                const saveBtn = document.getElementById('saveAttendanceBtn');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Attendance';
            }
        });
        return;
    }
    
    // Add new record
    records.push(attendanceRecord);
    localStorage.setItem('attendanceRecords', JSON.stringify(records));
    
    // Track attendance activity
    addActivity('attendance', {
        subjectName: subject.name,
        date: date,
        present: attendees.length,
        total: enrolledStudents.length
    });
    
    // Show success message
    messageDialog.show({
        type: 'success',
        title: 'Success',
        message: 'Attendance saved successfully!',
        showCancel: false
    });
    
    // Update button text
    const saveBtn = document.getElementById('saveAttendanceBtn');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Attendance';
}

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

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
