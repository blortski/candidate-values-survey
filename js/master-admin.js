/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.6.8
 */

// Global variables
let githubAPI = null;
let customers = [];
let currentCustomerId = null;

// DOM elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const customersContainer = document.getElementById('customers-container');
const addCustomerForm = document.getElementById('add-customer-form');
const editCustomerModal = document.getElementById('edit-customer-modal');
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const logoutButton = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const addCustomerButton = document.getElementById('add-customer-btn');
const viewCustomerButtons = document.querySelectorAll('.view-customer-btn');
const editCustomerButtons = document.querySelectorAll('.edit-customer-btn');
const deleteCustomerButtons = document.querySelectorAll('.delete-customer-btn');
const accessDashboardButtons = document.querySelectorAll('.access-dashboard-btn');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing master admin dashboard...');
    
    // Set version in footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = 'v1.6.8';
        console.log('Set version to:', 'v1.6.8');
    } else {
        console.error('Version element not found');
    }
    
    // Hide logout button initially
    if (logoutButton) {
        logoutButton.style.display = 'none';
    }
    
    // Hide customer management options initially
    if (addCustomerButton) {
        addCustomerButton.style.display = 'none';
    }
    viewCustomerButtons.forEach(button => button.style.display = 'none');
    editCustomerButtons.forEach(button => button.style.display = 'none');
    deleteCustomerButtons.forEach(button => button.style.display = 'none');
    accessDashboardButtons.forEach(button => button.style.display = 'none');
    
    // Check if user is already logged in
    checkLoginStatus();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Check if the user is already logged in
 */
function checkLoginStatus() {
    const token = localStorage.getItem('github_token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
        console.log('User already logged in:', username);
        loginWithStoredCredentials(username, token);
    } else {
        console.log('User not logged in');
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Add customer button
    if (addCustomerButton) {
        addCustomerButton.addEventListener('click', showAddCustomerForm);
    }
    
    // Cancel add customer button
    const cancelAddCustomerBtn = document.getElementById('cancel-add-customer');
    if (cancelAddCustomerBtn) {
        cancelAddCustomerBtn.addEventListener('click', hideAddCustomerForm);
    }
    
    // Customer form submission
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', saveNewCustomer);
    }
    
    // Edit customer save button
    const saveEditCustomerBtn = document.getElementById('save-edit-customer-btn');
    if (saveEditCustomerBtn) {
        saveEditCustomerBtn.addEventListener('click', saveEditedCustomer);
    }
    
    // Delete customer confirm button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCustomer);
    }
    
    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
}

/**
 * Handle login form submission
 * @param {Event} e - The form submission event
 */
function handleLogin(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const tokenInput = document.getElementById('github-token');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const token = tokenInput.value.trim();
    
    // Validate inputs
    if (!username || !password || !token) {
        showError('Please fill in all fields');
        return;
    }
    
    // Check password against config
    if (password !== config.admin.password) {
        showError('Invalid password');
        return;
    }
    
    // Initialize GitHub API with token
    githubAPI = new GitHubAPI(token);
    
    // Test GitHub API access
    githubAPI.testAccess()
        .then(success => {
            if (success) {
                // Store credentials
                localStorage.setItem('github_token', token);
                localStorage.setItem('username', username);
                
                // Show dashboard
                showDashboard(username);
                
                // Load customers
                loadCustomers();
            } else {
                showError('GitHub token is invalid or has insufficient permissions');
            }
        })
        .catch(error => {
            console.error('Error testing GitHub access:', error);
            showError('Failed to authenticate with GitHub. Please check your token and try again.');
        });
}

/**
 * Login with stored credentials
 * @param {string} username - The username
 * @param {string} token - The GitHub token
 */
function loginWithStoredCredentials(username, token) {
    // Initialize GitHub API with token
    githubAPI = new GitHubAPI(token);
    
    // Test GitHub API access
    githubAPI.testAccess()
        .then(success => {
            if (success) {
                // Show dashboard
                showDashboard(username);
                
                // Load customers
                loadCustomers();
            } else {
                // Clear invalid credentials
                localStorage.removeItem('github_token');
                localStorage.removeItem('username');
                
                showError('Stored GitHub token is invalid. Please login again.');
            }
        })
        .catch(error => {
            console.error('Error testing GitHub access:', error);
            
            // Clear invalid credentials
            localStorage.removeItem('github_token');
            localStorage.removeItem('username');
            
            showError('Failed to authenticate with GitHub. Please login again.');
        });
}

/**
 * Handle logout
 */
function handleLogout() {
    // Clear credentials
    localStorage.removeItem('github_token');
    localStorage.removeItem('username');
    
    // Clear GitHub API
    githubAPI = null;
    
    // Clear customers
    customers = [];
    
    // Hide dashboard
    dashboardSection.classList.add('hidden');
    
    // Show login
    loginSection.classList.remove('hidden');
    
    // Clear user display
    userDisplay.textContent = '';
    
    // Hide logout button
    logoutButton.style.display = 'none';
    
    // Hide customer management options
    addCustomerButton.style.display = 'none';
    viewCustomerButtons.forEach(button => button.style.display = 'none');
    editCustomerButtons.forEach(button => button.style.display = 'none');
    deleteCustomerButtons.forEach(button => button.style.display = 'none');
    accessDashboardButtons.forEach(button => button.style.display = 'none');
    
    // Clear customer form
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.reset();
    }
}

/**
 * Show the dashboard
 * @param {string} username - The username to display
 */
function showDashboard(username) {
    // Hide login section
    loginSection.classList.add('hidden');
    
    // Show dashboard section
    dashboardSection.classList.remove('hidden');
    
    // Update user display
    userDisplay.textContent = username;
    
    // Show logout button
    logoutButton.style.display = 'block';
    
    // Show customer management options
    addCustomerButton.style.display = 'block';
    
    // Show customer management buttons for all customers
    const viewButtons = document.querySelectorAll('.view-customer-btn');
    const editButtons = document.querySelectorAll('.edit-customer-btn');
    const deleteButtons = document.querySelectorAll('.delete-customer-btn');
    
    viewButtons.forEach(button => button.style.display = 'inline-block');
    editButtons.forEach(button => button.style.display = 'inline-block');
    deleteButtons.forEach(button => button.style.display = 'inline-block');
    
    console.log('Showing customer management buttons for logged in user:', username);
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
        githubAPI.getFile('data/customers.json')
            .then(content => {
                try {
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
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('github_token') && localStorage.getItem('username');
    console.log('Display customers - isLoggedIn:', isLoggedIn);
    
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
        
        // Hide buttons if not logged in
        if (!isLoggedIn) {
            console.log('Hiding customer management buttons');
            if (viewBtn) viewBtn.style.display = 'none';
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        } else {
            console.log('Showing customer management buttons');
        }
        
        if (viewBtn) viewBtn.setAttribute('data-customer-id', customer.id);
        if (editBtn) editBtn.setAttribute('data-customer-id', customer.id);
        if (deleteBtn) deleteBtn.setAttribute('data-customer-id', customer.id);
        
        // Add event listeners
        if (viewBtn) viewBtn.addEventListener('click', () => viewCustomerDashboard(customer.id));
        if (editBtn) editBtn.addEventListener('click', () => showEditCustomerModal(customer.id));
        if (deleteBtn) deleteBtn.addEventListener('click', () => showDeleteCustomerModal(customer.id));
        
        // Append to container
        customersContainer.appendChild(customerCard);
    });
}

// Rest of the code remains the same...
