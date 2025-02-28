document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    setupEventListeners();
});

function setupEventListeners() {
    // Add student button
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        openModal();
    });

    // Save student form
    document.getElementById('studentForm').addEventListener('submit', saveStudent);

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    };
}

function loadStudents() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const tableBody = document.getElementById('studentsTableBody');
    
    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No students found</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    students.forEach(student => {
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const studentSubjects = subjects
            .filter(subject => student.subjects && student.subjects.includes(subject.id))
            .map(subject => subject.name)
            .join(', ');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.rollNumber || '-'}</td>
            <td>${student.name}</td>
            <td class="subjects-cell">${studentSubjects || 'No subjects'}</td>
            <td class="actions-cell">
                <button class="btn-icon" onclick="editStudent('${student.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteStudent('${student.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function loadSubjectCheckboxes(selectedSubjects = []) {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const container = document.getElementById('subjectCheckboxes');
    
    container.innerHTML = '';
    subjects.forEach(subject => {
        const div = document.createElement('div');
        div.className = 'subject-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="subject_${subject.id}" 
                value="${subject.id}" 
                ${selectedSubjects.includes(subject.id) ? 'checked' : ''}>
            <label for="subject_${subject.id}">${subject.name}</label>
        `;
        container.appendChild(div);
    });
}

function openModal(studentId = null) {
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('studentForm');
    const nameInput = document.getElementById('studentName');
    const rollInput = document.getElementById('rollNumber');

    if (studentId) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const student = students.find(s => s.id === studentId);
        if (student) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Student';
            nameInput.value = student.name;
            rollInput.value = student.rollNumber || '';
            loadSubjectCheckboxes(student.subjects || []);
            form.dataset.editingId = studentId;
        }
    } else {
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Add Student';
        form.reset();
        form.removeAttribute('data-editing-id');
        loadSubjectCheckboxes();
    }

    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('studentModal');
    modal.style.display = 'none';
}

function saveStudent(event) {
    event.preventDefault();
    
    const studentName = document.getElementById('studentName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const selectedSubjects = Array.from(document.querySelectorAll('#subjectCheckboxes input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const editingId = document.getElementById('studentForm').dataset.editingId;
    
    if (editingId) {
        // Editing existing student
        const studentIndex = students.findIndex(s => s.id === editingId);
        if (studentIndex !== -1) {
            students[studentIndex] = {
                ...students[studentIndex],
                name: studentName,
                rollNumber: rollNumber,
                subjects: selectedSubjects
            };
            // Track edit activity
            addActivity('student_edit', {
                name: studentName,
                rollNumber: rollNumber
            });
        }
    } else {
        // Adding new student
        const newStudent = {
            id: generateId(),
            name: studentName,
            rollNumber: rollNumber,
            subjects: selectedSubjects
        };
        students.push(newStudent);
        // Track add activity
        addActivity('student_add', {
            name: studentName,
            rollNumber: rollNumber
        });
    }
    
    localStorage.setItem('students', JSON.stringify(students));
    closeModal();
    loadStudents();
    messageDialog.show({
        type: 'success',
        title: 'Success',
        message: `Student ${editingId ? 'updated' : 'added'} successfully!`,
        showCancel: false
    });
}

function deleteStudent(studentId) {
    messageDialog.show({
        type: 'warning',
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this student? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => {
            const students = JSON.parse(localStorage.getItem('students')) || [];
            const studentToDelete = students.find(s => s.id === studentId);
            const updatedStudents = students.filter(student => student.id !== studentId);
            
            localStorage.setItem('students', JSON.stringify(updatedStudents));
            
            // Track delete activity
            if (studentToDelete) {
                addActivity('student_delete', {
                    name: studentToDelete.name,
                    rollNumber: studentToDelete.rollNumber
                });
            }
            
            loadStudents();
            messageDialog.show({
                type: 'success',
                title: 'Success',
                message: 'Student deleted successfully!',
                showCancel: false
            });
        }
    });
}

function editStudent(studentId) {
    // Open modal in edit mode
    openModal(studentId);
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
