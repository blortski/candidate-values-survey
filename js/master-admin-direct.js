/**
 * Master Admin Dashboard - Direct Fix
 * Version: v1.6.0
 * 
 * This script fixes the issue with customer management options being visible before login.
 */

// Execute immediately when the page loads
(function() {
    console.log('Direct fix script loaded - v1.6.0');
    
    // Function to hide customer management options
    function hideCustomerManagementOptions() {
        console.log('Hiding customer management options');
        
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('github_token') && localStorage.getItem('username');
        console.log('User logged in:', isLoggedIn);
        
        if (!isLoggedIn) {
            // Hide all customer management buttons
            const viewButtons = document.querySelectorAll('.view-customer-btn');
            const editButtons = document.querySelectorAll('.edit-customer-btn');
            const deleteButtons = document.querySelectorAll('.delete-customer-btn');
            
            console.log('Found buttons:', {
                viewButtons: viewButtons.length,
                editButtons: editButtons.length,
                deleteButtons: deleteButtons.length
            });
            
            // Hide view buttons
            viewButtons.forEach(button => {
                button.style.display = 'none';
                console.log('Hid view button');
            });
            
            // Hide edit buttons
            editButtons.forEach(button => {
                button.style.display = 'none';
                console.log('Hid edit button');
            });
            
            // Hide delete buttons
            deleteButtons.forEach(button => {
                button.style.display = 'none';
                console.log('Hid delete button');
            });
        }
    }
    
    // Function to ensure version is displayed
    function displayVersion() {
        const versionElement = document.getElementById('app-version');
        if (versionElement && window.config) {
            versionElement.textContent = window.config.version;
            console.log('Set version to:', window.config.version);
        } else {
            console.error('Version element or config not found');
        }
    }
    
    // Execute when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded - running fixes');
        displayVersion();
        hideCustomerManagementOptions();
    });
    
    // Also run when customers are loaded (in case they're loaded after DOM is ready)
    const originalDisplayCustomers = window.displayCustomers;
    if (typeof originalDisplayCustomers === 'function') {
        window.displayCustomers = function(customersData) {
            // Call the original function
            originalDisplayCustomers(customersData);
            
            // Then hide management options
            setTimeout(hideCustomerManagementOptions, 100);
        };
        console.log('Patched displayCustomers function');
    }
    
    // Also run when the dashboard is shown (in case it's shown after DOM is ready)
    const originalShowDashboard = window.showDashboard;
    if (typeof originalShowDashboard === 'function') {
        window.showDashboard = function(username) {
            // Call the original function
            originalShowDashboard(username);
            
            // Then hide management options
            setTimeout(hideCustomerManagementOptions, 100);
        };
        console.log('Patched showDashboard function');
    }
    
    // Run immediately and also after a short delay
    hideCustomerManagementOptions();
    setTimeout(hideCustomerManagementOptions, 500);
    setTimeout(hideCustomerManagementOptions, 1000);
    setTimeout(hideCustomerManagementOptions, 2000);
})();
