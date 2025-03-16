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
const viewCustomerButtons = document.querySelectorAll('.view-customer-btn');
const editCustomerButtons = document.querySelectorAll('.edit-customer-btn');
const deleteCustomerButtons = document.querySelectorAll('.delete-customer-btn');
const accessDashboardButtons = document.querySelectorAll('.access-dashboard-btn');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Set version in footer
    document.getElementById('app-version').textContent = config.version;
    
    console.log('Initializing master admin dashboard...');
    
    // Hide logout button initially
    logoutButton.style.display = 'none';
    
    // Hide customer management options initially
    addCustomerButton.style.display = 'none';
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
        // Auto-login with stored credentials
        loginWithStoredCredentials(username, token);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Logout button
    logoutButton.addEventListener('click', handleLogout);
    
    // Add customer button
    addCustomerButton.addEventListener('click', showAddCustomerForm);
    
    // Save customer button
    const saveCustomerBtn = document.getElementById('save-customer-btn');
    if (saveCustomerBtn) {
        saveCustomerBtn.addEventListener('click', saveNewCustomer);
    }
    
    // Cancel customer button
    const cancelCustomerBtn = document.getElementById('cancel-customer-btn');
    if (cancelCustomerBtn) {
        cancelCustomerBtn.addEventListener('click', hideAddCustomerForm);
    }
    
    // Save edit customer button
    const saveEditCustomerBtn = document.getElementById('save-edit-customer-btn');
    if (saveEditCustomerBtn) {
        saveEditCustomerBtn.addEventListener('click', saveEditedCustomer);
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCustomer);
    }
    
    // Close modal buttons
    const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
}

/**
 * Handle login form submission
 */
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const token = document.getElementById('github-token').value.trim();
    
    if (!username || !token) {
        showError('Please enter your username and GitHub token.');
        return;
    }
    
    // Validate master admin credentials
    // In a production environment, this would be a server-side check
    if (username !== 'admin') {
        showError('Invalid username or password.');
        return;
    }
    
    // Initialize GitHub API
    githubAPI = new GitHubAPI({
        token: token,
        owner: config.github.owner,
        repo: config.github.repo,
        branch: config.github.branch
    });
    
    // Test GitHub API connection
    try {
        const isValid = await githubAPI.testConnection();
        
        if (isValid) {
            // Save credentials to localStorage
            localStorage.setItem('github_token', token);
            localStorage.setItem('username', username);
            
            // Show dashboard
            showDashboard(username);
            
            // Load customers
            loadCustomers();
        } else {
            showError('Invalid GitHub token or repository access.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Error connecting to GitHub: ' + error.message);
    }
}

/**
 * Login with stored credentials
 * @param {string} username - The username
 * @param {string} token - The GitHub token
 */
async function loginWithStoredCredentials(username, token) {
    // Initialize GitHub API
    githubAPI = new GitHubAPI({
        token: token,
        owner: config.github.owner,
        repo: config.github.repo,
        branch: config.github.branch
    });
    
    // Test GitHub API connection
    try {
        const isValid = await githubAPI.testConnection();
        
        if (isValid) {
            // Show dashboard
            showDashboard(username);
            
            // Load customers
            loadCustomers();
        } else {
            // Invalid token, clear localStorage
            localStorage.removeItem('github_token');
            localStorage.removeItem('username');
            
            showError('Stored GitHub token is invalid. Please log in again.');
        }
    } catch (error) {
        console.error('Auto-login error:', error);
        
        // Clear localStorage
        localStorage.removeItem('github_token');
        localStorage.removeItem('username');
        
        showError('Error connecting to GitHub: ' + error.message);
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    // Clear localStorage
    localStorage.removeItem('github_token');
    localStorage.removeItem('username');
    
    // Reset GitHub API
    githubAPI = null;
    
    // Show login section
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    
    // Clear form fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('github-token').value = '';
    
    // Update user display
    userDisplay.textContent = 'Not logged in';
    
    // Hide logout button
    logoutButton.style.display = 'none';
    
    // Hide customer management options
    addCustomerButton.style.display = 'none';
    viewCustomerButtons.forEach(button => button.style.display = 'none');
    editCustomerButtons.forEach(button => button.style.display = 'none');
    deleteCustomerButtons.forEach(button => button.style.display = 'none');
    accessDashboardButtons.forEach(button => button.style.display = 'none');
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
    viewCustomerButtons.forEach(button => button.style.display = 'block');
    editCustomerButtons.forEach(button => button.style.display = 'block');
    deleteCustomerButtons.forEach(button => button.style.display = 'block');
    accessDashboardButtons.forEach(button => button.style.display = 'block');
}

/**
 * Load customers from GitHub
 */
async function loadCustomers() {
    console.log('Loading customers...');
    
    // Show loading indicator
    customersContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading customers...</p>
        </div>
    `;
    
    try {
        // Get customers data from GitHub
        const customersData = await getCustomersData();
        
        if (customersData && customersData.length > 0) {
            customers = customersData;
            displayCustomers(customers);
        } else {
            customersContainer.innerHTML = '<p>No customers found. Add your first customer using the button above.</p>';
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        customersContainer.innerHTML = `<p class="error-message">Error loading customers: ${error.message}</p>`;
    }
}

/**
 * Get customers data from GitHub
 * @returns {Promise<Array>} - Promise resolving to array of customers
 */
async function getCustomersData() {
    // In a production environment, this would fetch from a database
    // For now, we'll simulate by fetching from a JSON file in GitHub
    
    try {
        // Check if customers.json exists
        const exists = await githubAPI.fileExists('data/customers.json');
        
        if (exists) {
            const response = await githubAPI.getFileContent('data/customers.json');
            return JSON.parse(atob(response.content));
        } else {
            // Create empty customers file
            await githubAPI.createFile('data/customers.json', JSON.stringify([]));
            return [];
        }
    } catch (error) {
        console.error('Error getting customers data:', error);
        throw error;
    }
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
    
    // Clear form fields
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-id').value = '';
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-password').value = '';
}

/**
 * Hide the add customer form
 */
function hideAddCustomerForm() {
    addCustomerForm.classList.add('hidden');
}

/**
 * Save a new customer
 */
async function saveNewCustomer() {
    const name = document.getElementById('customer-name').value.trim();
    const id = document.getElementById('customer-id').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    
    if (!name || !id || !email || !password) {
        showError('Please fill in all fields.');
        return;
    }
    
    // Check if ID already exists
    if (customers.some(c => c.id === id)) {
        showError('A customer with this ID already exists. Please choose a different ID.');
        return;
    }
    
    // Create new customer object
    const newCustomer = {
        id: id,
        name: name,
        adminEmail: email,
        adminPassword: password, // In production, this would be hashed
        created: new Date().toISOString(),
        stats: {
            values: 0,
            questions: 0,
            surveys: 0,
            employees: 0
        }
    };
    
    try {
        // Add to customers array
        customers.push(newCustomer);
        
        // Save to GitHub
        await saveCustomersData(customers);
        
        // Hide form
        hideAddCustomerForm();
        
        // Refresh display
        displayCustomers(customers);
        
        // Create customer-specific data files
        await createCustomerDataFiles(id);
        
        showSuccess('Customer added successfully.');
    } catch (error) {
        console.error('Error saving customer:', error);
        showError('Error saving customer: ' + error.message);
    }
}

/**
 * Create data files for a new customer
 * @param {string} customerId - The customer ID
 */
async function createCustomerDataFiles(customerId) {
    try {
        // Create values.json
        const defaultValues = [
            {
                id: 1,
                name: "Optimism",
                description: "Maintaining a positive outlook and finding solutions in challenging situations.",
                enabled: true
            },
            {
                id: 2,
                name: "Productivity",
                description: "Organizing work effectively and continuously improving processes.",
                enabled: true
            },
            {
                id: 3,
                name: "Value Orientation",
                description: "Focusing on business value and making decisions that drive meaningful results.",
                enabled: true
            },
            {
                id: 4,
                name: "Collaboration",
                description: "Working well with others and communicating effectively in a team environment.",
                enabled: true
            }
        ];
        
        // Create survey.json with default categories and questions
        const defaultSurvey = {
            categories: [
                {
                    id: 1,
                    name: "Optimism",
                    description: "Measures the candidate's ability to maintain a positive outlook and find solutions in challenging situations.",
                    questions: [1, 2, 3]
                },
                {
                    id: 2,
                    name: "Productivity",
                    description: "Measures the candidate's ability to organize work effectively and continuously improve processes.",
                    questions: [4, 5, 6]
                },
                {
                    id: 3,
                    name: "Value Orientation",
                    description: "Measures the candidate's ability to focus on business value and make decisions that drive meaningful results.",
                    questions: [7, 8, 9]
                },
                {
                    id: 4,
                    name: "Collaboration",
                    description: "Measures the candidate's ability to work well with others and communicate effectively in a team environment.",
                    questions: [10, 11, 12]
                }
            ]
        };
        
        // Create questions.json with default questions
        const defaultQuestions = [
            {
                id: 1,
                valueId: 1,
                text: "When faced with a difficult problem, I typically:",
                options: [
                    { id: "a", text: "Focus on the obstacles and potential issues", score: 1 },
                    { id: "b", text: "Feel overwhelmed but try to find a way forward", score: 2 },
                    { id: "c", text: "Look for creative solutions and remain positive", score: 3 }
                ]
            },
            {
                id: 2,
                valueId: 1,
                text: "If a project encounters unexpected challenges:",
                options: [
                    { id: "a", text: "I tend to focus on what went wrong", score: 1 },
                    { id: "b", text: "I acknowledge the setback but continue working", score: 2 },
                    { id: "c", text: "I see it as an opportunity to learn and improve", score: 3 }
                ]
            },
            {
                id: 3,
                valueId: 1,
                text: "When receiving critical feedback, I usually:",
                options: [
                    { id: "a", text: "Take it personally and feel discouraged", score: 1 },
                    { id: "b", text: "Accept it but feel somewhat defensive", score: 2 },
                    { id: "c", text: "Appreciate the opportunity to improve", score: 3 }
                ]
            },
            {
                id: 4,
                valueId: 2,
                text: "When managing multiple tasks, I typically:",
                options: [
                    { id: "a", text: "Feel overwhelmed and struggle to prioritize", score: 1 },
                    { id: "b", text: "Handle the most urgent tasks first", score: 2 },
                    { id: "c", text: "Create a structured plan and systematically work through it", score: 3 }
                ]
            },
            {
                id: 5,
                valueId: 2,
                text: "When it comes to improving work processes:",
                options: [
                    { id: "a", text: "I prefer to stick with established methods", score: 1 },
                    { id: "b", text: "I'm open to suggestions but rarely initiate changes", score: 2 },
                    { id: "c", text: "I actively look for ways to enhance efficiency", score: 3 }
                ]
            },
            {
                id: 6,
                valueId: 2,
                text: "When I have downtime at work:",
                options: [
                    { id: "a", text: "I wait for new assignments", score: 1 },
                    { id: "b", text: "I check if colleagues need help", score: 2 },
                    { id: "c", text: "I find productive tasks or learn something new", score: 3 }
                ]
            },
            {
                id: 7,
                valueId: 3,
                text: "When making decisions, I prioritize:",
                options: [
                    { id: "a", text: "What's easiest or most convenient", score: 1 },
                    { id: "b", text: "What others expect me to do", score: 2 },
                    { id: "c", text: "What creates the most value for the business", score: 3 }
                ]
            },
            {
                id: 8,
                valueId: 3,
                text: "When evaluating a new project or initiative:",
                options: [
                    { id: "a", text: "I focus mainly on whether I find it interesting", score: 1 },
                    { id: "b", text: "I consider both personal interest and business impact", score: 2 },
                    { id: "c", text: "I analyze how it aligns with company goals and creates value", score: 3 }
                ]
            },
            {
                id: 9,
                valueId: 3,
                text: "If I notice a task that doesn't seem to add value:",
                options: [
                    { id: "a", text: "I complete it anyway without questioning", score: 1 },
                    { id: "b", text: "I might suggest changes if asked", score: 2 },
                    { id: "c", text: "I proactively suggest alternatives or improvements", score: 3 }
                ]
            },
            {
                id: 10,
                valueId: 4,
                text: "When working in a team:",
                options: [
                    { id: "a", text: "I prefer to work independently on my assigned tasks", score: 1 },
                    { id: "b", text: "I participate in group discussions when needed", score: 2 },
                    { id: "c", text: "I actively engage with team members and support collaboration", score: 3 }
                ]
            },
            {
                id: 11,
                valueId: 4,
                text: "When there's a disagreement in the team:",
                options: [
                    { id: "a", text: "I avoid the conflict or disengage", score: 1 },
                    { id: "b", text: "I state my opinion but don't push for resolution", score: 2 },
                    { id: "c", text: "I work toward finding common ground and consensus", score: 3 }
                ]
            },
            {
                id: 12,
                valueId: 4,
                text: "When communicating complex information:",
                options: [
                    { id: "a", text: "I share the facts without much explanation", score: 1 },
                    { id: "b", text: "I provide some context to help understanding", score: 2 },
                    { id: "c", text: "I tailor my communication to ensure clarity for my audience", score: 3 }
                ]
            }
        ];
        
        // Create employees.json (empty array)
        const defaultEmployees = [];
        
        // Create surveys.json (empty array)
        const defaultSurveys = [];
        
        // Save files to GitHub
        await githubAPI.createFile(`data/customers/${customerId}/values.json`, JSON.stringify(defaultValues, null, 2));
        await githubAPI.createFile(`data/customers/${customerId}/survey.json`, JSON.stringify(defaultSurvey, null, 2));
        await githubAPI.createFile(`data/customers/${customerId}/questions.json`, JSON.stringify(defaultQuestions, null, 2));
        await githubAPI.createFile(`data/customers/${customerId}/employees.json`, JSON.stringify(defaultEmployees, null, 2));
        await githubAPI.createFile(`data/customers/${customerId}/surveys.json`, JSON.stringify(defaultSurveys, null, 2));
        
        console.log(`Created data files for customer ${customerId}`);
        return true;
    } catch (error) {
        console.error(`Error creating data files for customer ${customerId}:`, error);
        throw error;
    }
}

/**
 * Save customers data to GitHub
 * @param {Array} customersData - Array of customer objects
 */
async function saveCustomersData(customersData) {
    try {
        // Check if customers.json exists
        const exists = await githubAPI.fileExists('data/customers.json');
        
        if (exists) {
            // Update file
            await githubAPI.updateFile('data/customers.json', JSON.stringify(customersData, null, 2));
        } else {
            // Create file
            await githubAPI.createFile('data/customers.json', JSON.stringify(customersData, null, 2));
        }
        
        return true;
    } catch (error) {
        console.error('Error saving customers data:', error);
        throw error;
    }
}

/**
 * Show the edit customer modal
 * @param {string} customerId - The ID of the customer to edit
 */
function showEditCustomerModal(customerId) {
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        showError('Customer not found.');
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
async function saveEditedCustomer() {
    if (!currentCustomerId) {
        showError('No customer selected.');
        return;
    }
    
    // Find customer index
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    
    if (customerIndex === -1) {
        showError('Customer not found.');
        return;
    }
    
    // Get form values
    const name = document.getElementById('edit-customer-name').value.trim();
    const email = document.getElementById('edit-admin-email').value.trim();
    const password = document.getElementById('edit-admin-password').value.trim();
    
    if (!name || !email) {
        showError('Please fill in all required fields.');
        return;
    }
    
    // Update customer object
    customers[customerIndex].name = name;
    customers[customerIndex].adminEmail = email;
    
    // Only update password if provided
    if (password) {
        customers[customerIndex].adminPassword = password; // In production, this would be hashed
    }
    
    try {
        // Save to GitHub
        await saveCustomersData(customers);
        
        // Close modal
        closeAllModals();
        
        // Refresh display
        displayCustomers(customers);
        
        showSuccess('Customer updated successfully.');
    } catch (error) {
        console.error('Error updating customer:', error);
        showError('Error updating customer: ' + error.message);
    }
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
async function deleteCustomer() {
    if (!currentCustomerId) {
        showError('No customer selected.');
        return;
    }
    
    try {
        // Remove from customers array
        customers = customers.filter(c => c.id !== currentCustomerId);
        
        // Save to GitHub
        await saveCustomersData(customers);
        
        // Delete customer data files
        await deleteCustomerDataFiles(currentCustomerId);
        
        // Close modal
        closeAllModals();
        
        // Refresh display
        displayCustomers(customers);
        
        showSuccess('Customer deleted successfully.');
    } catch (error) {
        console.error('Error deleting customer:', error);
        showError('Error deleting customer: ' + error.message);
    }
}

/**
 * Delete customer data files
 * @param {string} customerId - The ID of the customer to delete
 */
async function deleteCustomerDataFiles(customerId) {
    try {
        // In a production environment, we would delete all customer files
        // For now, we'll just log that we would delete them
        console.log(`Would delete data files for customer ${customerId}`);
        
        // This is a placeholder for actual file deletion
        // In GitHub, we can't delete directories directly, we would need to delete each file
        
        return true;
    } catch (error) {
        console.error(`Error deleting data files for customer ${customerId}:`, error);
        throw error;
    }
}

/**
 * View customer dashboard
 * @param {string} customerId - The ID of the customer to view
 */
function viewCustomerDashboard(customerId) {
    // Find customer
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        showError('Customer not found.');
        return;
    }
    
    // Store customer ID in localStorage for the customer admin page
    localStorage.setItem('current_customer_id', customerId);
    localStorage.setItem('current_customer_name', customer.name);
    
    // Redirect to customer admin page
    window.location.href = `customer-admin.html?id=${customerId}`;
}

/**
 * Close all modals
 */
function closeAllModals() {
    // Hide all modals
    editCustomerModal.style.display = 'none';
    confirmDeleteModal.style.display = 'none';
    
    // Reset current customer ID
    currentCustomerId = null;
}

/**
 * Show an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.getElementById('error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.body.appendChild(errorElement);
    }
    
    // Show error message
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

/**
 * Show a success message
 * @param {string} message - The success message to display
 */
function showSuccess(message) {
    // Create success element if it doesn't exist
    let successElement = document.getElementById('success-message');
    
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'success-message';
        successElement.className = 'success-message';
        document.body.appendChild(successElement);
    }
    
    // Show success message
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

/**
 * Access customer-specific admin dashboard
 * @param {string} customerId - The ID of the customer
 * @param {string} customerName - The name of the customer
 */
function accessCustomerDashboard(customerId, customerName) {
    // Store customer name in localStorage for display in the customer admin dashboard
    localStorage.setItem('current_customer_name', customerName);
    
    // Navigate to customer admin dashboard
    window.location.href = `customer-admin.html?id=${customerId}`;
}
