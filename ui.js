// UI management and theme handling
class UIManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.statusMessageTimeout = null;
        this.isSidebarCollapsed = false;
        this.isDirectionsCollapsed = true;
    }

    // Initialize theme
    initializeTheme() {
        this.setTheme(this.currentTheme);
        this.updateThemeIcon();
    }

    // Toggle between light and dark themes
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
        this.updateThemeIcon();
        localStorage.setItem('theme', this.currentTheme);
    }

    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    // Update theme toggle icon
    updateThemeIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    // Toggle sidebar
    toggleSidebar() {
        const controlPanel = document.getElementById('controlPanel');
        const appTitle = document.querySelector('.app-title');
        
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        
        if (this.isSidebarCollapsed) {
            controlPanel.classList.add('collapsed');
            if (appTitle) appTitle.style.opacity = '0';
        } else {
            controlPanel.classList.remove('collapsed');
            if (appTitle) appTitle.style.opacity = '1';
        }
        
        // Trigger map resize after animation
        setTimeout(() => {
            if (window.map) {
                window.map.invalidateSize();
            }
        }, 300);
    }

    // Toggle directions panel
    toggleDirections() {
        const directionsPanel = document.getElementById('directionsPanel');
        const toggleIcon = document.querySelector('.directions-toggle-icon');
        
        this.isDirectionsCollapsed = !this.isDirectionsCollapsed;
        
        if (this.isDirectionsCollapsed) {
            directionsPanel.classList.add('collapsed');
            directionsPanel.classList.remove('show');
            if (toggleIcon) toggleIcon.textContent = '▲';
        } else {
            directionsPanel.classList.remove('collapsed');
            directionsPanel.classList.add('show');
            if (toggleIcon) toggleIcon.textContent = '▼';
        }
    }

    // Show directions panel
    showDirections() {
        const directionsPanel = document.getElementById('directionsPanel');
        directionsPanel.classList.add('show');
        this.isDirectionsCollapsed = false;
        const toggleIcon = document.querySelector('.directions-toggle-icon');
        if (toggleIcon) toggleIcon.textContent = '▼';
    }

    // Show status message
    showStatusMessage(message, type = 'info', duration = 4000) {
        const statusContainer = document.getElementById('statusMessages');
        
        // Clear existing timeout
        if (this.statusMessageTimeout) {
            clearTimeout(this.statusMessageTimeout);
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `status-message ${type}`;
        messageElement.textContent = message;

        // Add to container
        statusContainer.appendChild(messageElement);

        // Auto-remove after duration
        this.statusMessageTimeout = setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        statusContainer.removeChild(messageElement);
                    }
                }, 300);
            }
        }, duration);

        // Add click to dismiss
        messageElement.addEventListener('click', () => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        statusContainer.removeChild(messageElement);
                    }
                }, 300);
            }
        });
    }

    // Animate button press
    animateButtonPress(buttonElement) {
        buttonElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            buttonElement.style.transform = '';
        }, 100);
    }

    // Update control panel based on route state
    updateControlPanel(hasRoute, isCalculating = false) {
        const dijkstraBtn = document.getElementById('dijkstra');
        // const astarBtn = document.getElementById('astar');
        
        if (isCalculating) {
            dijkstraBtn.disabled = true;
            // astarBtn.disabled = true;
            dijkstraBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Calculating...</span>';
            // astarBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Calculating...</span>';
        } else {
            dijkstraBtn.disabled = !hasRoute;
            // astarBtn.disabled = !hasRoute;
            dijkstraBtn.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Dijkstra\'s Algorithm</span>';
            // astarBtn.innerHTML = '<span class="btn-icon">⭐</span><span class="btn-text">A* Algorithm</span>';
        }
    }

    // Show loading spinner overlay
    showLoadingOverlay(show, message = 'Calculating route...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        overlay.style.display = show ? 'flex' : 'none';
    }

    // Update route information display
    updateRouteInfo(distance, duration, estimatedTime) {
        document.getElementById('routeDistance').textContent = distance || '--';
        document.getElementById('routeDuration').textContent = duration || '--';
        document.getElementById('estimatedTime').textContent = estimatedTime || '--';
    }

    // Clear route information
    clearRouteInfo() {
        this.updateRouteInfo('--', '--', '--');
    }

    // Highlight active algorithm button
    highlightActiveAlgorithm(algorithm) {
        const dijkstraBtn = document.getElementById('dijkstra');
        // const astarBtn = document.getElementById('astar');
        
        // Remove active class from both
        dijkstraBtn.classList.remove('active');
        // astarBtn.classList.remove('active');
        
        // Add active class to current algorithm
        if (algorithm === 'dijkstra') {
            dijkstraBtn.classList.add('active');
        }
    }

    // Add smooth scroll to element
    smoothScrollTo(element, duration = 500) {
        const start = element.scrollTop;
        const target = element.scrollHeight - element.clientHeight;
        const change = target - start;
        const startTime = performance.now();

        function animateScroll(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
            
            element.scrollTop = start + change * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        }

        requestAnimationFrame(animateScroll);
    }

    // Validate form inputs
    validateInputs() {
        const startAddress = document.getElementById('startAddress').value.trim();
        const endAddress = document.getElementById('endAddress').value.trim();
        
        if (!startAddress) {
            this.showStatusMessage('Please enter a start location', 'error');
            return false;
        }
        
        if (!endAddress) {
            this.showStatusMessage('Please enter an end location', 'error');
            return false;
        }
        
        return true;
    }

    // Format distance for display
    formatDistance(meters) {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${Math.round(meters)} m`;
    }

    // Format duration for display
    formatDuration(seconds) {
        const minutes = Math.round(seconds / 60);
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
        }
        return `${minutes} min`;
    }

    // Add pulse animation to element
    pulseElement(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    // Handle responsive layout changes
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const controlPanel = document.querySelector('.control-panel');
        const directionsPanel = document.getElementById('directionsPanel');
        
        if (isMobile) {
            if (controlPanel) {
                controlPanel.style.maxHeight = this.isSidebarCollapsed ? '60px' : '50vh';
            }
            if (directionsPanel) {
                directionsPanel.style.left = '0';
            }
        } else {
            if (controlPanel) {
                controlPanel.style.maxHeight = '';
            }
            if (directionsPanel) {
                const sidebarWidth = this.isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
                directionsPanel.style.left = sidebarWidth;
            }
        }
    }
}

// Initialize UI Manager
const uiManager = new UIManager();

// Show status message (global function)
function showStatusMessage(message, type = 'info', duration = 4000) {
    uiManager.showStatusMessage(message, type, duration);
}

// Handle window resize
window.addEventListener('resize', () => {
    uiManager.handleResize();
});

// Initial resize handling
document.addEventListener('DOMContentLoaded', () => {
    uiManager.handleResize();
});

// Export UI Manager for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
    window.uiManager = uiManager;
}