/**
 * ValuesAlign - Customer Admin Dashboard
 * 
 * This script handles the functionality for the customer-specific admin dashboard,
 * including values management, employee management, and survey creation.
 * 
 * Version: v1.9.8
 */

// Global variables
let githubAPI = null;
let customerId = null;
let companyName = '';
let valuesData = [];
let questionsData = [];
let employeesData = [];
let surveysData = [];
let currentValueId = null;
let currentEmployeeId = null;
let currentSurveyId = null;
let currentQuestionId = null;

// DOM elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const valuesContainer = document.getElementById('values-container');
const employeesContainer = document.getElementById('employees-container');
const surveysContainer = document.getElementById('surveys-container');
const resultsContainer = document.getElementById('results-container');

// Set version in footer
document.getElementById('app-version').textContent = config.version;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', initializeDashboard);

/**
 * Initialize the dashboard
 */
function initializeDashboard() {
    console.log('Initializing customer admin dashboard...');
    
    // Get customer ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    customerId = urlParams.get('id');
    
    if (!customerId) {
        showError('Customer ID not found in URL. Please access this page from the master admin dashboard.');
        return;
    }
    
    // Set company name if available in localStorage
    companyName = localStorage.getItem('current_customer_name') || 'Your Company';
    document.getElementById('company-name').textContent = companyName;
    
    // Check if user is already logged in
    checkLoginStatus();
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Check if the user is already logged in
 */
function checkLoginStatus() {
    const token = localStorage.getItem('github_token');
    const email = localStorage.getItem('customer_admin_email');
    
    if (token && email) {
        // Auto-login with stored credentials
        loginWithStoredCredentials(email, token);
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
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Value management buttons
    const addValueBtn = document.getElementById('add-value-btn');
    if (addValueBtn) {
        addValueBtn.addEventListener('click', showAddValueModal);
    }
    
    // Employee management buttons
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', showAddEmployeeModal);
    }
    
    // Survey management buttons
    const createSurveyBtn = document.getElementById('create-survey-btn');
    if (createSurveyBtn) {
        createSurveyBtn.addEventListener('click', showCreateSurveyModal);
    }
    
    // Modal save buttons
    const saveValueBtn = document.getElementById('save-value-btn');
    if (saveValueBtn) {
        saveValueBtn.addEventListener('click', saveValue);
    }
    
    const saveEmployeeBtn = document.getElementById('save-employee-btn');
    if (saveEmployeeBtn) {
        saveEmployeeBtn.addEventListener('click', saveEmployee);
    }
    
    const sendSurveyBtn = document.getElementById('send-survey-btn');
    if (sendSurveyBtn) {
        sendSurveyBtn.addEventListener('click', createAndSendSurvey);
    }
    
    const saveQuestionBtn = document.getElementById('save-question-btn');
    if (saveQuestionBtn) {
        saveQuestionBtn.addEventListener('click', saveQuestion);
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
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const token = document.getElementById('github-token').value.trim();
    
    if (!email || !password || !token) {
        showError('Please enter your email, password, and GitHub token.');
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
        const isValid = await githubAPI.testAccess();
        
        if (isValid) {
            // Verify customer admin credentials
            const isAuthorized = await verifyCustomerAdmin(email, password);
            
            if (isAuthorized) {
                // Save credentials to localStorage
                localStorage.setItem('github_token', token);
                localStorage.setItem('customer_admin_email', email);
                
                // Show dashboard
                showDashboard(email);
                
                // Load data
                loadAllData();
            } else {
                showError('Invalid email or password.');
            }
        } else {
            showError('Invalid GitHub token or repository access.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Error connecting to GitHub: ' + error.message);
    }
}

/**
 * Verify customer admin credentials
 * @param {string} email - The admin email
 * @param {string} password - The admin password
 * @returns {Promise<boolean>} - Promise resolving to true if authorized, false otherwise
 */
async function verifyCustomerAdmin(email, password) {
    try {
        // Get customers data from GitHub
        const customersResponse = await githubAPI.getFileContent('data/customers.json');
        const customers = JSON.parse(atob(customersResponse.content));
        
        // Find customer by ID
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) {
            console.error('Customer not found:', customerId);
            return false;
        }
        
        // Verify admin credentials
        if (customer.adminEmail === email && customer.adminPassword === password) {
            // Store company name
            companyName = customer.name;
            document.getElementById('company-name').textContent = companyName;
            localStorage.setItem('current_customer_name', companyName);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error verifying customer admin:', error);
        return false;
    }
}

/**
 * Login with stored credentials
 * @param {string} email - The admin email
 * @param {string} token - The GitHub token
 */
async function loginWithStoredCredentials(email, token) {
    // Initialize GitHub API
    githubAPI = new GitHubAPI({
        token: token,
        owner: config.github.owner,
        repo: config.github.repo,
        branch: config.github.branch
    });
    
    // Test GitHub API connection
    try {
        const isValid = await githubAPI.testAccess();
        
        if (isValid) {
            // Show dashboard
            showDashboard(email);
            
            // Load data
            loadAllData();
        } else {
            // Invalid token, clear localStorage
            localStorage.removeItem('github_token');
            localStorage.removeItem('customer_admin_email');
            
            showError('Stored GitHub token is invalid. Please log in again.');
        }
    } catch (error) {
        console.error('Auto-login error:', error);
        
        // Clear localStorage
        localStorage.removeItem('github_token');
        localStorage.removeItem('customer_admin_email');
        
        showError('Error connecting to GitHub: ' + error.message);
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    // Clear localStorage
    localStorage.removeItem('github_token');
    localStorage.removeItem('customer_admin_email');
    
    // Reset GitHub API
    githubAPI = null;
    
    // Show login section
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    
    // Clear form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('github-token').value = '';
    
    // Update user display
    document.getElementById('user-display').textContent = 'Not logged in';
}

/**
 * Show the dashboard
 * @param {string} email - The admin email to display
 */
function showDashboard(email) {
    // Hide login section
    loginSection.classList.add('hidden');
    
    // Show dashboard section
    dashboardSection.classList.remove('hidden');
    
    // Update user display
    document.getElementById('user-display').textContent = email;
}

/**
 * Switch between tabs
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
    // Hide all tabs
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Activate selected tab button
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
}

/**
 * Load all data for the dashboard
 */
async function loadAllData() {
    // Load values, questions, employees, and surveys in parallel
    await Promise.all([
        loadValuesData(),
        loadQuestionsData(),
        loadEmployeesData(),
        loadSurveysData()
    ]);
}

/**
 * Load values data from GitHub
 */
async function loadValuesData() {
    console.log('Loading values data...');
    console.log('Customer ID:', customerId);
    
    // Show loading indicator
    valuesContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading values...</p>
        </div>
    `;
    
    try {
        // Get values data from GitHub
        const valuesPath = `data/customers/${customerId}/values.json`;
        console.log('Attempting to load values from path:', valuesPath);
        
        const valuesResponse = await githubAPI.getFileContent(valuesPath);
        console.log('Values response received:', valuesResponse);
        
        valuesData = JSON.parse(atob(valuesResponse.content));
        console.log('Parsed values data:', valuesData);
        
        // Display values
        displayValues(valuesData);
    } catch (error) {
        console.error('Error loading values data:', error);
        valuesContainer.innerHTML = `<p class="error-message">Error loading values: ${error.message}</p>`;
    }
}

/**
 * Load questions data from GitHub
 */
async function loadQuestionsData() {
    console.log('Loading questions data...');
    
    try {
        // Get questions data from GitHub
        const questionsResponse = await githubAPI.getFileContent(`data/customers/${customerId}/questions.json`);
        questionsData = JSON.parse(atob(questionsResponse.content));
        
        return questionsData;
    } catch (error) {
        console.error('Error loading questions data:', error);
        return [];
    }
}

/**
 * Load employees data from GitHub
 */
async function loadEmployeesData() {
    console.log('Loading employees data...');
    
    // Show loading indicator
    employeesContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading employees...</p>
        </div>
    `;
    
    try {
        // Get employees data from GitHub
        const employeesResponse = await githubAPI.getFileContent(`data/customers/${customerId}/employees.json`);
        employeesData = JSON.parse(atob(employeesResponse.content));
        
        // Display employees
        displayEmployees(employeesData);
    } catch (error) {
        console.error('Error loading employees data:', error);
        employeesContainer.innerHTML = `<p class="error-message">Error loading employees: ${error.message}</p>`;
    }
}

/**
 * Load surveys data from GitHub
 */
async function loadSurveysData() {
    console.log('Loading surveys data...');
    
    // Show loading indicator
    surveysContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading surveys...</p>
        </div>
    `;
    
    try {
        // Get surveys data from GitHub
        const surveysResponse = await githubAPI.getFileContent(`data/customers/${customerId}/surveys.json`);
        surveysData = JSON.parse(atob(surveysResponse.content));
        
        // Display surveys
        displaySurveys(surveysData);
    } catch (error) {
        console.error('Error loading surveys data:', error);
        surveysContainer.innerHTML = `<p class="error-message">Error loading surveys: ${error.message}</p>`;
    }
}

/**
 * Display values in the UI
 * @param {Array} values - Array of value objects
 */
function displayValues(values) {
    if (!values || values.length === 0) {
        valuesContainer.innerHTML = '<p>No values found. Add your first value using the button above.</p>';
        return;
    }
    
    // Clear container
    valuesContainer.innerHTML = '';
    
    // Create value cards
    values.forEach((value, index) => {
        // Count questions for this value
        const questionCount = questionsData ? questionsData.filter(q => q.valueId === value.id).length : 0;
        
        // Create value card
        const valueCard = document.createElement('div');
        valueCard.className = 'value-card';
        valueCard.innerHTML = `
            <div class="value-header">
                <h3>${value.name}</h3>
                <div class="value-actions">
                    <button class="btn small-btn edit-value-btn" data-value-id="${value.id}">Edit</button>
                    <button class="btn small-btn toggle-value-btn" data-value-id="${value.id}" data-enabled="${value.enabled}">
                        ${value.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn small-btn view-questions-btn" data-value-id="${value.id}">
                        Questions (${questionCount})
                    </button>
                </div>
            </div>
            <p class="value-description">${value.description}</p>
            <div class="value-status ${value.enabled ? 'status-enabled' : 'status-disabled'}">
                ${value.enabled ? 'Enabled' : 'Disabled'}
            </div>
        `;
        
        // Add event listeners
        const editBtn = valueCard.querySelector('.edit-value-btn');
        const toggleBtn = valueCard.querySelector('.toggle-value-btn');
        const questionsBtn = valueCard.querySelector('.view-questions-btn');
        
        editBtn.addEventListener('click', () => showEditValueModal(value.id));
        toggleBtn.addEventListener('click', () => toggleValueStatus(value.id, value.enabled));
        questionsBtn.addEventListener('click', () => showQuestionsModal(value.id));
        
        // Append to container
        valuesContainer.appendChild(valueCard);
    });
}

/**
 * Display employees in the UI
 * @param {Array} employees - Array of employee objects
 */
function displayEmployees(employees) {
    if (!employees || employees.length === 0) {
        employeesContainer.innerHTML = '<p>No employees found. Add your first employee using the button above.</p>';
        return;
    }
    
    // Clear container
    employeesContainer.innerHTML = '';
    
    // Create employee cards
    employees.forEach(employee => {
        const employeeCard = document.createElement('div');
        employeeCard.className = 'employee-card';
        employeeCard.innerHTML = `
            <div class="employee-name">${employee.name}</div>
            <div class="employee-email">${employee.email}</div>
            <div class="employee-position">${employee.position || 'No position specified'}</div>
            <div class="employee-actions">
                <button class="btn small-btn edit-employee-btn" data-employee-id="${employee.id}">Edit</button>
                <button class="btn small-btn delete-employee-btn" data-employee-id="${employee.id}">Delete</button>
                <button class="btn small-btn send-survey-btn" data-employee-id="${employee.id}">Send Survey</button>
            </div>
        `;
        
        // Add event listeners
        const editBtn = employeeCard.querySelector('.edit-employee-btn');
        const deleteBtn = employeeCard.querySelector('.delete-employee-btn');
        const sendSurveyBtn = employeeCard.querySelector('.send-survey-btn');
        
        editBtn.addEventListener('click', () => showEditEmployeeModal(employee.id));
        deleteBtn.addEventListener('click', () => confirmDeleteEmployee(employee.id));
        sendSurveyBtn.addEventListener('click', () => showCreateSurveyModal(employee.id));
        
        // Append to container
        employeesContainer.appendChild(employeeCard);
    });
}

/**
 * Display surveys in the UI
 * @param {Array} surveys - Array of survey objects
 */
function displaySurveys(surveys) {
    if (!surveys || surveys.length === 0) {
        surveysContainer.innerHTML = '<p>No surveys found. Create your first survey using the button above.</p>';
        return;
    }
    
    // Clear container
    surveysContainer.innerHTML = '';
    
    // Create survey cards
    surveys.forEach(survey => {
        // Find recipient
        const recipient = employeesData.find(e => e.id === survey.recipientId);
        const recipientName = recipient ? recipient.name : 'Unknown';
        const recipientEmail = recipient ? recipient.email : 'Unknown';
        
        // Format date
        const createdDate = new Date(survey.createdAt).toLocaleDateString();
        const expiryDate = new Date(survey.expiryDate).toLocaleDateString();
        
        // Determine status
        let status = 'Sent';
        let statusClass = 'status-sent';
        
        if (survey.completed) {
            status = 'Completed';
            statusClass = 'status-completed';
        } else if (new Date(survey.expiryDate) < new Date()) {
            status = 'Expired';
            statusClass = 'status-expired';
        }
        
        // Create survey card
        const surveyCard = document.createElement('div');
        surveyCard.className = 'survey-card';
        surveyCard.innerHTML = `
            <div class="survey-title">${survey.title}</div>
            <div class="survey-date">Created: ${createdDate} | Expires: ${expiryDate}</div>
            <div class="survey-status ${statusClass}">${status}</div>
            <div class="survey-recipient">
                <strong>Recipient:</strong> ${recipientName} (${recipientEmail})
            </div>
            <div class="survey-type">
                <strong>Type:</strong> ${survey.type === 'employee' ? 'Employee Survey' : 'Candidate Survey'}
            </div>
            <div class="survey-actions">
                <button class="btn small-btn view-results-btn" data-survey-id="${survey.id}" ${survey.completed ? '' : 'disabled'}>
                    View Results
                </button>
                <button class="btn small-btn resend-survey-btn" data-survey-id="${survey.id}" ${survey.completed ? 'disabled' : ''}>
                    Resend
                </button>
                <button class="btn small-btn delete-survey-btn" data-survey-id="${survey.id}">
                    Delete
                </button>
            </div>
        `;
        
        // Add event listeners
        const viewResultsBtn = surveyCard.querySelector('.view-results-btn');
        const resendSurveyBtn = surveyCard.querySelector('.resend-survey-btn');
        const deleteSurveyBtn = surveyCard.querySelector('.delete-survey-btn');
        
        if (survey.completed) {
            viewResultsBtn.addEventListener('click', () => showSurveyResults(survey.id));
        }
        
        if (!survey.completed) {
            resendSurveyBtn.addEventListener('click', () => resendSurvey(survey.id));
        }
        
        deleteSurveyBtn.addEventListener('click', () => confirmDeleteSurvey(survey.id));
        
        // Append to container
        surveysContainer.appendChild(surveyCard);
    });
}

/**
 * Show modal for adding a new value
 */
function showAddValueModal() {
    // Reset form
    document.getElementById('value-name').value = '';
    document.getElementById('value-description').value = '';
    document.getElementById('value-enabled').checked = true;
    
    // Set modal title
    document.getElementById('value-modal-title').textContent = 'Add New Value';
    
    // Show modal
    document.getElementById('edit-value-modal').style.display = 'block';
}

/**
 * Show modal for editing a value
 * @param {number} valueId - The ID of the value to edit
 */
function showEditValueModal(valueId) {
    // Find value
    const value = valuesData.find(v => v.id === valueId);
    
    if (!value) {
        showError('Value not found.');
        return;
    }
    
    // Set current value ID
    currentValueId = valueId;
    
    // Set form values
    document.getElementById('value-name').value = value.name;
    document.getElementById('value-description').value = value.description;
    document.getElementById('value-enabled').checked = value.enabled;
    
    // Set modal title
    document.getElementById('value-modal-title').textContent = 'Edit Value';
    
    // Show modal
    document.getElementById('edit-value-modal').style.display = 'block';
}

/**
 * Save a new or edited value
 */
async function saveValue() {
    const name = document.getElementById('value-name').value.trim();
    const description = document.getElementById('value-description').value.trim();
    const enabled = document.getElementById('value-enabled').checked;
    
    if (!name) {
        showError('Please enter a value name.');
        return;
    }
    
    try {
        if (currentValueId) {
            // Update existing value
            const valueIndex = valuesData.findIndex(v => v.id === currentValueId);
            
            if (valueIndex === -1) {
                showError('Value not found.');
                return;
            }
            
            // Update value
            valuesData[valueIndex].name = name;
            valuesData[valueIndex].description = description;
            valuesData[valueIndex].enabled = enabled;
        } else {
            // Create new value
            const newValueId = valuesData.length > 0 ? Math.max(...valuesData.map(v => v.id)) + 1 : 1;
            
            // Add to values array
            valuesData.push({
                id: newValueId,
                name: name,
                description: description,
                enabled: enabled
            });
        }
        
        // Save to GitHub
        await saveValuesData();
        
        // Close modal
        closeAllModals();
        
        // Refresh display
        displayValues(valuesData);
        
        showSuccess(currentValueId ? 'Value updated successfully.' : 'Value added successfully.');
    } catch (error) {
        console.error('Error saving value:', error);
        showError('Error saving value: ' + error.message);
    }
}

/**
 * Toggle a value's enabled status
 * @param {number} valueId - The ID of the value to toggle
 * @param {boolean} currentStatus - The current enabled status
 */
async function toggleValueStatus(valueId, currentStatus) {
    try {
        // Find value
        const valueIndex = valuesData.findIndex(v => v.id === valueId);
        
        if (valueIndex === -1) {
            showError('Value not found.');
            return;
        }
        
        // Toggle status
        valuesData[valueIndex].enabled = !currentStatus;
        
        // Save to GitHub
        await saveValuesData();
        
        // Refresh display
        displayValues(valuesData);
        
        showSuccess(`Value ${valuesData[valueIndex].enabled ? 'enabled' : 'disabled'} successfully.`);
    } catch (error) {
        console.error('Error toggling value status:', error);
        showError('Error toggling value status: ' + error.message);
    }
}

/**
 * Save values data to GitHub
 */
async function saveValuesData() {
    try {
        // Update file
        await githubAPI.updateFile(
            `data/customers/${customerId}/values.json`,
            JSON.stringify(valuesData, null, 2)
        );
        
        return true;
    } catch (error) {
        console.error('Error saving values data:', error);
        throw error;
    }
}

/**
 * Show modal for viewing and editing questions for a value
 * @param {number} valueId - The ID of the value to show questions for
 */
function showQuestionsModal(valueId) {
    // Find value
    const value = valuesData.find(v => v.id === valueId);
    
    if (!value) {
        showError('Value not found.');
        return;
    }
    
    // Set current value ID
    currentValueId = valueId;
    
    // Set value name in modal
    document.getElementById('value-name-display').textContent = value.name;
    
    // Get questions container
    const questionsContainer = document.getElementById('questions-container');
    
    // Show loading indicator
    questionsContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading questions...</p>
        </div>
    `;
    
    // Filter questions for this value
    const valueQuestions = questionsData.filter(q => q.valueId === valueId);
    
    // Display questions
    if (valueQuestions && valueQuestions.length > 0) {
        // Clear container
        questionsContainer.innerHTML = '';
        
        // Create question items
        valueQuestions.forEach(question => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = `
                <div class="question-header">
                    <span class="accordion-toggle">▼</span>
                    <span class="question-text">${question.text}</span>
                    <button class="btn small-btn edit-question-btn" data-question-id="${question.id}">Edit</button>
                </div>
                <div class="question-content" style="display: none;">
                    <h4>Options:</h4>
                    <ul class="options-list">
                        ${question.options.map(option => `
                            <li>
                                <strong>Option ${option.id}:</strong> ${option.text}
                                <span class="option-score">(Score: ${option.score})</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            
            // Add event listeners
            const header = questionDiv.querySelector('.question-header');
            const content = questionDiv.querySelector('.question-content');
            const toggle = questionDiv.querySelector('.accordion-toggle');
            
            header.addEventListener('click', function(e) {
                // Don't toggle if edit button was clicked
                if (e.target.classList.contains('edit-question-btn')) {
                    return;
                }
                
                // Toggle content visibility
                if (content.style.display === 'block') {
                    content.style.display = 'none';
                    toggle.textContent = '▼';
                } else {
                    content.style.display = 'block';
                    toggle.textContent = '▲';
                }
            });
            
            // Add event listener to edit button
            const editBtn = questionDiv.querySelector('.edit-question-btn');
            editBtn.addEventListener('click', function() {
                showEditQuestionModal(question.id);
            });
            
            // Append to container
            questionsContainer.appendChild(questionDiv);
        });
    } else {
        questionsContainer.innerHTML = '<p>No questions found for this value. Add your first question using the button below.</p>';
    }
    
    // Add event listener to add question button
    const addQuestionBtn = document.getElementById('add-question-btn');
    addQuestionBtn.onclick = () => showAddQuestionModal(valueId);
    
    // Show modal
    document.getElementById('edit-questions-modal').style.display = 'block';
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
 * Close all modals
 */
function closeAllModals() {
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    // Hide all modals
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset current IDs
    currentValueId = null;
    currentEmployeeId = null;
    currentSurveyId = null;
    currentQuestionId = null;
}

/**
 * Show modal for adding a new question
 * @param {number} valueId - The ID of the value to add a question for
 */
function showAddQuestionModal(valueId) {
    // Reset form
    document.getElementById('question-text').value = '';
    
    // Set current value ID
    currentValueId = valueId;
    currentQuestionId = null;
    
    // Set modal title
    document.getElementById('question-modal-title').textContent = 'Add New Question';
    
    // Create default options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = `
        <h4>Options:</h4>
        <div class="form-group">
            <label for="option-1-text">Option 1:</label>
            <input type="text" id="option-1-text" placeholder="Enter option text">
            <label for="option-1-score">Score:</label>
            <input type="number" id="option-1-score" min="0" max="10" value="0">
        </div>
        <div class="form-group">
            <label for="option-2-text">Option 2:</label>
            <input type="text" id="option-2-text" placeholder="Enter option text">
            <label for="option-2-score">Score:</label>
            <input type="number" id="option-2-score" min="0" max="10" value="0">
        </div>
        <div class="form-group">
            <label for="option-3-text">Option 3:</label>
            <input type="text" id="option-3-text" placeholder="Enter option text">
            <label for="option-3-score">Score:</label>
            <input type="number" id="option-3-score" min="0" max="10" value="0">
        </div>
        <div class="form-group">
            <label for="option-4-text">Option 4:</label>
            <input type="text" id="option-4-text" placeholder="Enter option text">
            <label for="option-4-score">Score:</label>
            <input type="number" id="option-4-score" min="0" max="10" value="0">
        </div>
    `;
    
    // Show modal
    document.getElementById('edit-question-modal').style.display = 'block';
}

/**
 * Show modal for editing a question
 * @param {number} questionId - The ID of the question to edit
 */
function showEditQuestionModal(questionId) {
    // Find question
    const question = questionsData.find(q => q.id === questionId);
    
    if (!question) {
        showError('Question not found.');
        return;
    }
    
    // Set current question ID
    currentQuestionId = questionId;
    
    // Set form values
    document.getElementById('question-text').value = question.text;
    
    // Set options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = `<h4>Options:</h4>`;
    
    question.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'form-group';
        optionDiv.innerHTML = `
            <label for="option-${option.id}-text">Option ${option.id}:</label>
            <input type="text" id="option-${option.id}-text" placeholder="Enter option text" value="${option.text}">
            <label for="option-${option.id}-score">Score:</label>
            <input type="number" id="option-${option.id}-score" min="0" max="10" value="${option.score}">
        `;
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Set modal title
    document.getElementById('question-modal-title').textContent = 'Edit Question';
    
    // Show modal
    document.getElementById('edit-question-modal').style.display = 'block';
}

/**
 * Save a new or edited question
 */
async function saveQuestion() {
    const questionText = document.getElementById('question-text').value.trim();
    
    if (!questionText) {
        showError('Please enter a question text.');
        return;
    }
    
    // Get options
    const options = [];
    for (let i = 1; i <= 4; i++) {
        const optionText = document.getElementById(`option-${i}-text`);
        const optionScore = document.getElementById(`option-${i}-score`);
        
        if (optionText && optionScore) {
            const text = optionText.value.trim();
            const score = parseInt(optionScore.value, 10);
            
            if (text) {
                options.push({
                    id: i,
                    text: text,
                    score: score
                });
            }
        }
    }
    
    if (options.length < 2) {
        showError('Please enter at least two options.');
        return;
    }
    
    try {
        if (currentQuestionId) {
            // Update existing question
            const questionIndex = questionsData.findIndex(q => q.id === currentQuestionId);
            
            if (questionIndex === -1) {
                showError('Question not found.');
                return;
            }
            
            // Update question
            questionsData[questionIndex].text = questionText;
            questionsData[questionIndex].options = options;
        } else {
            // Create new question
            const newQuestionId = questionsData.length > 0 ? Math.max(...questionsData.map(q => q.id)) + 1 : 1;
            
            // Add to questions array
            questionsData.push({
                id: newQuestionId,
                valueId: currentValueId,
                text: questionText,
                options: options
            });
        }
        
        // Save to GitHub
        await saveQuestionsData();
        
        // Close modal
        closeAllModals();
        
        // Refresh display
        showQuestionsModal(currentValueId);
        
        showSuccess(currentQuestionId ? 'Question updated successfully.' : 'Question added successfully.');
    } catch (error) {
        console.error('Error saving question:', error);
        showError('Error saving question: ' + error.message);
    }
}

/**
 * Save questions data to GitHub
 */
async function saveQuestionsData() {
    try {
        // Update file
        await githubAPI.updateFile(
            `data/customers/${customerId}/questions.json`,
            JSON.stringify(questionsData, null, 2)
        );
        
        return true;
    } catch (error) {
        console.error('Error saving questions data:', error);
        throw error;
    }
}

/**
 * Show modal for adding a new employee
 */
function showAddEmployeeModal() {
    // Reset form
    document.getElementById('employee-name').value = '';
    document.getElementById('employee-email').value = '';
    document.getElementById('employee-position').value = '';
    
    // Set modal title
    document.getElementById('employee-modal-title').textContent = 'Add New Employee';
    
    // Reset current employee ID
    currentEmployeeId = null;
    
    // Show modal
    document.getElementById('edit-employee-modal').style.display = 'block';
}

/**
 * Show modal for editing an employee
 * @param {number} employeeId - The ID of the employee to edit
 */
function showEditEmployeeModal(employeeId) {
    // Find employee
    const employee = employeesData.find(e => e.id === employeeId);
    
    if (!employee) {
        showError('Employee not found.');
        return;
    }
    
    // Set current employee ID
    currentEmployeeId = employeeId;
    
    // Set form values
    document.getElementById('employee-name').value = employee.name;
    document.getElementById('employee-email').value = employee.email;
    document.getElementById('employee-position').value = employee.position || '';
    
    // Set modal title
    document.getElementById('employee-modal-title').textContent = 'Edit Employee';
    
    // Show modal
    document.getElementById('edit-employee-modal').style.display = 'block';
}

/**
 * Save a new or edited employee
 */
async function saveEmployee() {
    const name = document.getElementById('employee-name').value.trim();
    const email = document.getElementById('employee-email').value.trim();
    const position = document.getElementById('employee-position').value.trim();
    
    if (!name || !email) {
        showError('Please enter a name and email for the employee.');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    try {
        if (currentEmployeeId) {
            // Update existing employee
            const employeeIndex = employeesData.findIndex(e => e.id === currentEmployeeId);
            
            if (employeeIndex === -1) {
                showError('Employee not found.');
                return;
            }
            
            // Update employee
            employeesData[employeeIndex].name = name;
            employeesData[employeeIndex].email = email;
            employeesData[employeeIndex].position = position;
        } else {
            // Create new employee
            const newEmployeeId = employeesData.length > 0 ? Math.max(...employeesData.map(e => e.id)) + 1 : 1;
            
            // Add to employees array
            employeesData.push({
                id: newEmployeeId,
                name: name,
                email: email,
                position: position
            });
        }
        
        // Save to GitHub
        await saveEmployeesData();
        
        // Close modal
        closeAllModals();
        
        // Refresh display
        displayEmployees(employeesData);
        
        showSuccess(currentEmployeeId ? 'Employee updated successfully.' : 'Employee added successfully.');
    } catch (error) {
        console.error('Error saving employee:', error);
        showError('Error saving employee: ' + error.message);
    }
}

/**
 * Confirm deletion of an employee
 * @param {number} employeeId - The ID of the employee to delete
 */
function confirmDeleteEmployee(employeeId) {
    // Find employee
    const employee = employeesData.find(e => e.id === employeeId);
    
    if (!employee) {
        showError('Employee not found.');
        return;
    }
    
    // Confirm deletion
    if (confirm(`Are you sure you want to delete the employee "${employee.name}"?`)) {
        deleteEmployee(employeeId);
    }
}

/**
 * Delete an employee
 * @param {number} employeeId - The ID of the employee to delete
 */
async function deleteEmployee(employeeId) {
    try {
        // Find employee index
        const employeeIndex = employeesData.findIndex(e => e.id === employeeId);
        
        if (employeeIndex === -1) {
            showError('Employee not found.');
            return;
        }
        
        // Remove from array
        employeesData.splice(employeeIndex, 1);
        
        // Save to GitHub
        await saveEmployeesData();
        
        // Refresh display
        displayEmployees(employeesData);
        
        showSuccess('Employee deleted successfully.');
    } catch (error) {
        console.error('Error deleting employee:', error);
        showError('Error deleting employee: ' + error.message);
    }
}

/**
 * Save employees data to GitHub
 */
async function saveEmployeesData() {
    try {
        // Update file
        await githubAPI.updateFile(
            `data/customers/${customerId}/employees.json`,
            JSON.stringify(employeesData, null, 2)
        );
        
        return true;
    } catch (error) {
        console.error('Error saving employees data:', error);
        throw error;
    }
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show modal for creating a new survey
 * @param {number} [employeeId] - Optional employee ID to pre-select
 */
function showCreateSurveyModal(employeeId = null) {
    // Reset form
    document.getElementById('survey-title').value = '';
    document.getElementById('survey-type').value = 'employee';
    
    // Set default expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    document.getElementById('survey-expiry').valueAsDate = expiryDate;
    
    // Populate recipient dropdown
    const recipientSelect = document.getElementById('survey-recipient');
    recipientSelect.innerHTML = '<option value="">Select an employee or candidate</option>';
    
    employeesData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} (${employee.email})`;
        
        // Pre-select if employeeId is provided
        if (employeeId && employee.id === employeeId) {
            option.selected = true;
        }
        
        recipientSelect.appendChild(option);
    });
    
    // Show modal
    document.getElementById('create-survey-modal').style.display = 'block';
}

/**
 * Create and send a new survey
 */
async function createAndSendSurvey() {
    const title = document.getElementById('survey-title').value.trim();
    const type = document.getElementById('survey-type').value;
    const recipientId = parseInt(document.getElementById('survey-recipient').value, 10);
    const expiryDate = document.getElementById('survey-expiry').value;
    
    if (!title) {
        showError('Please enter a survey title.');
        return;
    }
    
    if (!recipientId) {
        showError('Please select a recipient.');
        return;
    }
    
    if (!expiryDate) {
        showError('Please select an expiry date.');
        return;
    }
    
    try {
        // Find recipient
        const recipient = employeesData.find(e => e.id === recipientId);
        
        if (!recipient) {
            showError('Recipient not found.');
            return;
        }
        
        // Create new survey
        const newSurveyId = surveysData.length > 0 ? Math.max(...surveysData.map(s => s.id)) + 1 : 1;
        const now = new Date().toISOString();
        
        // Generate unique access token
        const accessToken = generateAccessToken();
        
        // Create survey object
        const newSurvey = {
            id: newSurveyId,
            title: title,
            type: type,
            recipientId: recipientId,
            recipientEmail: recipient.email,
            createdAt: now,
            expiryDate: new Date(expiryDate).toISOString(),
            accessToken: accessToken,
            completed: false,
            results: null
        };
        
        // Add to surveys array
        surveysData.push(newSurvey);
        
        // Save to GitHub
        await saveSurveysData();
        
        // Send survey email (simulated)
        const surveyUrl = `${window.location.origin}/index.html?token=${accessToken}&customer=${customerId}`;
        await sendSurveyEmail(recipient.email, title, surveyUrl);
        
        // Close modal
        closeAllModals();
        
        // Refresh display
        displaySurveys(surveysData);
        
        showSuccess('Survey created and sent successfully.');
    } catch (error) {
        console.error('Error creating survey:', error);
        showError('Error creating survey: ' + error.message);
    }
}

/**
 * Resend a survey
 * @param {number} surveyId - The ID of the survey to resend
 */
async function resendSurvey(surveyId) {
    try {
        // Find survey
        const survey = surveysData.find(s => s.id === surveyId);
        
        if (!survey) {
            showError('Survey not found.');
            return;
        }
        
        // Find recipient
        const recipient = employeesData.find(e => e.id === survey.recipientId);
        
        if (!recipient) {
            showError('Recipient not found.');
            return;
        }
        
        // Generate survey URL
        const surveyUrl = `${window.location.origin}/index.html?token=${survey.accessToken}&customer=${customerId}`;
        
        // Send survey email (simulated)
        await sendSurveyEmail(recipient.email, survey.title, surveyUrl);
        
        showSuccess('Survey resent successfully.');
    } catch (error) {
        console.error('Error resending survey:', error);
        showError('Error resending survey: ' + error.message);
    }
}

/**
 * Confirm deletion of a survey
 * @param {number} surveyId - The ID of the survey to delete
 */
function confirmDeleteSurvey(surveyId) {
    // Find survey
    const survey = surveysData.find(s => s.id === surveyId);
    
    if (!survey) {
        showError('Survey not found.');
        return;
    }
    
    // Confirm deletion
    if (confirm(`Are you sure you want to delete the survey "${survey.title}"?`)) {
        deleteSurvey(surveyId);
    }
}

/**
 * Delete a survey
 * @param {number} surveyId - The ID of the survey to delete
 */
async function deleteSurvey(surveyId) {
    try {
        // Find survey index
        const surveyIndex = surveysData.findIndex(s => s.id === surveyId);
        
        if (surveyIndex === -1) {
            showError('Survey not found.');
            return;
        }
        
        // Remove from array
        surveysData.splice(surveyIndex, 1);
        
        // Save to GitHub
        await saveSurveysData();
        
        // Refresh display
        displaySurveys(surveysData);
        
        showSuccess('Survey deleted successfully.');
    } catch (error) {
        console.error('Error deleting survey:', error);
        showError('Error deleting survey: ' + error.message);
    }
}

/**
 * Show survey results
 * @param {number} surveyId - The ID of the survey to show results for
 */
function showSurveyResults(surveyId) {
    // Find survey
    const survey = surveysData.find(s => s.id === surveyId);
    
    if (!survey) {
        showError('Survey not found.');
        return;
    }
    
    if (!survey.completed || !survey.results) {
        showError('Survey results not available.');
        return;
    }
    
    // Find recipient
    const recipient = employeesData.find(e => e.id === survey.recipientId);
    const recipientName = recipient ? recipient.name : 'Unknown';
    
    // Get results container
    const resultsContainer = document.getElementById('result-details');
    
    // Format completion date
    const completedDate = new Date(survey.results.completedAt).toLocaleString();
    
    // Show results
    resultsContainer.innerHTML = `
        <div class="result-header">
            <h3>${survey.title}</h3>
            <div class="result-meta">
                <p><strong>Recipient:</strong> ${recipientName}</p>
                <p><strong>Completed:</strong> ${completedDate}</p>
            </div>
        </div>
        <div class="result-summary">
            <h4>Value Alignment Scores:</h4>
            <div class="score-chart">
                <!-- Score chart will be generated here -->
            </div>
        </div>
        <div class="result-details">
            <h4>Detailed Responses:</h4>
            <div class="responses-list">
                <!-- Responses will be generated here -->
            </div>
        </div>
    `;
    
    // Generate score chart
    const scoreChart = resultsContainer.querySelector('.score-chart');
    const valueScores = survey.results.valueScores;
    
    if (valueScores && valueScores.length > 0) {
        // Create score bars
        valueScores.forEach(score => {
            // Find value
            const value = valuesData.find(v => v.id === score.valueId);
            const valueName = value ? value.name : `Value ${score.valueId}`;
            
            // Create score bar
            const scoreBar = document.createElement('div');
            scoreBar.className = 'score-bar';
            scoreBar.innerHTML = `
                <div class="score-label">${valueName}</div>
                <div class="score-bar-container">
                    <div class="score-bar-fill" style="width: ${score.score * 10}%"></div>
                    <div class="score-value">${score.score}/10</div>
                </div>
            `;
            
            scoreChart.appendChild(scoreBar);
        });
    } else {
        scoreChart.innerHTML = '<p>No value scores available.</p>';
    }
    
    // Generate responses list
    const responsesList = resultsContainer.querySelector('.responses-list');
    const responses = survey.results.responses;
    
    if (responses && responses.length > 0) {
        // Create response items
        responses.forEach(response => {
            // Find question
            const question = questionsData.find(q => q.id === response.questionId);
            const questionText = question ? question.text : `Question ${response.questionId}`;
            
            // Find selected option
            const option = question ? question.options.find(o => o.id === response.selectedOptionId) : null;
            const optionText = option ? option.text : `Option ${response.selectedOptionId}`;
            
            // Create response item
            const responseItem = document.createElement('div');
            responseItem.className = 'response-item';
            responseItem.innerHTML = `
                <div class="response-question">${questionText}</div>
                <div class="response-answer">
                    <strong>Selected:</strong> ${optionText}
                </div>
            `;
            
            responsesList.appendChild(responseItem);
        });
    } else {
        responsesList.innerHTML = '<p>No detailed responses available.</p>';
    }
    
    // Add event listener to print button
    const printBtn = document.getElementById('print-results-btn');
    printBtn.onclick = () => printSurveyResults(survey);
    
    // Show modal
    document.getElementById('view-results-modal').style.display = 'block';
}

/**
 * Print survey results
 * @param {Object} survey - The survey object
 */
function printSurveyResults(survey) {
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Find recipient
    const recipient = employeesData.find(e => e.id === survey.recipientId);
    const recipientName = recipient ? recipient.name : 'Unknown';
    
    // Format completion date
    const completedDate = new Date(survey.results.completedAt).toLocaleString();
    
    // Generate value scores HTML
    let valueScoresHtml = '';
    if (survey.results.valueScores && survey.results.valueScores.length > 0) {
        valueScoresHtml = '<h3>Value Alignment Scores:</h3><ul>';
        
        survey.results.valueScores.forEach(score => {
            // Find value
            const value = valuesData.find(v => v.id === score.valueId);
            const valueName = value ? value.name : `Value ${score.valueId}`;
            
            valueScoresHtml += `<li>${valueName}: ${score.score}/10</li>`;
        });
        
        valueScoresHtml += '</ul>';
    }
    
    // Generate responses HTML
    let responsesHtml = '';
    if (survey.results.responses && survey.results.responses.length > 0) {
        responsesHtml = '<h3>Detailed Responses:</h3><ul>';
        
        survey.results.responses.forEach(response => {
            // Find question
            const question = questionsData.find(q => q.id === response.questionId);
            const questionText = question ? question.text : `Question ${response.questionId}`;
            
            // Find selected option
            const option = question ? question.options.find(o => o.id === response.selectedOptionId) : null;
            const optionText = option ? option.text : `Option ${response.selectedOptionId}`;
            
            responsesHtml += `<li><strong>${questionText}</strong><br>Selected: ${optionText}</li>`;
        });
        
        responsesHtml += '</ul>';
    }
    
    // Write HTML to print window
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Survey Results - ${survey.title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.5;
                }
                h1, h2, h3 {
                    margin-top: 20px;
                }
                ul {
                    margin-bottom: 20px;
                }
                li {
                    margin-bottom: 10px;
                }
                .header {
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .meta {
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Survey Results: ${survey.title}</h1>
                <p>Company: ${companyName}</p>
            </div>
            <div class="meta">
                <p><strong>Recipient:</strong> ${recipientName}</p>
                <p><strong>Completed:</strong> ${completedDate}</p>
            </div>
            ${valueScoresHtml}
            ${responsesHtml}
            <p style="margin-top: 30px; font-size: 0.8em;">Generated by ValuesAlign - ${new Date().toLocaleString()}</p>
        </body>
        </html>
    `);
    
    // Print and close
    printWindow.document.close();
    printWindow.print();
}

/**
 * Save surveys data to GitHub
 */
async function saveSurveysData() {
    try {
        // Update file
        await githubAPI.updateFile(
            `data/customers/${customerId}/surveys.json`,
            JSON.stringify(surveysData, null, 2)
        );
        
        return true;
    } catch (error) {
        console.error('Error saving surveys data:', error);
        throw error;
    }
}

/**
 * Send survey email (simulated)
 * @param {string} email - The recipient email
 * @param {string} title - The survey title
 * @param {string} surveyUrl - The survey URL
 */
async function sendSurveyEmail(email, title, surveyUrl) {
    console.log(`Sending survey email to ${email} for survey "${title}"`);
    console.log(`Survey URL: ${surveyUrl}`);
    
    // In a real application, this would send an actual email
    // For now, we'll just simulate a delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`Email sent to ${email}`);
            resolve(true);
        }, 1000);
    });
}

/**
 * Generate a random access token
 * @returns {string} - The generated token
 */
function generateAccessToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < 32; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return token;
}
