/**
 * Creates a consistent navigation bar across pages
 */
function createNavbar() {
    // Get the current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const navbar = document.createElement('nav');
    navbar.className = 'navbar navbar-expand-lg navbar-dark bg-primary mb-4';
    
    navbar.innerHTML = `
        <div class="container-fluid">
            <a class="navbar-brand" href="index.html">TCG Card Manager</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}" 
                           href="index.html">Card Search</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${currentPage === 'pricing.html' ? 'active' : ''}" 
                           href="pricing.html">Pricing Tool</a>
                    </li>
                </ul>
            </div>
        </div>
    `;
    
    // Find the first element in the body to insert before
    const firstElement = document.body.firstChild;
    document.body.insertBefore(navbar, firstElement);
    
    // Add Bootstrap JS for mobile menu toggle
    if (!document.querySelector('script[src*="bootstrap.bundle.min.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
        document.body.appendChild(script);
    }
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', createNavbar);
