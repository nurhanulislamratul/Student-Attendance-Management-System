class MessageDialog {
    constructor() {
        this.createDialog();
    }

    createDialog() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'message-dialog-overlay';

        // Create dialog
        this.dialog = document.createElement('div');
        this.dialog.className = 'message-dialog';

        // Create content container
        this.content = document.createElement('div');
        this.content.className = 'message-dialog-content';

        // Add to DOM
        this.dialog.appendChild(this.content);
        this.overlay.appendChild(this.dialog);
        document.body.appendChild(this.overlay);

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }

    show({
        type = 'warning',
        title = '',
        message = '',
        confirmText = 'OK',
        cancelText = 'Cancel',
        showCancel = true,
        onConfirm = () => {},
        onCancel = () => {}
    } = {}) {
        // Set content
        this.content.innerHTML = `
            <div class="message-dialog-icon ${type}">
                <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 
                                 type === 'error' ? 'times-circle' : 
                                 'check-circle'}"></i>
            </div>
            <div class="message-dialog-title">${title}</div>
            <div class="message-dialog-message">${message}</div>
            <div class="message-dialog-buttons">
                ${showCancel ? `
                    <button class="message-dialog-btn cancel">${cancelText}</button>
                ` : ''}
                <button class="message-dialog-btn confirm">${confirmText}</button>
            </div>
        `;

        // Add button event listeners
        const confirmBtn = this.content.querySelector('.confirm');
        confirmBtn.addEventListener('click', () => {
            this.hide();
            onConfirm();
        });

        if (showCancel) {
            const cancelBtn = this.content.querySelector('.cancel');
            cancelBtn.addEventListener('click', () => {
                this.hide();
                onCancel();
            });
        }

        // Show dialog
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
        });

        // Add escape key listener
        this.escListener = (e) => {
            if (e.key === 'Escape') {
                this.hide();
                onCancel();
            }
        };
        document.addEventListener('keydown', this.escListener);
    }

    hide() {
        this.overlay.classList.remove('active');
        document.removeEventListener('keydown', this.escListener);
    }
}

// Create global instance
window.messageDialog = new MessageDialog();
