document.addEventListener('DOMContentLoaded', () => {
    // Load existing subjects
    loadSubjects();
    
    // Set up event listeners
    const form = document.getElementById('addSubjectForm');
    form.addEventListener('submit', handleFormSubmit);
    
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => closeModal('addSubjectModal'));
    });
});

let currentEditingId = null; // To track if we're editing or adding

function loadSubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const tableBody = document.getElementById('subjectsTableBody');
    
    if (subjects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No subjects found</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subject.code || '-'}</td>
            <td>${subject.name}</td>
            <td class="description-cell">${subject.description || '-'}</td>
            <td class="actions-cell">
                <button class="btn-icon" onclick="editSubject('${subject.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteSubject('${subject.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const subjectData = {
        name: document.getElementById('subjectName').value.trim(),
        code: document.getElementById('subjectCode').value.trim(),
        description: document.getElementById('subjectDescription').value.trim()
    };

    if (!validateSubject(subjectData.name, currentEditingId)) {
        return;
    }

    if (currentEditingId) {
        // Update existing subject
        updateSubject(currentEditingId, subjectData);
    } else {
        // Add new subject
        addSubject(subjectData);
    }
}

function addSubject(subjectData) {
    // Add ID for new subject
    subjectData.id = generateId();
    
    // Get existing subjects and add new one
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    
    subjects.push(subjectData);
    localStorage.setItem('subjects', JSON.stringify(subjects));

    // Track add activity
    addActivity('subject_add', {
        name: subjectData.name,
        code: subjectData.code
    });

    // Reset form and close modal
    resetForm();
    closeModal('addSubjectModal');

    // Reload subjects table
    loadSubjects();

    messageDialog.show({
        type: 'success',
        title: 'Success',
        message: 'Subject added successfully!',
        showCancel: false
    });
}

function updateSubject(subjectId, subjectData) {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const subjectIndex = subjects.findIndex(s => s.id === subjectId);
    
    if (subjectIndex !== -1) {
        subjects[subjectIndex] = {
            ...subjects[subjectIndex],
            ...subjectData
        };
        
        localStorage.setItem('subjects', JSON.stringify(subjects));
        
        // Track edit activity
        addActivity('subject_edit', {
            name: subjectData.name,
            code: subjectData.code
        });
        
        // Reset form and close modal
        resetForm();
        closeModal('addSubjectModal');
        
        // Reload subjects table
        loadSubjects();
        
        messageDialog.show({
            type: 'success',
            title: 'Success',
            message: 'Subject updated successfully!',
            showCancel: false
        });
    }
}

function deleteSubject(subjectId) {
    messageDialog.show({
        type: 'warning',
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this subject?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => {
            let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
            const subjectToDelete = subjects.find(s => s.id === subjectId);
            subjects = subjects.filter(subject => subject.id !== subjectId);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            
            // Track delete activity
            if (subjectToDelete) {
                addActivity('subject_delete', {
                    name: subjectToDelete.name,
                    code: subjectToDelete.code
                });
            }
            
            loadSubjects();
            messageDialog.show({
                type: 'success',
                title: 'Success',
                message: 'Subject deleted successfully!',
                showCancel: false
            });
        }
    });
}

function editSubject(subjectId) {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const subject = subjects.find(s => s.id === subjectId);
    
    if (subject) {
        // Set current editing ID
        currentEditingId = subjectId;
        
        // Populate form with subject data
        document.getElementById('subjectName').value = subject.name;
        document.getElementById('subjectCode').value = subject.code || '';
        document.getElementById('subjectDescription').value = subject.description || '';
        
        // Update modal title and button
        const modalTitle = document.querySelector('#addSubjectModal .modal-header h3');
        const submitButton = document.querySelector('#addSubjectForm button[type="submit"]');
        
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Subject';
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Update Subject';
        }
        
        // Show modal
        openModal('addSubjectModal');
    }
}

function resetForm() {
    const form = document.getElementById('addSubjectForm');
    form.reset();
    currentEditingId = null;
    
    // Reset modal title and button
    const modalTitle = document.querySelector('#addSubjectModal .modal-header h3');
    const submitButton = document.querySelector('#addSubjectForm button[type="submit"]');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-book-medical"></i> Add New Subject';
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-check"></i> Add Subject';
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function validateSubject(name, editingId = null) {
    if (!name.trim()) {
        messageDialog.show({
            type: 'error',
            title: 'Error',
            message: 'Subject name is required!',
            showCancel: false
        });
        return false;
    }

    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const exists = subjects.some(subject => 
        subject.name.toLowerCase() === name.toLowerCase() && 
        subject.id !== editingId
    );

    if (exists) {
        messageDialog.show({
            type: 'error',
            title: 'Error',
            message: 'A subject with this name already exists!',
            showCancel: false
        });
        return false;
    }

    return true;
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

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        if (!currentEditingId) {
            resetForm();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        resetForm();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        resetForm();
    }
};
