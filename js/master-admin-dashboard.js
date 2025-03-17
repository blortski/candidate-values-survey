/**
 * ValuesAlign - Master Admin Dashboard
 * 
 * This script handles the functionality for the master admin dashboard,
 * including customer management, authentication, and data operations.
 * 
 * Version: v1.9.1
 */

// Global variables
let dashboardAPI = null;
let customers = [];
let currentCustomerId = null;
let currentCustomerValues = [];
let currentCustomerQuestions = [];
let currentCustomerAdmins = [];
let currentTab = 'values-tab';

// Wait for the DOM to be fully loaded before executing any code
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== MASTER ADMIN DASHBOARD INITIALIZATION ===');
    console.log('Master Admin Dashboard v1.9.2 initializing...');
    console.log('Time:', new Date().toISOString());
    
    // Update version in the footer
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = 'v1.9.1';
        console.log('Version set to v1.9.1');
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
        
        // Initialize GitHub API - Use the existing githubAPI instance from github-api.js
        console.log('Setting up GitHub API...');
        try {
            console.log('GitHub API config:', {
                owner: config.github.owner,
                repo: config.github.repo,
                branch: config.github.branch,
                resultsPath: config.github.resultsPath,
                token: token ? token.substring(0, 4) + '...' : 'not available'
            });
            
            // Check if githubAPI already exists (from github-api.js)
            if (window.githubAPI) {
                console.log('Using existing githubAPI instance');
                // Update the token in the existing instance
                window.githubAPI.setToken(token);
                dashboardAPI = window.githubAPI;
            } else {
                console.log('Creating new GitHubAPI instance');
                // Create a new instance if not already created
                dashboardAPI = new GitHubAPI({
                    owner: config.github.owner,
                    repo: config.github.repo,
                    branch: config.github.branch,
                    resultsPath: config.github.resultsPath,
                    token: token
                });
            }
            
            console.log('GitHub API initialized successfully');
            
            // Load customers
            console.log('Loading customers...');
            loadCustomers();
            
            // Set up remaining event listeners for dashboard functionality
            console.log('Setting up dashboard event listeners...');
            setupDashboardEventListeners();
            setupTabEventListeners();
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
    
    // Add customer form
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const customerForm = document.getElementById('customer-form');
    const cancelAddCustomerBtn = document.getElementById('cancel-add-customer');
    
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', showAddCustomerForm);
        console.log('Add customer button event listener added');
    }
    
    if (customerForm) {
        customerForm.addEventListener('submit', saveNewCustomer);
        console.log('Customer form submit event listener added');
    }
    
    if (cancelAddCustomerBtn) {
        cancelAddCustomerBtn.addEventListener('click', hideAddCustomerForm);
        console.log('Cancel add customer button event listener added');
    }
    
    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
        console.log('Close modal button event listener added');
    });
    
    // Add value form
    const addValueForm = document.getElementById('add-value-form');
    if (addValueForm) {
        addValueForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNewValue();
        });
        console.log('Add value form submit event listener added');
    }
    
    // Add question form
    const addQuestionForm = document.getElementById('add-question-form');
    if (addQuestionForm) {
        addQuestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNewQuestion();
        });
        console.log('Add question form submit event listener added');
    }
    
    // Add admin form
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNewAdmin();
        });
        console.log('Add admin form submit event listener added');
    }
    
    // Edit customer form
    const saveEditCustomerBtn = document.getElementById('save-edit-customer-btn');
    if (saveEditCustomerBtn) {
        saveEditCustomerBtn.addEventListener('click', saveEditedCustomer);
        console.log('Save edit customer button event listener added');
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCustomer);
        console.log('Confirm delete button event listener added');
    }
    
    // Logo file input
    const logoFileInput = document.getElementById('logo-file');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', previewLogo);
        console.log('Logo file input change event listener added');
    }
    
    // Save logo button
    const saveLogoBtn = document.getElementById('save-logo-btn');
    if (saveLogoBtn) {
        saveLogoBtn.addEventListener('click', saveLogo);
        console.log('Save logo button event listener added');
    }
    
    // Add value button
    const addValueBtn = document.getElementById('add-value-btn');
    if (addValueBtn) {
        addValueBtn.addEventListener('click', showAddValueModal);
        console.log('Add value button event listener added');
    }
    
    // Add question button
    const addQuestionBtn = document.getElementById('add-question-btn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', showAddQuestionModal);
        console.log('Add question button event listener added');
    }
    
    // Add admin button
    const addAdminBtn = document.getElementById('add-admin-btn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', showAddAdminModal);
        console.log('Add admin button event listener added');
    }
    
    // Edit value button
    const saveEditValueBtn = document.getElementById('save-edit-value-btn');
    if (saveEditValueBtn) {
        saveEditValueBtn.addEventListener('click', saveEditedValue);
        console.log('Save edit value button event listener added');
    }
    
    // Edit question button
    const saveEditQuestionBtn = document.getElementById('save-edit-question-btn');
    if (saveEditQuestionBtn) {
        saveEditQuestionBtn.addEventListener('click', saveEditedQuestion);
        console.log('Save edit question button event listener added');
    }
    
    // Edit admin button
    const saveEditAdminBtn = document.getElementById('save-edit-admin-btn');
    if (saveEditAdminBtn) {
        saveEditAdminBtn.addEventListener('click', saveEditedAdmin);
        console.log('Save edit admin button event listener added');
    }
    
    // Logo URL input
    const logoUrlInput = document.getElementById('logo-url');
    if (logoUrlInput) {
        logoUrlInput.addEventListener('input', function() {
            const previewImg = document.getElementById('logo-preview-img');
            if (previewImg) {
                previewImg.src = this.value;
            }
        });
        console.log('Logo URL input event listener added');
    }
    
    console.log('Dashboard event listeners setup complete');
}

/**
 * Set up event listeners for tab functionality
 */
function setupTabEventListeners() {
    console.log('Setting up tab event listeners...');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        console.log('Tab buttons event listeners added');
    } else {
        console.error('No tab buttons found');
    }
}

/**
 * Switch between tabs
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // Update current tab
    currentTab = tabId;
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTabContent = document.getElementById(tabId);
    if (selectedTabContent) {
        selectedTabContent.classList.add('active');
    }
    
    // Add active class to selected tab button
    const selectedTabButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    }
    
    console.log('Tab switched to:', tabId);
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
 * Load all customers from GitHub
 */
function loadCustomers() {
    console.log('Loading customers...');
    
    if (!dashboardAPI) {
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
    
    // Get customers from GitHub
    console.log('Fetching customers from GitHub...');
    
    // Path to the customers.json file in the repo
    const customersFilePath = 'data/customers.json';
    
    // Check if the file exists, if not create it
    dashboardAPI.getFile(customersFilePath)
        .then(response => {
            console.log('Customers file found:', response);
            
            // Parse the content
            try {
                if (response && response.content) {
                    const content = atob(response.content);
                    customers = JSON.parse(content);
                    console.log('Customers loaded from GitHub:', customers.length, 'customers');
                } else {
                    console.log('No customers found or empty file');
                    customers = [];
                }
                
                displayCustomers();
            } catch (error) {
                console.error('Error parsing customers data:', error);
                showNotification('Error loading customers. Please try again.');
                customersContainer.innerHTML = '<div class="error">Error loading customers. Please try again.</div>';
            }
        })
        .catch(error => {
            console.log('Customers file not found or error:', error);
            console.log('Creating new customers file...');
            
            // Initialize with sample data if file doesn't exist
            customers = [
                { 
                    id: '1', 
                    name: 'Wild Zora Foods', 
                    contact: 'Joshua Tabin', 
                    email: 'joshua@wildzora.com',
                    logo: '',
                    values: [],
                    questions: [],
                    admins: []
                }
            ];
            
            // Save the initial customers file
            saveCustomersToGitHub()
                .then(() => {
                    console.log('Initial customers file created');
                    displayCustomers();
                })
                .catch(error => {
                    console.error('Error creating customers file:', error);
                    showNotification('Error creating customers file. Please try again.');
                    customersContainer.innerHTML = '<div class="error">Error creating customers file. Please try again.</div>';
                });
        });
}

/**
 * Save customers data to GitHub
 * @returns {Promise} - Promise that resolves when the file is saved
 */
function saveCustomersToGitHub() {
    console.log('Saving customers to GitHub...');
    
    if (!dashboardAPI) {
        console.error('GitHub API not initialized');
        return Promise.reject('GitHub API not initialized');
    }
    
    // Path to the customers.json file in the repo
    const customersFilePath = 'data/customers.json';
    
    // Convert customers array to JSON string
    const content = JSON.stringify(customers, null, 2);
    
    // Save to GitHub
    return dashboardAPI.saveFile(customersFilePath, content, 'Update customers data')
        .then(response => {
            console.log('Customers saved to GitHub:', response);
            return response;
        })
        .catch(error => {
            console.error('Error saving customers to GitHub:', error);
            throw error;
        });
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
        
        // Create logo HTML
        const logoHtml = customer.logo ? 
            `<div class="customer-logo-container">
                <img src="${customer.logo}" alt="${customer.name} Logo" class="customer-logo">
            </div>` : '';
        
        customerCard.innerHTML = `
            ${logoHtml}
            <h3>${customer.name}</h3>
            <p><strong>Contact:</strong> ${customer.contact}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <div class="card-actions">
                <button class="btn btn-small manage-values-btn" data-id="${customer.id}" data-name="${customer.name}">Manage Values</button>
                <button class="btn btn-small edit-customer-btn" data-id="${customer.id}">Edit</button>
                <button class="btn btn-small btn-danger delete-customer-btn" data-id="${customer.id}">Delete</button>
            </div>
        `;
        
        customersContainer.appendChild(customerCard);
        
        // Add event listeners to buttons
        const manageValuesButton = customerCard.querySelector('.manage-values-btn');
        const editButton = customerCard.querySelector('.edit-customer-btn');
        const deleteButton = customerCard.querySelector('.delete-customer-btn');
        
        if (manageValuesButton) {
            manageValuesButton.addEventListener('click', () => showCustomerValuesModal(customer.id, customer.name));
        }
        
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
 * Show the customer values modal
 * @param {string} customerId - The ID of the customer
 * @param {string} customerName - The name of the customer
 */
function showCustomerValuesModal(customerId, customerName) {
    console.log('Showing customer values modal for customer ID:', customerId);
    
    const customerValuesModal = document.getElementById('customer-values-modal');
    if (!customerValuesModal) {
        console.error('Customer values modal not found');
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
    
    // Set customer name in modal
    const customerNameElement = document.getElementById('values-customer-name');
    if (customerNameElement) {
        customerNameElement.textContent = customerName;
    }
    
    // Store customer data
    currentCustomerValues = customer.values || [];
    currentCustomerQuestions = customer.questions || [];
    currentCustomerAdmins = customer.admins || [];
    
    // Display values, questions, and admins
    displayValues();
    displayQuestions();
    displayAdmins();
    
    // Display logo
    const currentLogoImg = document.getElementById('current-logo-img');
    if (currentLogoImg) {
        currentLogoImg.src = customer.logo || '';
    }
    
    // Show modal
    customerValuesModal.classList.remove('hidden');
    console.log('Customer values modal shown');
    
    // Switch to first tab
    switchTab('values-tab');
}

/**
 * Display values for the current customer
 */
function displayValues() {
    console.log('Displaying values for customer ID:', currentCustomerId);
    
    const valuesContainer = document.getElementById('values-container');
    if (!valuesContainer) {
        console.error('Values container not found');
        return;
    }
    
    // Clear values container
    valuesContainer.innerHTML = '';
    
    if (currentCustomerValues.length === 0) {
        valuesContainer.innerHTML = '<div class="no-data">No values found</div>';
        console.log('No values to display');
        return;
    }
    
    // Add value cards
    currentCustomerValues.forEach(value => {
        const valueCard = document.createElement('div');
        valueCard.className = 'value-card';
        valueCard.innerHTML = `
            <h4>${value.name}</h4>
            <p>${value.description}</p>
            <div class="card-actions">
                <button class="btn btn-small edit-value-btn" data-id="${value.id}">Edit</button>
                <button class="btn btn-small btn-danger delete-value-btn" data-id="${value.id}">Delete</button>
            </div>
        `;
        
        valuesContainer.appendChild(valueCard);
        
        // Add event listeners to buttons
        const editButton = valueCard.querySelector('.edit-value-btn');
        const deleteButton = valueCard.querySelector('.delete-value-btn');
        
        if (editButton) {
            editButton.addEventListener('click', () => showEditValueModal(value.id));
        }
        
        if (deleteButton) {
            deleteButton.addEventListener('click', () => deleteValue(value.id));
        }
    });
    
    console.log('Value cards created and added to container');
}

/**
 * Display questions for the current customer
 */
function displayQuestions() {
    console.log('Displaying questions for customer ID:', currentCustomerId);
    
    const questionsContainer = document.getElementById('questions-container');
    if (!questionsContainer) {
        console.error('Questions container not found');
        return;
    }
    
    // Clear questions container
    questionsContainer.innerHTML = '';
    
    if (currentCustomerQuestions.length === 0) {
        questionsContainer.innerHTML = '<div class="no-data">No questions found</div>';
        console.log('No questions to display');
        return;
    }
    
    // Add question cards
    currentCustomerQuestions.forEach(question => {
        // Find associated value
        const value = currentCustomerValues.find(v => v.id === question.valueId);
        const valueName = value ? value.name : 'Unknown';
        
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.innerHTML = `
            <h4>Question</h4>
            <p>${question.text}</p>
            <p><strong>Value:</strong> ${valueName}</p>
            <div class="card-actions">
                <button class="btn btn-small edit-question-btn" data-id="${question.id}">Edit</button>
                <button class="btn btn-small btn-danger delete-question-btn" data-id="${question.id}">Delete</button>
            </div>
        `;
        
        questionsContainer.appendChild(questionCard);
        
        // Add event listeners to buttons
        const editButton = questionCard.querySelector('.edit-question-btn');
        const deleteButton = questionCard.querySelector('.delete-question-btn');
        
        if (editButton) {
            editButton.addEventListener('click', () => showEditQuestionModal(question.id));
        }
        
        if (deleteButton) {
            deleteButton.addEventListener('click', () => deleteQuestion(question.id));
        }
    });
    
    console.log('Question cards created and added to container');
}

/**
 * Display admins for the current customer
 */
function displayAdmins() {
    console.log('Displaying admins for customer ID:', currentCustomerId);
    
    const adminsContainer = document.getElementById('admins-container');
    if (!adminsContainer) {
        console.error('Admins container not found');
        return;
    }
    
    // Clear admins container
    adminsContainer.innerHTML = '';
    
    if (currentCustomerAdmins.length === 0) {
        adminsContainer.innerHTML = '<div class="no-data">No admins found</div>';
        console.log('No admins to display');
        return;
    }
    
    // Add admin cards
    currentCustomerAdmins.forEach(admin => {
        const adminCard = document.createElement('div');
        adminCard.className = 'admin-card';
        adminCard.innerHTML = `
            <h4>${admin.name}</h4>
            <p><strong>Email:</strong> ${admin.email}</p>
            <div class="card-actions">
                <button class="btn btn-small edit-admin-btn" data-id="${admin.id}">Edit</button>
                <button class="btn btn-small btn-danger delete-admin-btn" data-id="${admin.id}">Delete</button>
            </div>
        `;
        
        adminsContainer.appendChild(adminCard);
        
        // Add event listeners to buttons
        const editButton = adminCard.querySelector('.edit-admin-btn');
        const deleteButton = adminCard.querySelector('.delete-admin-btn');
        
        if (editButton) {
            editButton.addEventListener('click', () => showEditAdminModal(admin.id));
        }
        
        if (deleteButton) {
            deleteButton.addEventListener('click', () => deleteAdmin(admin.id));
        }
    });
    
    console.log('Admin cards created and added to container');
}

/**
 * Show the add value modal
 */
function showAddValueModal() {
    console.log('Showing add value modal');
    
    const addValueModal = document.getElementById('add-value-modal');
    if (!addValueModal) {
        console.error('Add value modal not found');
        return;
    }
    
    // Clear form
    const valueNameInput = document.getElementById('value-name');
    const valueDescriptionInput = document.getElementById('value-description');
    
    if (valueNameInput) valueNameInput.value = '';
    if (valueDescriptionInput) valueDescriptionInput.value = '';
    
    // Show modal
    addValueModal.classList.remove('hidden');
    console.log('Add value modal shown');
}

/**
 * Save a new value
 */
function saveNewValue() {
    console.log('Saving new value...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Get form values
    const valueNameInput = document.getElementById('value-name');
    const valueDescriptionInput = document.getElementById('value-description');
    
    if (!valueNameInput || !valueDescriptionInput) {
        console.error('Form inputs not found');
        return;
    }
    
    const name = valueNameInput.value.trim();
    const description = valueDescriptionInput.value.trim();
    
    // Validate inputs
    if (!name || !description) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Create new value
    const newValue = {
        id: Date.now().toString(),
        name,
        description
    };
    
    console.log('New value created:', newValue);
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Ensure values array exists
    if (!customers[customerIndex].values) {
        customers[customerIndex].values = [];
    }
    
    // Add to values array
    customers[customerIndex].values.push(newValue);
    console.log('Value added to customer, total values:', customers[customerIndex].values.length);
    
    // Update current values
    currentCustomerValues = customers[customerIndex].values;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayValues();
            
            // Show notification
            showNotification('Value added successfully');
        })
        .catch(error => {
            console.error('Error saving value:', error);
            showNotification('Error adding value. Please try again.');
        });
}

/**
 * Show the edit value modal
 * @param {string} valueId - The ID of the value to edit
 */
function showEditValueModal(valueId) {
    console.log('Showing edit value modal for value ID:', valueId);
    
    const editValueModal = document.getElementById('edit-value-modal');
    if (!editValueModal) {
        console.error('Edit value modal not found');
        return;
    }
    
    // Find value
    const value = currentCustomerValues.find(v => v.id === valueId);
    if (!value) {
        console.error('Value not found:', valueId);
        return;
    }
    
    // Set value ID in data attribute
    editValueModal.setAttribute('data-value-id', valueId);
    
    // Fill form fields
    const valueNameInput = document.getElementById('edit-value-name');
    const valueDescriptionInput = document.getElementById('edit-value-description');
    
    if (valueNameInput) valueNameInput.value = value.name;
    if (valueDescriptionInput) valueDescriptionInput.value = value.description;
    
    // Show modal
    editValueModal.classList.remove('hidden');
    console.log('Edit value modal shown');
}

/**
 * Save the edited value
 */
function saveEditedValue() {
    console.log('Saving edited value...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    const editValueModal = document.getElementById('edit-value-modal');
    if (!editValueModal) {
        console.error('Edit value modal not found');
        return;
    }
    
    // Get value ID from data attribute
    const valueId = editValueModal.getAttribute('data-value-id');
    if (!valueId) {
        console.error('No value ID set');
        return;
    }
    
    // Get form values
    const valueNameInput = document.getElementById('edit-value-name');
    const valueDescriptionInput = document.getElementById('edit-value-description');
    
    if (!valueNameInput || !valueDescriptionInput) {
        console.error('Form inputs not found');
        return;
    }
    
    const name = valueNameInput.value.trim();
    const description = valueDescriptionInput.value.trim();
    
    // Validate inputs
    if (!name || !description) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Find value
    const valueIndex = customers[customerIndex].values.findIndex(v => v.id === valueId);
    if (valueIndex === -1) {
        console.error('Value not found:', valueId);
        return;
    }
    
    // Update value
    customers[customerIndex].values[valueIndex] = {
        ...customers[customerIndex].values[valueIndex],
        name,
        description
    };
    
    console.log('Value updated:', customers[customerIndex].values[valueIndex]);
    
    // Update current values
    currentCustomerValues = customers[customerIndex].values;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayValues();
            
            // Show notification
            showNotification('Value updated successfully');
        })
        .catch(error => {
            console.error('Error saving value:', error);
            showNotification('Error updating value. Please try again.');
        });
}

/**
 * Delete a value
 * @param {string} valueId - The ID of the value to delete
 */
function deleteValue(valueId) {
    console.log('Deleting value:', valueId);
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this value?')) {
        console.log('Value deletion cancelled');
        return;
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Remove value
    customers[customerIndex].values = customers[customerIndex].values.filter(v => v.id !== valueId);
    console.log('Value deleted, remaining values:', customers[customerIndex].values.length);
    
    // Update current values
    currentCustomerValues = customers[customerIndex].values;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Update display
            displayValues();
            
            // Show notification
            showNotification('Value deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting value:', error);
            showNotification('Error deleting value. Please try again.');
        });
}

/**
 * Show the add question modal
 */
function showAddQuestionModal() {
    console.log('Showing add question modal');
    
    const addQuestionModal = document.getElementById('add-question-modal');
    if (!addQuestionModal) {
        console.error('Add question modal not found');
        return;
    }
    
    // Clear form
    const questionTextInput = document.getElementById('question-text');
    const questionValueSelect = document.getElementById('question-value');
    
    if (questionTextInput) questionTextInput.value = '';
    
    // Populate value select
    if (questionValueSelect) {
        questionValueSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a value';
        questionValueSelect.appendChild(defaultOption);
        
        // Add value options
        currentCustomerValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value.id;
            option.textContent = value.name;
            questionValueSelect.appendChild(option);
        });
    }
    
    // Show modal
    addQuestionModal.classList.remove('hidden');
    console.log('Add question modal shown');
}

/**
 * Save a new question
 */
function saveNewQuestion() {
    console.log('Saving new question...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Get form values
    const questionTextInput = document.getElementById('question-text');
    const questionValueSelect = document.getElementById('question-value');
    
    if (!questionTextInput || !questionValueSelect) {
        console.error('Form inputs not found');
        return;
    }
    
    const text = questionTextInput.value.trim();
    const valueId = questionValueSelect.value;
    
    // Validate inputs
    if (!text || !valueId) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Create new question
    const newQuestion = {
        id: Date.now().toString(),
        text,
        valueId
    };
    
    console.log('New question created:', newQuestion);
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Ensure questions array exists
    if (!customers[customerIndex].questions) {
        customers[customerIndex].questions = [];
    }
    
    // Add to questions array
    customers[customerIndex].questions.push(newQuestion);
    console.log('Question added to customer, total questions:', customers[customerIndex].questions.length);
    
    // Update current questions
    currentCustomerQuestions = customers[customerIndex].questions;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayQuestions();
            
            // Show notification
            showNotification('Question added successfully');
        })
        .catch(error => {
            console.error('Error saving question:', error);
            showNotification('Error adding question. Please try again.');
        });
}

/**
 * Show the edit question modal
 * @param {string} questionId - The ID of the question to edit
 */
function showEditQuestionModal(questionId) {
    console.log('Showing edit question modal for question ID:', questionId);
    
    const editQuestionModal = document.getElementById('edit-question-modal');
    if (!editQuestionModal) {
        console.error('Edit question modal not found');
        return;
    }
    
    // Find question
    const question = currentCustomerQuestions.find(q => q.id === questionId);
    if (!question) {
        console.error('Question not found:', questionId);
        return;
    }
    
    // Set question ID in data attribute
    editQuestionModal.setAttribute('data-question-id', questionId);
    
    // Fill form fields
    const questionTextInput = document.getElementById('edit-question-text');
    const questionValueSelect = document.getElementById('edit-question-value');
    
    if (questionTextInput) questionTextInput.value = question.text;
    
    // Populate value select
    if (questionValueSelect) {
        questionValueSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a value';
        questionValueSelect.appendChild(defaultOption);
        
        // Add value options
        currentCustomerValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value.id;
            option.textContent = value.name;
            
            // Select the current value
            if (value.id === question.valueId) {
                option.selected = true;
            }
            
            questionValueSelect.appendChild(option);
        });
    }
    
    // Show modal
    editQuestionModal.classList.remove('hidden');
    console.log('Edit question modal shown');
}

/**
 * Save the edited question
 */
function saveEditedQuestion() {
    console.log('Saving edited question...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    const editQuestionModal = document.getElementById('edit-question-modal');
    if (!editQuestionModal) {
        console.error('Edit question modal not found');
        return;
    }
    
    // Get question ID from data attribute
    const questionId = editQuestionModal.getAttribute('data-question-id');
    if (!questionId) {
        console.error('No question ID set');
        return;
    }
    
    // Get form values
    const questionTextInput = document.getElementById('edit-question-text');
    const questionValueSelect = document.getElementById('edit-question-value');
    
    if (!questionTextInput || !questionValueSelect) {
        console.error('Form inputs not found');
        return;
    }
    
    const text = questionTextInput.value.trim();
    const valueId = questionValueSelect.value;
    
    // Validate inputs
    if (!text || !valueId) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Find question
    const questionIndex = customers[customerIndex].questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
        console.error('Question not found:', questionId);
        return;
    }
    
    // Update question
    customers[customerIndex].questions[questionIndex] = {
        ...customers[customerIndex].questions[questionIndex],
        text,
        valueId
    };
    
    console.log('Question updated:', customers[customerIndex].questions[questionIndex]);
    
    // Update current questions
    currentCustomerQuestions = customers[customerIndex].questions;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayQuestions();
            
            // Show notification
            showNotification('Question updated successfully');
        })
        .catch(error => {
            console.error('Error saving question:', error);
            showNotification('Error updating question. Please try again.');
        });
}

/**
 * Delete a question
 * @param {string} questionId - The ID of the question to delete
 */
function deleteQuestion(questionId) {
    console.log('Deleting question:', questionId);
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this question?')) {
        console.log('Question deletion cancelled');
        return;
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Remove question
    customers[customerIndex].questions = customers[customerIndex].questions.filter(q => q.id !== questionId);
    console.log('Question deleted, remaining questions:', customers[customerIndex].questions.length);
    
    // Update current questions
    currentCustomerQuestions = customers[customerIndex].questions;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Update display
            displayQuestions();
            
            // Show notification
            showNotification('Question deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting question:', error);
            showNotification('Error deleting question. Please try again.');
        });
}

/**
 * Show the add admin modal
 */
function showAddAdminModal() {
    console.log('Showing add admin modal');
    
    const addAdminModal = document.getElementById('add-admin-modal');
    if (!addAdminModal) {
        console.error('Add admin modal not found');
        return;
    }
    
    // Clear form
    const adminNameInput = document.getElementById('admin-name');
    const adminEmailInput = document.getElementById('admin-email');
    
    if (adminNameInput) adminNameInput.value = '';
    if (adminEmailInput) adminEmailInput.value = '';
    
    // Show modal
    addAdminModal.classList.remove('hidden');
    console.log('Add admin modal shown');
}

/**
 * Save a new admin
 */
function saveNewAdmin() {
    console.log('Saving new admin...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Get form values
    const adminNameInput = document.getElementById('admin-name');
    const adminEmailInput = document.getElementById('admin-email');
    
    if (!adminNameInput || !adminEmailInput) {
        console.error('Form inputs not found');
        return;
    }
    
    const name = adminNameInput.value.trim();
    const email = adminEmailInput.value.trim();
    
    // Validate inputs
    if (!name || !email) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        console.error('Invalid email format');
        return;
    }
    
    // Create new admin
    const newAdmin = {
        id: Date.now().toString(),
        name,
        email
    };
    
    console.log('New admin created:', newAdmin);
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Ensure admins array exists
    if (!customers[customerIndex].admins) {
        customers[customerIndex].admins = [];
    }
    
    // Add to admins array
    customers[customerIndex].admins.push(newAdmin);
    console.log('Admin added to customer, total admins:', customers[customerIndex].admins.length);
    
    // Update current admins
    currentCustomerAdmins = customers[customerIndex].admins;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayAdmins();
            
            // Show notification
            showNotification('Admin added successfully');
        })
        .catch(error => {
            console.error('Error saving admin:', error);
            showNotification('Error adding admin. Please try again.');
        });
}

/**
 * Show the edit admin modal
 * @param {string} adminId - The ID of the admin to edit
 */
function showEditAdminModal(adminId) {
    console.log('Showing edit admin modal for admin ID:', adminId);
    
    const editAdminModal = document.getElementById('edit-admin-modal');
    if (!editAdminModal) {
        console.error('Edit admin modal not found');
        return;
    }
    
    // Find admin
    const admin = currentCustomerAdmins.find(a => a.id === adminId);
    if (!admin) {
        console.error('Admin not found:', adminId);
        return;
    }
    
    // Set admin ID in data attribute
    editAdminModal.setAttribute('data-admin-id', adminId);
    
    // Fill form fields
    const adminNameInput = document.getElementById('edit-admin-name');
    const adminEmailInput = document.getElementById('edit-admin-email');
    
    if (adminNameInput) adminNameInput.value = admin.name;
    if (adminEmailInput) adminEmailInput.value = admin.email;
    
    // Show modal
    editAdminModal.classList.remove('hidden');
    console.log('Edit admin modal shown');
}

/**
 * Save the edited admin
 */
function saveEditedAdmin() {
    console.log('Saving edited admin...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    const editAdminModal = document.getElementById('edit-admin-modal');
    if (!editAdminModal) {
        console.error('Edit admin modal not found');
        return;
    }
    
    // Get admin ID from data attribute
    const adminId = editAdminModal.getAttribute('data-admin-id');
    if (!adminId) {
        console.error('No admin ID set');
        return;
    }
    
    // Get form values
    const adminNameInput = document.getElementById('edit-admin-name');
    const adminEmailInput = document.getElementById('edit-admin-email');
    
    if (!adminNameInput || !adminEmailInput) {
        console.error('Form inputs not found');
        return;
    }
    
    const name = adminNameInput.value.trim();
    const email = adminEmailInput.value.trim();
    
    // Validate inputs
    if (!name || !email) {
        alert('Please fill in all fields');
        console.error('Missing required fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        console.error('Invalid email format');
        return;
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Find admin
    const adminIndex = customers[customerIndex].admins.findIndex(a => a.id === adminId);
    if (adminIndex === -1) {
        console.error('Admin not found:', adminId);
        return;
    }
    
    // Update admin
    customers[customerIndex].admins[adminIndex] = {
        ...customers[customerIndex].admins[adminIndex],
        name,
        email
    };
    
    console.log('Admin updated:', customers[customerIndex].admins[adminIndex]);
    
    // Update current admins
    currentCustomerAdmins = customers[customerIndex].admins;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayAdmins();
            
            // Show notification
            showNotification('Admin updated successfully');
        })
        .catch(error => {
            console.error('Error saving admin:', error);
            showNotification('Error updating admin. Please try again.');
        });
}

/**
 * Delete an admin
 * @param {string} adminId - The ID of the admin to delete
 */
function deleteAdmin(adminId) {
    console.log('Deleting admin:', adminId);
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this admin?')) {
        console.log('Admin deletion cancelled');
        return;
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Remove admin
    customers[customerIndex].admins = customers[customerIndex].admins.filter(a => a.id !== adminId);
    console.log('Admin deleted, remaining admins:', customers[customerIndex].admins.length);
    
    // Update current admins
    currentCustomerAdmins = customers[customerIndex].admins;
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Update display
            displayAdmins();
            
            // Show notification
            showNotification('Admin deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting admin:', error);
            showNotification('Error deleting admin. Please try again.');
        });
}

/**
 * Preview the logo from file input
 */
function previewLogo() {
    console.log('Previewing logo from file input');
    
    const logoFileInput = document.getElementById('logo-file');
    if (!logoFileInput || !logoFileInput.files || logoFileInput.files.length === 0) {
        console.error('No file selected');
        return;
    }
    
    const file = logoFileInput.files[0];
    console.log('File selected:', file.name, file.type, file.size);
    
    // Check file type
    if (!file.type.match('image.*')) {
        alert('Please select an image file');
        console.error('Invalid file type');
        return;
    }
    
    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
        alert('File size must be less than 1MB');
        console.error('File too large');
        return;
    }
    
    // Create file reader
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('logo-preview-img');
        if (previewImg) {
            previewImg.src = e.target.result;
        }
        
        // Clear URL input
        const logoUrlInput = document.getElementById('logo-url');
        if (logoUrlInput) {
            logoUrlInput.value = '';
        }
    };
    
    // Read file as data URL
    reader.readAsDataURL(file);
    console.log('File reader started');
}

/**
 * Save the logo
 */
function saveLogo() {
    console.log('Saving logo...');
    
    if (!currentCustomerId) {
        console.error('No customer ID set');
        return;
    }
    
    // Get logo URL or file
    const logoUrlInput = document.getElementById('logo-url');
    const logoFileInput = document.getElementById('logo-file');
    const logoPreviewImg = document.getElementById('logo-preview-img');
    
    let logoUrl = '';
    
    // Check if URL is provided
    if (logoUrlInput && logoUrlInput.value.trim()) {
        logoUrl = logoUrlInput.value.trim();
        console.log('Using logo URL:', logoUrl);
    }
    // Check if file is provided
    else if (logoPreviewImg && logoPreviewImg.src && logoPreviewImg.src !== 'data:,') {
        logoUrl = logoPreviewImg.src;
        console.log('Using logo from file upload');
    }
    
    // Find customer
    const customerIndex = customers.findIndex(c => c.id === currentCustomerId);
    if (customerIndex === -1) {
        console.error('Customer not found:', currentCustomerId);
        return;
    }
    
    // Update customer logo
    customers[customerIndex].logo = logoUrl;
    console.log('Customer logo updated');
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayCustomers();
            
            // Show notification
            showNotification('Logo updated successfully');
        })
        .catch(error => {
            console.error('Error saving logo:', error);
            showNotification('Error updating logo. Please try again.');
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
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayCustomers();
            
            // Show notification
            showNotification('Customer updated successfully');
        })
        .catch(error => {
            console.error('Error saving customer:', error);
            showNotification('Error updating customer. Please try again.');
        });
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
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
            // Close modal
            closeAllModals();
            
            // Update display
            displayCustomers();
            
            // Show notification
            showNotification('Customer deleted successfully');
            
            // Clear current customer ID
            currentCustomerId = null;
        })
        .catch(error => {
            console.error('Error deleting customer:', error);
            showNotification('Error deleting customer. Please try again.');
        });
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
        email,
        logo: '',
        values: [],
        questions: [],
        admins: []
    };
    
    console.log('New customer created:', newCustomer);
    
    // Add to customers array
    customers.push(newCustomer);
    console.log('Customer added to array, total customers:', customers.length);
    
    // Save to GitHub
    saveCustomersToGitHub()
        .then(() => {
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
        })
        .catch(error => {
            console.error('Error saving new customer:', error);
            showNotification('Error adding customer. Please try again.');
        });
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
