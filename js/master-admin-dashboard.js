/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.8.7
 */

// Global variables
let githubAPI = null;
let customers = [];
let currentCustomerId = null;

// DOM elements - initialized in initializeDashboard function
let loginPrompt;
let dashboardContent;
let dashboardSection;
let customersContainer;
let addCustomerForm;
let editCustomerModal;
let confirmDeleteModal;
let logoutButton;
let userDisplay;
let addCustomerButton;
let goToLoginButton;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing master admin dashboard v1.8.7...');
    
    // Initialize dashboard elements and functionality
    initializeDashboard();
});

/**
 * Initialize all dashboard elements and functionality
 */
function initializeDashboard() {
    console.log('Initializing dashboard elements...');
    
    // Initialize DOM elements - MUST be done first before any other function calls
    initializeDOMElements();
    
    // Set version in footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = 'v1.8.7';
        console.log('Set version to:', 'v1.8.7');
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is logged in
    checkLoginStatus();
}

/**
 * Initialize all DOM elements
 */
function initializeDOMElements() {
    console.log('Initializing DOM elements...');
    
    // Main sections
    loginPrompt = document.getElementById('login-prompt');
    dashboardContent = document.getElementById('dashboard-content');
    dashboardSection = document.getElementById('dashboard-section');
    
    // Check if elements exist
    if (!loginPrompt) console.error('Error: login-prompt element not found');
    if (!dashboardContent) console.error('Error: dashboard-content element not found');
    if (!dashboardSection) console.error('Error: dashboard-section element not found');
    
    // Containers
    customersContainer = document.getElementById('customers-container');
    
    // Modals
    addCustomerForm = document.getElementById('add-customer-form');
    editCustomerModal = document.getElementById('edit-customer-modal');
    confirmDeleteModal = document.getElementById('confirm-delete-modal');
    
    // Buttons
    logoutButton = document.getElementById('logout-btn');
    userDisplay = document.getElementById('user-display');
    addCustomerButton = document.getElementById('add-customer-btn');
    goToLoginButton = document.getElementById('go-to-login-btn');
    
    console.log('DOM elements initialized successfully');
}

/**
 * Check if the user is logged in
 */
function checkLoginStatus() {
    const token = localStorage.getItem('github_token');
    const username = localStorage.getItem('username');
    
    console.log('Checking login status...');
    console.log('Token exists:', !!token);
    console.log('Username exists:', !!username);
    
    if (!token || !username) {
        console.log('User not logged in, showing login prompt');
        showLoginPrompt();
        return;
    }
    
    console.log('User is logged in:', username);
    
    try {
        // Initialize GitHub API with proper configuration
        console.log('Initializing GitHub API with config:', {
            owner: config.github.owner,
            repo: config.github.repo,
            branch: config.github.branch,
            resultsPath: config.github.resultsPath,
            token: token ? token.substring(0, 4) + '...' : 'null'
        });
        
        // Initialize GitHub API
        window.githubAPI = new GitHubAPI({
            owner: config.github.owner,
            repo: config.github.repo,
            branch: config.github.branch,
            resultsPath: config.github.resultsPath,
            token: token
        });
        
        // Set global variable
        githubAPI = window.githubAPI;
        
        console.log('GitHub API initialized successfully');
        
        // Show dashboard immediately without testing API access
        showDashboard(username);
        
        // Load customers
        loadCustomers();
    } catch (error) {
        console.error('Error initializing GitHub API:', error);
        showLoginPrompt();
    }
}

/**
 * Show the login prompt
 */
function showLoginPrompt() {
    console.log('Showing login prompt...');
    
    // Verify elements exist before manipulating them
    if (!loginPrompt || !dashboardContent) {
        console.error('Error: Required DOM elements not initialized');
        return;
    }
    
    // Show login prompt
    loginPrompt.classList.remove('hidden');
    
    // Hide dashboard content
    dashboardContent.classList.add('hidden');
    
    console.log('Login prompt displayed, dashboard hidden');
}

/**
 * Show the dashboard
 * @param {string} username - The username to display
 */
function showDashboard(username) {
    console.log('Showing dashboard for user:', username);
    
    // Verify elements exist before manipulating them
    if (!loginPrompt || !dashboardContent || !userDisplay) {
        console.error('Error: Required DOM elements not initialized');
        return;
    }
    
    // Set user display
    userDisplay.textContent = username;
    
    // Hide login prompt
    loginPrompt.classList.add('hidden');
    
    // Show dashboard content
    dashboardContent.classList.remove('hidden');
    
    console.log('Dashboard displayed, login prompt hidden');
}

/**
 * Handle logout
 */
function handleLogout() {
    console.log('Logging out...');
    
    // Clear credentials
    localStorage.removeItem('github_token');
    localStorage.removeItem('username');
    
    // Show login prompt
    showLoginPrompt();
    
    // Redirect to login page
    window.location.href = 'admin-login.html';
}

/**
 * Handle Go to Login button click
 */
function handleGoToLogin(e) {
    e.preventDefault();
    localStorage.removeItem('github_token');
    localStorage.removeItem('username');
    window.location.href = 'admin-login.html';
}

/**
 * Set up event listeners for dashboard
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Verify elements exist before adding event listeners
    if (!logoutButton) {
        console.error('Error: logout-btn element not found');
    } else {
        logoutButton.addEventListener('click', handleLogout);
        console.log('Logout button event listener added');
    }
    
    if (!goToLoginButton) {
        console.error('Error: go-to-login-btn element not found');
    } else {
        goToLoginButton.addEventListener('click', handleGoToLogin);
        console.log('Go to login button event listener added');
    }
    
    // Add customer button
    if (!addCustomerButton) {
        console.error('Error: add-customer-btn element not found');
    } else {
        addCustomerButton.addEventListener('click', showAddCustomerForm);
        console.log('Add customer button event listener added');
    }
    
    // Add customer form
    if (addCustomerForm) {
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', saveNewCustomer);
            console.log('Customer form submit event listener added');
        } else {
            console.error('Error: customer-form element not found');
        }
        
        const cancelAddCustomerButton = document.getElementById('cancel-add-customer');
        if (cancelAddCustomerButton) {
            cancelAddCustomerButton.addEventListener('click', hideAddCustomerForm);
            console.log('Cancel add customer button event listener added');
        } else {
            console.error('Error: cancel-add-customer element not found');
        }
    } else {
        console.error('Error: add-customer-form element not found');
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    if (closeButtons.length > 0) {
        closeButtons.forEach(button => {
            button.addEventListener('click', closeAllModals);
        });
        console.log('Modal close buttons event listeners added');
    } else {
        console.error('Error: No close-modal buttons found');
    }
    
    // Edit customer save button
    const saveEditButton = document.getElementById('save-edit-customer-btn');
    if (saveEditButton) {
        saveEditButton.addEventListener('click', saveEditedCustomer);
        console.log('Save edit button event listener added');
    } else {
        console.error('Error: save-edit-customer-btn element not found');
    }
    
    // Delete customer confirm button
    const confirmDeleteButton = document.getElementById('confirm-delete-btn');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', deleteCustomer);
        console.log('Confirm delete button event listener added');
    } else {
        console.error('Error: confirm-delete-btn element not found');
    }
    
    console.log('Event listeners set up successfully');
}

/**
 * Load customers from GitHub
 */
function loadCustomers() {
    // Show loading indicator
    customersContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading customers...</p>
        </div>
    `;
    
    // Get customers data
    getCustomersData()
        .then(customersData => {
            // Store customers
            customers = customersData;
            
            // Display customers
            displayCustomers(customersData);
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            customersContainer.innerHTML = `<p class="error">Failed to load customers. Please try again.</p>`;
        });
}

/**
 * Get customers data from GitHub
 * @returns {Promise<Array>} - Promise resolving to array of customers
 */
function getCustomersData() {
    return new Promise((resolve, reject) => {
        githubAPI.getFileContent('data/customers.json')
            .then(fileData => {
                try {
                    const content = atob(fileData.content);
                    const customersData = JSON.parse(content);
                    resolve(customersData);
                } catch (error) {
                    console.error('Error parsing customers data:', error);
                    reject(error);
                }
            })
            .catch(error => {
                if (error.message && error.message.includes('404')) {
                    // Create empty customers file if it doesn't exist
                    saveCustomersData([])
                        .then(() => resolve([]))
                        .catch(reject);
                } else {
                    console.error('Error getting customers data:', error);
                    reject(error);
                }
            });
    });
}

/**
 * Display customers in the UI
 * @param {Array} customersData - Array of customer objects
 */
function displayCustomers(customersData) {
    if (!customersData || customersData.length === 0) {
        customersContainer.innerHTML = '<p>No customers found. Add your first customer using the button above.</p>';
        return;
    }
    
    // Clear container
    customersContainer.innerHTML = '';
    
    // Get customer template
    const template = document.getElementById('customer-template');
    
    // Create customer cards
    customersData.forEach(customer => {
        // Clone template
        const customerCard = document.importNode(template.content, true);
        
        // Set customer data
        customerCard.querySelector('.customer-name').textContent = customer.name;
        
        // Set stats
        const statValues = customerCard.querySelectorAll('.stat-value');
        statValues[0].textContent = customer.stats?.values || 0;
        statValues[1].textContent = customer.stats?.questions || 0;
        statValues[2].textContent = customer.stats?.surveys || 0;
        statValues[3].textContent = customer.stats?.employees || 0;
        
        // Set data attributes for actions
        const viewBtn = customerCard.querySelector('.view-customer-btn');
        const editBtn = customerCard.querySelector('.edit-customer-btn');
        const deleteBtn = customerCard.querySelector('.delete-customer-btn');
        
        viewBtn.setAttribute('data-customer-id', customer.id);
        editBtn.setAttribute('data-customer-id', customer.id);
        deleteBtn.setAttribute('data-customer-id', customer.id);
        
        // Add event listeners
        viewBtn.addEventListener('click', () => viewCustomerDashboard(customer.id));
        editBtn.addEventListener('click', () => showEditCustomerModal(customer.id));
        deleteBtn.addEventListener('click', () => showDeleteCustomerModal(customer.id));
        
        // Append to container
        customersContainer.appendChild(customerCard);
    });
}

/**
 * Show the add customer form
 */
function showAddCustomerForm() {
    addCustomerForm.classList.remove('hidden');
}

/**
 * Hide the add customer form
 */
function hideAddCustomerForm() {
    addCustomerForm.classList.add('hidden');
    document.getElementById('customer-form').reset();
}

/**
 * Save a new customer
 * @param {Event} e - The form submission event
 */
function saveNewCustomer(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('customer-name');
    const emailInput = document.getElementById('customer-email');
    const phoneInput = document.getElementById('customer-phone');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name || !email) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Generate ID
    const id = generateCustomerId(name);
    
    // Create customer object
    const newCustomer = {
        id,
        name,
        contact: {
            email,
            phone
        },
        stats: {
            values: 0,
            questions: 0,
            surveys: 0,
            employees: 0
        },
        created: new Date().toISOString()
    };
    
    // Add to customers array
    customers.push(newCustomer);
    
    // Save to GitHub
    saveCustomersData(customers)
        .then(() => {
            // Reset form
            document.getElementById('customer-form').reset();
            
            // Hide form
            hideAddCustomerForm();
            
            // Display updated customers
            displayCustomers(customers);
        })
        .catch(error => {
            console.error('Error saving customer:', error);
            alert('Failed to save customer. Please try again.');
        });
}

/**
 * Generate a customer ID from name
 * @param {string} name - The customer name
 * @returns {string} - The generated ID
 */
function generateCustomerId(name) {
    // Convert name to lowercase, replace spaces with hyphens
    const baseId = name.toLowerCase().replace(/\s+/g, '-');
    
    // Add timestamp to ensure uniqueness
    return `${baseId}-${Date.now()}`;
}

/**
 * Save customers data to GitHub
 * @param {Array} customersData - Array of customer objects
 * @returns {Promise} - Promise resolving when save is complete
 */
function saveCustomersData(customersData) {
    return githubAPI.saveFile(
        'data/customers.json',
        JSON.stringify(customersData, null, 2),
        'Update customers data'
    );
}

/**
 * Show the edit customer modal
 * @param {string} customerId - The customer ID
 */
function showEditCustomerModal(customerId) {
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        console.error('Customer not found:', customerId);
        return;
    }
    
    // Set current customer ID
    currentCustomerId = customerId;
    
    // Set form values
    document.getElementById('edit-customer-name').value = customer.name;
    document.getElementById('edit-customer-email').value = customer.contact?.email || '';
    document.getElementById('edit-customer-phone').value = customer.contact?.phone || '';
    
    // Show modal
    editCustomerModal.style.display = 'block';
}

/**
 * Save edited customer
 */
function saveEditedCustomer() {
    if (!currentCustomerId) {
        console.error('No customer selected for editing');
        return;
    }
    
    // Find customer index
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Get form values
    const name = document.getElementById('edit-customer-name').value.trim();
    const email = document.getElementById('edit-customer-email').value.trim();
    const phone = document.getElementById('edit-customer-phone').value.trim();
    
    if (!name || !email) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Update customer
    customers[customerIndex].name = name;
    customers[customerIndex].contact = {
        email,
        phone
    };
    
    // Save to GitHub
    saveCustomersData(customers)
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Display updated customers
            displayCustomers(customers);
        })
        .catch(error => {
            console.error('Error saving customer:', error);
            alert('Failed to save customer. Please try again.');
        });
}

/**
 * Show the delete customer modal
 * @param {string} customerId - The customer ID
 */
function showDeleteCustomerModal(customerId) {
    // Set current customer ID
    currentCustomerId = customerId;
    
    // Show modal
    confirmDeleteModal.style.display = 'block';
}

/**
 * Delete customer
 */
function deleteCustomer() {
    if (!currentCustomerId) {
        console.error('No customer selected for deletion');
        return;
    }
    
    // Find customer index
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Remove customer
    customers.splice(customerIndex, 1);
    
    // Save to GitHub
    saveCustomersData(customers)
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Display updated customers
            displayCustomers(customers);
        })
        .catch(error => {
            console.error('Error deleting customer:', error);
            alert('Failed to delete customer. Please try again.');
        });
}

/**
 * View customer dashboard
 * @param {string} customerId - The customer ID
 */
function viewCustomerDashboard(customerId) {
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        console.error('Customer not found:', customerId);
        return;
    }
    
    // Store selected customer ID
    localStorage.setItem('selected_customer_id', customerId);
    
    // Redirect to customer dashboard
    window.location.href = `customer-admin.html?id=${encodeURIComponent(customerId)}`;
}

/**
 * Close all modals
 */
function closeAllModals() {
    editCustomerModal.style.display = 'none';
    confirmDeleteModal.style.display = 'none';
    
    // Clear current customer ID
    currentCustomerId = null;
}
