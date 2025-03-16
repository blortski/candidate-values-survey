/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.8.8
 */

// Global variables
let githubAPI = null;
let customers = [];
let currentCustomerId = null;

// Wait for the DOM to be fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    console.log('Master Admin Dashboard v1.8.8 initializing...');
    
    // Update version in the footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = 'v1.8.8';
    }
    
    // Get DOM elements
    const loginPrompt = document.getElementById('login-prompt');
    const dashboardContent = document.getElementById('dashboard-content');
    const userDisplay = document.getElementById('user-display');
    const logoutButton = document.getElementById('logout-btn');
    const goToLoginButton = document.getElementById('go-to-login-btn');
    
    // Check if elements exist
    if (!loginPrompt) console.error('Error: login-prompt element not found');
    if (!dashboardContent) console.error('Error: dashboard-content element not found');
    if (!userDisplay) console.error('Error: user-display element not found');
    
    // Check login status
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('github_token');
    
    console.log('Checking login status...');
    console.log('Username exists:', !!username);
    console.log('Token exists:', !!token);
    
    // Set up event listeners
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            console.log('Logging out...');
            localStorage.removeItem('github_token');
            localStorage.removeItem('username');
            window.location.href = 'admin-login.html';
        });
    }
    
    if (goToLoginButton) {
        goToLoginButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Going to login page...');
            localStorage.removeItem('github_token');
            localStorage.removeItem('username');
            window.location.href = 'admin-login.html';
        });
    }
    
    // Simple login check - if credentials exist, show dashboard
    if (username && username === 'Admin' && token) {
        console.log('User is logged in as:', username);
        
        // Show dashboard
        if (loginPrompt) loginPrompt.classList.add('hidden');
        if (dashboardContent) dashboardContent.classList.remove('hidden');
        if (userDisplay) userDisplay.textContent = username;
        
        // Initialize GitHub API
        try {
            githubAPI = new GitHubAPI({
                owner: config.github.owner,
                repo: config.github.repo,
                branch: config.github.branch,
                resultsPath: config.github.resultsPath,
                token: token
            });
            console.log('GitHub API initialized');
            
            // Load customers
            loadCustomers();
            
            // Set up remaining event listeners for dashboard functionality
            setupDashboardEventListeners();
        } catch (error) {
            console.error('Error initializing GitHub API:', error);
        }
    } else {
        console.log('User is not logged in, showing login prompt');
        
        // Show login prompt
        if (loginPrompt) loginPrompt.classList.remove('hidden');
        if (dashboardContent) dashboardContent.classList.add('hidden');
    }
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
    }
    
    // Add customer form
    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) {
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', saveNewCustomer);
        }
        
        const cancelAddCustomerButton = document.getElementById('cancel-add-customer');
        if (cancelAddCustomerButton) {
            cancelAddCustomerButton.addEventListener('click', hideAddCustomerForm);
        }
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Edit customer save button
    const saveEditButton = document.getElementById('save-edit-customer-btn');
    if (saveEditButton) {
        saveEditButton.addEventListener('click', saveEditedCustomer);
    }
    
    // Delete customer confirm button
    const confirmDeleteButton = document.getElementById('confirm-delete-btn');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', deleteCustomer);
    }
}

/**
 * Show the add customer form
 */
function showAddCustomerForm() {
    console.log('Showing add customer form...');
    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) {
        addCustomerForm.classList.remove('hidden');
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
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    console.log('Closing all modals...');
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
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
    
    // Mock data for now - in a real app, this would fetch from GitHub
    setTimeout(() => {
        customers = [
            { id: '1', name: 'Wild Zora Foods', contact: 'Joshua Tabin', email: 'joshua@wildzora.com' },
            { id: '2', name: 'Acme Corporation', contact: 'John Doe', email: 'john@acme.com' },
            { id: '3', name: 'XYZ Industries', contact: 'Jane Smith', email: 'jane@xyz.com' }
        ];
        
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
    
    if (customers.length === 0) {
        customersContainer.innerHTML = '<div class="no-data">No customers found</div>';
        return;
    }
    
    // Add customer cards
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
}

/**
 * Delete the customer
 */
function deleteCustomer() {
    console.log('Deleting customer...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Remove customer
    customers = customers.filter(c => c.id !== currentCustomerId);
    
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
        return;
    }
    
    // Create new customer
    const newCustomer = {
        id: Date.now().toString(),
        name,
        contact,
        email
    };
    
    // Add to customers array
    customers.push(newCustomer);
    
    // Reset form
    nameInput.value = '';
    contactInput.value = '';
    emailInput.value = '';
    
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
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
