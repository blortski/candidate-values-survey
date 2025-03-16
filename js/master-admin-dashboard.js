/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.8.9
 */

// Global variables
let githubAPI = null;
let customers = [];
let currentCustomerId = null;

// Wait for the DOM to be fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MASTER ADMIN DASHBOARD INITIALIZATION ===');
    console.log('Master Admin Dashboard v1.8.9 initializing...');
    console.log('Time:', new Date().toISOString());
    
    // Update version in the footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = 'v1.8.9';
        console.log('Version set to v1.8.9');
    } else {
        console.error('Version element not found in the DOM');
    }
    
    // Get DOM elements
    console.log('Getting DOM elements...');
    const loginPrompt = document.getElementById('login-prompt');
    const dashboardContent = document.getElementById('dashboard-content');
    const userDisplay = document.getElementById('user-display');
    const logoutButton = document.getElementById('logout-btn');
    const goToLoginButton = document.getElementById('go-to-login-btn');
    
    // Check if elements exist
    console.log('DOM elements found:', {
        loginPrompt: !!loginPrompt,
        dashboardContent: !!dashboardContent,
        userDisplay: !!userDisplay,
        logoutButton: !!logoutButton,
        goToLoginButton: !!goToLoginButton
    });
    
    if (!loginPrompt) console.error('Error: login-prompt element not found');
    if (!dashboardContent) console.error('Error: dashboard-content element not found');
    if (!userDisplay) console.error('Error: user-display element not found');
    
    // Check login status
    console.log('Checking localStorage for credentials...');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('github_token');
    
    console.log('Credentials found:', {
        username: username || 'not found',
        token: token ? token.substring(0, 4) + '...' : 'not found'
    });
    
    // Set up event listeners
    console.log('Setting up event listeners...');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            console.log('Logout button clicked');
            localStorage.removeItem('github_token');
            localStorage.removeItem('username');
            console.log('Credentials removed from localStorage');
            window.location.href = 'admin-login.html';
        });
        console.log('Logout button event listener added');
    }
    
    if (goToLoginButton) {
        goToLoginButton.addEventListener('click', function(e) {
            console.log('Go to login button clicked');
            e.preventDefault();
            localStorage.removeItem('github_token');
            localStorage.removeItem('username');
            console.log('Credentials removed from localStorage');
            window.location.href = 'admin-login.html';
        });
        console.log('Go to login button event listener added');
    }
    
    // Simple login check - if credentials exist, show dashboard
    console.log('Performing login check...');
    console.log('Username === Admin:', username === 'Admin');
    console.log('Token exists:', !!token);
    
    if (username && username === 'Admin' && token) {
        console.log('User is logged in as:', username);
        
        // Show dashboard
        console.log('Showing dashboard...');
        if (loginPrompt) {
            loginPrompt.classList.add('hidden');
            console.log('Login prompt hidden');
        }
        if (dashboardContent) {
            dashboardContent.classList.remove('hidden');
            console.log('Dashboard content shown');
        }
        if (userDisplay) {
            userDisplay.textContent = username;
            console.log('User display updated with username');
        }
        
        // Initialize GitHub API
        console.log('Initializing GitHub API...');
        try {
            console.log('GitHub API config:', {
                owner: config.github.owner,
                repo: config.github.repo,
                branch: config.github.branch,
                resultsPath: config.github.resultsPath,
                token: token ? token.substring(0, 4) + '...' : 'not available'
            });
            
            githubAPI = new GitHubAPI({
                owner: config.github.owner,
                repo: config.github.repo,
                branch: config.github.branch,
                resultsPath: config.github.resultsPath,
                token: token
            });
            console.log('GitHub API initialized successfully');
            
            // Load customers
            console.log('Loading customers...');
            loadCustomers();
            
            // Set up remaining event listeners for dashboard functionality
            console.log('Setting up dashboard event listeners...');
            setupDashboardEventListeners();
        } catch (error) {
            console.error('Error initializing GitHub API:', error);
        }
    } else {
        console.log('User is not logged in, showing login prompt');
        console.log('Reason:', !username ? 'No username' : (username !== 'Admin' ? 'Username not Admin' : 'No token'));
        
        // Show login prompt
        if (loginPrompt) {
            loginPrompt.classList.remove('hidden');
            console.log('Login prompt shown');
        }
        if (dashboardContent) {
            dashboardContent.classList.add('hidden');
            console.log('Dashboard content hidden');
        }
    }
    
    console.log('=== INITIALIZATION COMPLETE ===');
});

/**
 * Set up event listeners for dashboard functionality
 */
function setupDashboardEventListeners() {
    console.log('Setting up dashboard event listeners...');
    
    // Add customer button
    const addCustomerButton = document.getElementById('add-customer-btn');
    if (addCustomerButton) {
        addCustomerButton.addEventListener('click', showAddCustomerForm);
        console.log('Add customer button event listener added');
    } else {
        console.error('Add customer button not found');
    }
    
    // Add customer form
    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) {
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', saveNewCustomer);
            console.log('Customer form submit event listener added');
        } else {
            console.error('Customer form not found');
        }
        
        const cancelAddCustomerButton = document.getElementById('cancel-add-customer');
        if (cancelAddCustomerButton) {
            cancelAddCustomerButton.addEventListener('click', hideAddCustomerForm);
            console.log('Cancel add customer button event listener added');
        } else {
            console.error('Cancel add customer button not found');
        }
    } else {
        console.error('Add customer form not found');
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    if (closeButtons.length > 0) {
        closeButtons.forEach(button => {
            button.addEventListener('click', closeAllModals);
        });
        console.log('Modal close buttons event listeners added');
    } else {
        console.error('No modal close buttons found');
    }
    
    // Edit customer save button
    const saveEditButton = document.getElementById('save-edit-customer-btn');
    if (saveEditButton) {
        saveEditButton.addEventListener('click', saveEditedCustomer);
        console.log('Save edit button event listener added');
    } else {
        console.error('Save edit button not found');
    }
    
    // Delete customer confirm button
    const confirmDeleteButton = document.getElementById('confirm-delete-btn');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', deleteCustomer);
        console.log('Confirm delete button event listener added');
    } else {
        console.error('Confirm delete button not found');
    }
    
    console.log('Dashboard event listeners setup complete');
}

/**
 * Show the add customer form
 */
function showAddCustomerForm() {
    console.log('Showing add customer form...');
    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) {
        addCustomerForm.classList.remove('hidden');
        console.log('Add customer form shown');
    } else {
        console.error('Add customer form not found');
    }
}

/**
 * Hide the add customer form
 */
function hideAddCustomerForm() {
    console.log('Hiding add customer form...');
    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) {
        addCustomerForm.classList.add('hidden');
        console.log('Add customer form hidden');
    } else {
        console.error('Add customer form not found');
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    console.log('Closing all modals...');
    
    const modals = document.querySelectorAll('.modal');
    if (modals.length > 0) {
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        console.log('All modals closed');
    } else {
        console.error('No modals found');
    }
}

/**
 * Load all customers
 */
function loadCustomers() {
    console.log('Loading customers...');
    
    if (!githubAPI) {
        console.error('GitHub API not initialized');
        return;
    }
    
    const customersContainer = document.getElementById('customers-container');
    if (!customersContainer) {
        console.error('Customers container not found');
        return;
    }
    
    // Clear customers container
    customersContainer.innerHTML = '<div class="loading">Loading customers...</div>';
    console.log('Customers container cleared and loading message displayed');
    
    // Mock data for now - in a real app, this would fetch from GitHub
    console.log('Loading mock customer data...');
    setTimeout(() => {
        customers = [
            { id: '1', name: 'Wild Zora Foods', contact: 'Joshua Tabin', email: 'joshua@wildzora.com' },
            { id: '2', name: 'Acme Corporation', contact: 'John Doe', email: 'john@acme.com' },
            { id: '3', name: 'XYZ Industries', contact: 'Jane Smith', email: 'jane@xyz.com' }
        ];
        console.log('Mock customer data loaded:', customers.length, 'customers');
        
        displayCustomers();
    }, 1000);
}

/**
 * Display all customers
 */
function displayCustomers() {
    console.log('Displaying customers...');
    
    const customersContainer = document.getElementById('customers-container');
    if (!customersContainer) {
        console.error('Customers container not found');
        return;
    }
    
    // Clear customers container
    customersContainer.innerHTML = '';
    console.log('Customers container cleared');
    
    if (customers.length === 0) {
        customersContainer.innerHTML = '<div class="no-data">No customers found</div>';
        console.log('No customers to display');
        return;
    }
    
    // Add customer cards
    console.log('Creating customer cards for', customers.length, 'customers');
    customers.forEach(customer => {
        const customerCard = document.createElement('div');
        customerCard.className = 'customer-card';
        customerCard.innerHTML = `
            <h3>${customer.name}</h3>
            <p><strong>Contact:</strong> ${customer.contact}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <div class="card-actions">
                <button class="btn btn-small edit-customer-btn" data-id="${customer.id}">Edit</button>
                <button class="btn btn-small btn-danger delete-customer-btn" data-id="${customer.id}">Delete</button>
            </div>
        `;
        
        customersContainer.appendChild(customerCard);
        
        // Add event listeners to buttons
        const editButton = customerCard.querySelector('.edit-customer-btn');
        const deleteButton = customerCard.querySelector('.delete-customer-btn');
        
        if (editButton) {
            editButton.addEventListener('click', () => showEditCustomerForm(customer.id));
        }
        
        if (deleteButton) {
            deleteButton.addEventListener('click', () => showDeleteConfirmation(customer.id));
        }
    });
    
    console.log('Customer cards created and added to container');
}

/**
 * Show the edit customer form
 * @param {string} customerId - The ID of the customer to edit
 */
function showEditCustomerForm(customerId) {
    console.log('Showing edit customer form for customer ID:', customerId);
    
    const editCustomerModal = document.getElementById('edit-customer-modal');
    if (!editCustomerModal) {
        console.error('Edit customer modal not found');
        return;
    }
    
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return;
    }
    
    // Set current customer ID
    currentCustomerId = customerId;
    
    // Fill form fields
    const nameInput = document.getElementById('edit-customer-name');
    const contactInput = document.getElementById('edit-customer-contact');
    const emailInput = document.getElementById('edit-customer-email');
    
    if (nameInput) nameInput.value = customer.name;
    if (contactInput) contactInput.value = customer.contact;
    if (emailInput) emailInput.value = customer.email;
    
    // Show modal
    editCustomerModal.classList.remove('hidden');
    console.log('Edit customer modal shown');
}

/**
 * Save the edited customer
 */
function saveEditedCustomer() {
    console.log('Saving edited customer...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Get form values
    const nameInput = document.getElementById('edit-customer-name');
    const contactInput = document.getElementById('edit-customer-contact');
    const emailInput = document.getElementById('edit-customer-email');
    
    if (!nameInput || !contactInput || !emailInput) {
        console.error('Form inputs not found');
        return;
    }
    
    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    const email = emailInput.value.trim();
    
    // Validate inputs
    if (!name || !contact || !email) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Update customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    customers[customerIndex] = {
        ...customers[customerIndex],
        name,
        contact,
        email
    };
    
    console.log('Customer updated:', customers[customerIndex]);
    
    // Close modal
    closeAllModals();
    
    // Update display
    displayCustomers();
    
    // Show notification
    showNotification('Customer updated successfully');
}

/**
 * Show delete confirmation
 * @param {string} customerId - The ID of the customer to delete
 */
function showDeleteConfirmation(customerId) {
    console.log('Showing delete confirmation for customer ID:', customerId);
    
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    if (!confirmDeleteModal) {
        console.error('Confirm delete modal not found');
        return;
    }
    
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        console.error('Customer not found:', customerId);
        return;
    }
    
    // Set current customer ID
    currentCustomerId = customerId;
    
    // Set confirmation message
    const confirmationMessage = document.getElementById('delete-confirmation-message');
    if (confirmationMessage) {
        confirmationMessage.textContent = `Are you sure you want to delete ${customer.name}?`;
    }
    
    // Show modal
    confirmDeleteModal.classList.remove('hidden');
    console.log('Delete confirmation modal shown');
}

/**
 * Delete the customer
 */
function deleteCustomer() {
    console.log('Deleting customer:', currentCustomerId);
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Remove customer
    customers = customers.filter(c => c.id !== currentCustomerId);
    console.log('Customer deleted, remaining customers:', customers.length);
    
    // Close modal
    closeAllModals();
    
    // Update display
    displayCustomers();
    
    // Show notification
    showNotification('Customer deleted successfully');
    
    // Clear current customer ID
    currentCustomerId = null;
}

/**
 * Save a new customer
 * @param {Event} e - The form submit event
 */
function saveNewCustomer(e) {
    e.preventDefault();
    console.log('Saving new customer...');
    
    // Get form values
    const nameInput = document.getElementById('customer-name');
    const contactInput = document.getElementById('customer-contact');
    const emailInput = document.getElementById('customer-email');
    
    if (!nameInput || !contactInput || !emailInput) {
        console.error('Form inputs not found');
        return;
    }
    
    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();
    const email = emailInput.value.trim();
    
    // Validate inputs
    if (!name || !contact || !email) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Create new customer
    const newCustomer = {
        id: Date.now().toString(),
        name,
        contact,
        email
    };
    
    console.log('New customer created:', newCustomer);
    
    // Add to customers array
    customers.push(newCustomer);
    console.log('Customer added to array, total customers:', customers.length);
    
    // Reset form
    nameInput.value = '';
    contactInput.value = '';
    emailInput.value = '';
    console.log('Form reset');
    
    // Close modal
    closeAllModals();
    
    // Update display
    displayCustomers();
    
    // Show notification
    showNotification('Customer added successfully');
}

/**
 * Show a notification
 * @param {string} message - The notification message
 */
function showNotification(message) {
    console.log('Showing notification:', message);
    
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('Notification element not found');
        return;
    }
    
    // Set message
    notification.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    console.log('Notification shown');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        console.log('Notification hidden');
    }, 3000);
}
