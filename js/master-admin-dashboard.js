/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.6.1
 */

// Global variables
let githubAPI = null;
let customers = [];
let currentCustomerId = null;

// DOM elements
const dashboardSection = document.getElementById('dashboard-section');
const customersContainer = document.getElementById('customers-container');
const addCustomerForm = document.getElementById('add-customer-form');
const editCustomerModal = document.getElementById('edit-customer-modal');
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const logoutButton = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const addCustomerButton = document.getElementById('add-customer-btn');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing master admin dashboard...');
    
    // Set version in footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = config.version;
        console.log('Set version to:', config.version);
    }
    
    // Check if user is logged in
    checkLoginStatus();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Check if the user is logged in
 */
function checkLoginStatus() {
    const token = localStorage.getItem('github_token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
        console.log('User is logged in:', username);
        
        // Initialize GitHub API
        githubAPI = new GitHubAPI(token);
        
        // Update user display
        userDisplay.textContent = username;
        
        // Load customers
        loadCustomers();
    } else {
        console.log('User not logged in, redirecting to login page');
        window.location.href = 'admin-login.html';
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
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
 * Handle logout
 */
function handleLogout() {
    // Clear credentials
    localStorage.removeItem('github_token');
    localStorage.removeItem('username');
    
    // Redirect to login page
    window.location.href = 'admin-login.html';
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
