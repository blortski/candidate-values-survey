/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.5.8
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

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing master admin dashboard v2...');
    
    // Set version in footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = config.version;
        console.log('Set version to:', config.version);
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
                if (error.message.includes('404')) {
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
            viewBtn.style.display = 'none';
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
        
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
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validate inputs
    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Generate customer ID
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if customer ID already exists
    if (customers.some(customer => customer.id === id)) {
        showError('A customer with this name already exists');
        return;
    }
    
    // Create customer object
    const customer = {
        id,
        name,
        adminEmail: email,
        adminPassword: password,
        created: new Date().toISOString(),
        stats: {
            values: 0,
            questions: 0,
            surveys: 0,
            employees: 0
        }
    };
    
    // Add customer to array
    customers.push(customer);
    
    // Save customers data
    saveCustomersData(customers)
        .then(() => {
            // Create customer data files
            return createCustomerDataFiles(id);
        })
        .then(() => {
            // Hide form
            hideAddCustomerForm();
            
            // Display updated customers
            displayCustomers(customers);
            
            // Show success message
            showSuccess('Customer added successfully');
        })
        .catch(error => {
            console.error('Error saving customer:', error);
            showError('Failed to save customer. Please try again.');
        });
}

/**
 * Create data files for a new customer
 * @param {string} customerId - The customer ID
 */
function createCustomerDataFiles(customerId) {
    return new Promise((resolve, reject) => {
        // Create empty values file
        const valuesData = [];
        
        // Create empty employees file
        const employeesData = [];
        
        // Create empty surveys file
        const surveysData = [];
        
        // Create default questions file
        const questionsData = [
            {
                id: 'q1',
                valueId: 'optimism',
                text: 'I believe that most problems can be solved with the right approach.',
                category: 'Optimism'
            },
            {
                id: 'q2',
                valueId: 'optimism',
                text: 'When faced with a setback, I quickly look for new opportunities.',
                category: 'Optimism'
            },
            {
                id: 'q3',
                valueId: 'optimism',
                text: 'I generally expect good things to happen in my life and work.',
                category: 'Optimism'
            },
            {
                id: 'q4',
                valueId: 'optimism',
                text: 'I believe my actions can positively influence outcomes.',
                category: 'Optimism'
            },
            {
                id: 'q5',
                valueId: 'optimism',
                text: 'I tend to focus on what\'s going right rather than what\'s going wrong.',
                category: 'Optimism'
            },
            {
                id: 'q6',
                valueId: 'optimism',
                text: 'I believe that challenges are opportunities for growth.',
                category: 'Optimism'
            },
            {
                id: 'q7',
                valueId: 'optimism',
                text: 'I can usually find something positive even in difficult situations.',
                category: 'Optimism'
            },
            {
                id: 'q8',
                valueId: 'productivity',
                text: 'I consistently look for ways to improve efficiency in my work.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q9',
                valueId: 'productivity',
                text: 'I prioritize tasks effectively to maximize my productivity.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q10',
                valueId: 'productivity',
                text: 'I regularly reflect on my work processes to find improvements.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q11',
                valueId: 'productivity',
                text: 'I take initiative to solve problems without being asked.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q12',
                valueId: 'productivity',
                text: 'I seek feedback to improve my performance.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q13',
                valueId: 'productivity',
                text: 'I am comfortable adapting to new tools and methods.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q14',
                valueId: 'productivity',
                text: 'I take responsibility for my mistakes and learn from them.',
                category: 'Productivity & Continuous Improvement'
            },
            {
                id: 'q15',
                valueId: 'value',
                text: 'I make decisions based on what creates the most value.',
                category: 'Value Orientation'
            },
            {
                id: 'q16',
                valueId: 'value',
                text: 'I consider how my actions impact the company\'s bottom line.',
                category: 'Value Orientation'
            },
            {
                id: 'q17',
                valueId: 'value',
                text: 'I focus on delivering results that matter to customers.',
                category: 'Value Orientation'
            },
            {
                id: 'q18',
                valueId: 'value',
                text: 'I prioritize work that has the greatest impact.',
                category: 'Value Orientation'
            },
            {
                id: 'q19',
                valueId: 'value',
                text: 'I am mindful of using resources efficiently.',
                category: 'Value Orientation'
            },
            {
                id: 'q20',
                valueId: 'value',
                text: 'I consider both short-term needs and long-term value.',
                category: 'Value Orientation'
            },
            {
                id: 'q21',
                valueId: 'value',
                text: 'I regularly question if my work is adding sufficient value.',
                category: 'Value Orientation'
            },
            {
                id: 'q22',
                valueId: 'collaboration',
                text: 'I actively seek input from others when working on projects.',
                category: 'Collaboration'
            },
            {
                id: 'q23',
                valueId: 'collaboration',
                text: 'I communicate clearly and effectively with team members.',
                category: 'Collaboration'
            },
            {
                id: 'q24',
                valueId: 'collaboration',
                text: 'I value diverse perspectives and ideas from others.',
                category: 'Collaboration'
            },
            {
                id: 'q25',
                valueId: 'collaboration',
                text: 'I am willing to compromise to achieve team goals.',
                category: 'Collaboration'
            },
            {
                id: 'q26',
                valueId: 'collaboration',
                text: 'I readily share knowledge and resources with colleagues.',
                category: 'Collaboration'
            },
            {
                id: 'q27',
                valueId: 'collaboration',
                text: 'I take time to build positive relationships with coworkers.',
                category: 'Collaboration'
            },
            {
                id: 'q28',
                valueId: 'collaboration',
                text: 'I give credit to others for their contributions.',
                category: 'Collaboration'
            },
            {
                id: 'q29',
                valueId: 'insight',
                text: 'I can quickly identify the core issues in complex situations.',
                category: 'General Insight'
            },
            {
                id: 'q30',
                valueId: 'insight',
                text: 'I connect ideas from different domains to solve problems.',
                category: 'General Insight'
            }
        ];
        
        // Save files
        Promise.all([
            githubAPI.saveFile(`data/${customerId}/values.json`, JSON.stringify(valuesData, null, 2)),
            githubAPI.saveFile(`data/${customerId}/questions.json`, JSON.stringify(questionsData, null, 2)),
            githubAPI.saveFile(`data/${customerId}/employees.json`, JSON.stringify(employeesData, null, 2)),
            githubAPI.saveFile(`data/${customerId}/surveys.json`, JSON.stringify(surveysData, null, 2))
        ])
            .then(() => resolve())
            .catch(error => {
                console.error('Error creating customer data files:', error);
                reject(error);
            });
    });
}

/**
 * Save customers data to GitHub
 * @param {Array} customersData - Array of customer objects
 */
function saveCustomersData(customersData) {
    return githubAPI.saveFile('data/customers.json', JSON.stringify(customersData, null, 2))
        .catch(error => {
            console.error('Error saving customers data:', error);
            throw error;
        });
}

/**
 * Show the edit customer modal
 * @param {string} customerId - The ID of the customer to edit
 */
function showEditCustomerModal(customerId) {
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        showError('Customer not found');
        return;
    }
    
    // Set current customer ID
    currentCustomerId = customerId;
    
    // Set form values
    document.getElementById('edit-customer-name').value = customer.name;
    document.getElementById('edit-admin-email').value = customer.adminEmail;
    document.getElementById('edit-admin-password').value = '';
    
    // Show modal
    editCustomerModal.style.display = 'block';
}

/**
 * Save edited customer
 */
function saveEditedCustomer() {
    // Get form values
    const name = document.getElementById('edit-customer-name').value.trim();
    const email = document.getElementById('edit-admin-email').value.trim();
    const password = document.getElementById('edit-admin-password').value.trim();
    
    // Validate inputs
    if (!name || !email) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Find customer index
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    
    if (customerIndex === -1) {
        showError('Customer not found');
        return;
    }
    
    // Update customer
    customers[customerIndex].name = name;
    customers[customerIndex].adminEmail = email;
    
    // Update password if provided
    if (password) {
        customers[customerIndex].adminPassword = password;
    }
    
    // Save customers data
    saveCustomersData(customers)
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Display updated customers
            displayCustomers(customers);
            
            // Show success message
            showSuccess('Customer updated successfully');
        })
        .catch(error => {
            console.error('Error updating customer:', error);
            showError('Failed to update customer. Please try again.');
        });
}

/**
 * Show the delete customer confirmation modal
 * @param {string} customerId - The ID of the customer to delete
 */
function showDeleteCustomerModal(customerId) {
    // Set current customer ID
    currentCustomerId = customerId;
    
    // Show modal
    confirmDeleteModal.style.display = 'block';
}

/**
 * Delete a customer
 */
function deleteCustomer() {
    // Find customer index
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    
    if (customerIndex === -1) {
        showError('Customer not found');
        return;
    }
    
    // Get customer name for success message
    const customerName = customers[customerIndex].name;
    
    // Remove customer from array
    customers.splice(customerIndex, 1);
    
    // Save customers data
    saveCustomersData(customers)
        .then(() => {
            // Delete customer data files
            return deleteCustomerDataFiles(currentCustomerId);
        })
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Display updated customers
            displayCustomers(customers);
            
            // Show success message
            showSuccess(`Customer "${customerName}" deleted successfully`);
        })
        .catch(error => {
            console.error('Error deleting customer:', error);
            showError('Failed to delete customer. Please try again.');
        });
}

/**
 * Delete customer data files
 * @param {string} customerId - The ID of the customer to delete
 */
function deleteCustomerDataFiles(customerId) {
    return new Promise((resolve, reject) => {
        // Delete files
        Promise.all([
            githubAPI.deleteFile(`data/${customerId}/values.json`),
            githubAPI.deleteFile(`data/${customerId}/questions.json`),
            githubAPI.deleteFile(`data/${customerId}/employees.json`),
            githubAPI.deleteFile(`data/${customerId}/surveys.json`)
        ])
            .then(() => resolve())
            .catch(error => {
                console.error('Error deleting customer data files:', error);
                reject(error);
            });
    });
}

/**
 * View customer dashboard
 * @param {string} customerId - The ID of the customer to view
 */
function viewCustomerDashboard(customerId) {
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        showError('Customer not found');
        return;
    }
    
    // Store current customer ID in localStorage
    localStorage.setItem('current_customer_id', customerId);
    localStorage.setItem('current_customer_name', customer.name);
    
    // Redirect to customer admin dashboard
    window.location.href = 'customer-admin.html';
}

/**
 * Close all modals
 */
function closeAllModals() {
    // Hide edit customer modal
    editCustomerModal.style.display = 'none';
    
    // Hide confirm delete modal
    confirmDeleteModal.style.display = 'none';
}

/**
 * Show an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'alert error';
    errorElement.textContent = message;
    
    // Add to body
    document.body.appendChild(errorElement);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(errorElement);
        }, 500);
    }, 5000);
}

/**
 * Show a success message
 * @param {string} message - The success message to display
 */
function showSuccess(message) {
    // Create success element
    const successElement = document.createElement('div');
    successElement.className = 'alert success';
    successElement.textContent = message;
    
    // Add to body
    document.body.appendChild(successElement);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successElement.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(successElement);
        }, 500);
    }, 5000);
}
