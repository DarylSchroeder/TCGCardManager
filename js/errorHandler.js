/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

class ErrorHandler {
    static showError(message, type = 'error') {
        // Remove any existing error messages
        const existingErrors = document.querySelectorAll('.error-toast');
        existingErrors.forEach(error => error.remove());
        
        // Create error toast
        const errorToast = document.createElement('div');
        errorToast.className = `alert alert-${type === 'error' ? 'danger' : 'warning'} error-toast`;
        errorToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Sanitize message content
        errorToast.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.onclick = () => errorToast.remove();
        errorToast.appendChild(closeBtn);
        
        document.body.appendChild(errorToast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorToast.parentNode) {
                errorToast.remove();
            }
        }, 5000);
        
        // Log error for debugging (but don't expose sensitive data)
        console.error(`[${type.toUpperCase()}] ${message}`);
    }
    
    static showSuccess(message) {
        this.showError(message, 'success');
    }
    
    static handleApiError(error) {
        let message = 'An unexpected error occurred';
        
        if (error.message) {
            // Sanitize error message to prevent XSS
            message = error.message.replace(/<[^>]*>/g, '');
        }
        
        this.showError(message);
    }
    
    static validateInput(value, type, min = null, max = null) {
        switch (type) {
            case 'quantity':
                const qty = parseInt(value);
                if (isNaN(qty) || qty < 1 || qty > 9999) {
                    throw new Error('Quantity must be between 1 and 9999');
                }
                return qty;
                
            case 'price':
                const price = parseFloat(value);
                if (isNaN(price) || price < 0 || price > 99999.99) {
                    throw new Error('Price must be between $0.00 and $99,999.99');
                }
                return price;
                
            default:
                return value;
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Make globally available
window.ErrorHandler = ErrorHandler;
