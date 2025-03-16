/**
 * Wild Zora Candidate Values Survey - Admin Values Management
 * 
 * This script handles the functionality for viewing and editing company values
 * in the admin interface, including statistics and question management.
 * 
 * Version: v1.4.0
 */

// Global variables
let valuesData = null;
let surveyData = null;
let surveyQuestions = null;
let surveyResults = [];

/**
 * Initialize the values management functionality
 */
async function initializeValuesManagement() {
    try {
        console.log('Initializing values management...');
        
        // Load values data
        await loadValuesData();
        
        // Load survey data
        await loadSurveyData();
        
        // Calculate statistics if we have survey results
        if (surveyResults && surveyResults.length > 0) {
            calculateValueStatistics();
        }
        
        // Display values in the UI
        displayValues();
        
        console.log('Values management initialized successfully');
    } catch (error) {
        console.error('Error initializing values management:', error);
        showError('Failed to initialize values management. Please try again.');
    }
}

/**
 * Load values data from the server
 */
async function loadValuesData() {
    try {
        console.log('Loading values data...');
        
        // First try to load from GitHub
        if (githubAPI && githubAPI.isConfigured()) {
            try {
                valuesData = await githubAPI.getValuesData();
                console.log('Values data loaded from GitHub:', valuesData);
                return;
            } catch (error) {
                console.warn('Could not load values data from GitHub, falling back to local file:', error);
            }
        }
        
        // Fall back to local file
        const response = await fetch('./data/values.json');
        if (!response.ok) {
            throw new Error(`Failed to load values data: ${response.status} ${response.statusText}`);
        }
        valuesData = await response.json();
        console.log('Values data loaded from local file:', valuesData);
    } catch (error) {
        console.error('Error loading values data:', error);
        throw error;
    }
}

/**
 * Load survey data from the server
 */
async function loadSurveyData() {
    try {
        console.log('Loading survey data...');
        
        // First try to load from GitHub
        if (githubAPI && githubAPI.isConfigured()) {
            try {
                surveyData = await githubAPI.getSurveyData();
                console.log('Survey data loaded from GitHub:', surveyData);
            } catch (error) {
                console.warn('Could not load survey data from GitHub, falling back to local file:', error);
            }
        }
        
        // Fall back to local file if needed
        if (!surveyData) {
            const response = await fetch('./data/survey.json');
            if (!response.ok) {
                throw new Error(`Failed to load survey data: ${response.status} ${response.statusText}`);
            }
            surveyData = await response.json();
            console.log('Survey data loaded from local file:', surveyData);
        }
        
        // Store survey data in localStorage for later use
        localStorage.setItem('surveyData', JSON.stringify(surveyData));
        
        // Extract questions from survey data
        surveyQuestions = surveyData.questions;
        console.log('Survey questions loaded successfully:', surveyQuestions);
    } catch (error) {
        console.error('Error loading survey data:', error);
        throw error;
    }
}

/**
 * Calculate statistics for each value based on survey results
 */
function calculateValueStatistics() {
    console.log('Calculating value statistics...');
    
    // Reset statistics
    valuesData.values.forEach(value => {
        value.stats = {
            candidatesTested: 0,
            averageAlignment: 0
        };
    });
    
    // Calculate statistics for each value
    surveyResults.forEach(result => {
        if (result.scores) {
            Object.keys(result.scores).forEach(valueId => {
                const value = valuesData.values.find(v => v.id === valueId);
                if (value) {
                    value.stats.candidatesTested++;
                    // Add the score (we'll calculate average later)
                    value.stats.averageAlignment += result.scores[valueId].percentage || 0;
                }
            });
        }
    });
    
    // Calculate averages
    valuesData.values.forEach(value => {
        if (value.stats.candidatesTested > 0) {
            value.stats.averageAlignment = Math.round(value.stats.averageAlignment / value.stats.candidatesTested);
        }
    });
    
    console.log('Value statistics calculated:', valuesData);
}

/**
 * Display values in the UI
 */
function displayValues() {
    console.log('Displaying values:', valuesData.values);
    const container = document.getElementById('values-container');
    
    if (!container) {
        console.error('Values container not found');
        return;
    }
    
    if (!valuesData.values || !valuesData.values.length) {
        container.innerHTML = '<p>No values found. Please add some values.</p>';
        return;
    }
    
    let html = '<div class="values-list">';
    
    valuesData.values.forEach((value, index) => {
        const questionCount = value.questions ? value.questions.length : 0;
        const activeClass = value.enabled ? 'active' : 'inactive';
        
        html += `
            <div class="value-item ${activeClass}">
                <div class="value-header">
                    <h4>${value.name}</h4>
                    <div class="value-actions">
                        <button class="btn small-btn" onclick="window.adminValues.editValue(${index})">Edit</button>
                        <button class="btn small-btn" onclick="window.adminValues.toggleValueStatus(${index})">
                            ${value.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn small-btn" onclick="window.adminValues.showEditQuestionsModal(${index})">
                            Questions (${questionCount})
                        </button>
                    </div>
                </div>
                <p class="value-description">${value.description}</p>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Toggle the enabled status of a value
 * @param {string} valueId - ID of the value to toggle
 * @param {boolean} enabled - New enabled status
 */
function toggleValueStatus(valueId, enabled) {
    console.log(`Toggling value ${valueId} to ${enabled ? 'enabled' : 'disabled'}`);
    
    // Find the value in the data
    const value = valuesData.values.find(v => v.id === valueId);
    if (value) {
        value.enabled = enabled;
        saveValuesData();
    }
}

/**
 * Show modal for editing a value
 * @param {string} valueId - ID of the value to edit
 */
function showEditValueModal(valueId) {
    console.log(`Showing edit modal for value ${valueId}`);
    
    // Find the value in the data
    const value = valuesData.values.find(v => v.id === valueId);
    if (!value) {
        console.error(`Value with ID ${valueId} not found`);
        return;
    }
    
    // Get modal elements
    const editValueModal = document.getElementById('edit-value-modal');
    const valueNameInput = document.getElementById('value-name');
    const valueDescriptionInput = document.getElementById('value-description');
    const saveValueBtn = document.getElementById('save-value-btn');
    
    // Set current values
    valueNameInput.value = value.name;
    valueDescriptionInput.value = value.description;
    
    // Set value ID as data attribute on save button
    saveValueBtn.setAttribute('data-value-id', valueId);
    
    // Show modal
    editValueModal.style.display = 'block';
}

/**
 * Show modal for editing questions for a value
 * @param {string} valueId - ID of the value to edit questions for
 */
function showEditQuestionsModal(valueId) {
    console.log(`Showing questions modal for value ${valueId}`);
    
    // Find the value in the data
    const value = valuesData.values.find(v => v.id === valueId);
    if (!value) {
        console.error(`Value with ID ${valueId} not found`);
        return;
    }
    
    // Get modal elements
    const editQuestionsModal = document.getElementById('edit-questions-modal');
    const questionsContainer = document.getElementById('questions-container');
    const valueNameDisplay = document.getElementById('value-name-display');
    
    // Set value name
    valueNameDisplay.textContent = value.name;
    
    // Clear questions container
    questionsContainer.innerHTML = '';
    
    // Find questions for this value
    const valueCategory = surveyData.categories.find(c => c.id === valueId);
    
    if (valueCategory && valueCategory.questions && surveyQuestions) {
        // Create accordion for each question
        valueCategory.questions.forEach(questionId => {
            const question = surveyQuestions.find(q => q.id === questionId);
            if (question) {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-accordion';
                questionDiv.innerHTML = `
                    <div class="question-header">
                        <span>Question ${question.id}: ${question.text}</span>
                        <button class="btn edit-question-btn" data-question-id="${question.id}">Edit</button>
                        <span class="accordion-toggle">▼</span>
                    </div>
                    <div class="question-content">
                        <div class="options-list">
                            ${question.options.map(option => `
                                <div class="option-item">
                                    <span class="option-id">${option.id}</span>
                                    <span class="option-text">${option.text}</span>
                                    <span class="option-score">Score: ${option.score}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                questionsContainer.appendChild(questionDiv);
                
                // Add event listener to accordion toggle
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
            }
        });
    } else {
        questionsContainer.innerHTML = '<p>No questions found for this value.</p>';
    }
    
    // Set value ID as data attribute on modal
    editQuestionsModal.setAttribute('data-value-id', valueId);
    
    // Show modal
    editQuestionsModal.style.display = 'block';
}

/**
 * Show modal for editing a specific question
 * @param {number} questionId - ID of the question to edit
 */
function showEditQuestionModal(questionId) {
    console.log(`Showing edit modal for question ${questionId}`);
    
    // Find the question in the data
    const question = surveyQuestions.find(q => q.id === questionId);
    if (!question) {
        console.error(`Question with ID ${questionId} not found`);
        return;
    }
    
    // Get modal elements
    const editQuestionModal = document.getElementById('edit-question-modal');
    const questionTextInput = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const saveQuestionBtn = document.getElementById('save-question-btn');
    
    // Set current values
    questionTextInput.value = question.text;
    
    // Clear options container
    optionsContainer.innerHTML = '';
    
    // Add options
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-edit';
        optionDiv.innerHTML = `
            <div class="option-row">
                <label>Option ${option.id}:</label>
                <input type="text" class="option-text-input" value="${option.text}" data-option-id="${option.id}">
            </div>
            <div class="option-row">
                <label>Score:</label>
                <select class="option-score-select" data-option-id="${option.id}">
                    <option value="0" ${option.score === 0 ? 'selected' : ''}>0 - Poor alignment</option>
                    <option value="1" ${option.score === 1 ? 'selected' : ''}>1 - Low alignment</option>
                    <option value="2" ${option.score === 2 ? 'selected' : ''}>2 - Moderate alignment</option>
                    <option value="3" ${option.score === 3 ? 'selected' : ''}>3 - High alignment</option>
                </select>
            </div>
        `;
        optionsContainer.appendChild(optionDiv);
    });
    
    // Set question ID as data attribute on save button
    saveQuestionBtn.setAttribute('data-question-id', questionId);
    
    // Show modal
    editQuestionModal.style.display = 'block';
}

/**
 * Save edited value
 */
function saveEditedValue() {
    console.log('Saving edited value...');
    
    // Get form elements
    const saveValueBtn = document.getElementById('save-value-btn');
    const valueId = saveValueBtn.getAttribute('data-value-id');
    const valueNameInput = document.getElementById('value-name');
    const valueDescriptionInput = document.getElementById('value-description');
    
    // Find the value in the data
    const value = valuesData.values.find(v => v.id === valueId);
    if (!value) {
        console.error(`Value with ID ${valueId} not found`);
        return;
    }
    
    // Update value
    value.name = valueNameInput.value.trim();
    value.description = valueDescriptionInput.value.trim();
    
    // Save changes
    saveValuesData();
    
    // Close modal
    document.getElementById('edit-value-modal').style.display = 'none';
    
    // Refresh display
    displayValues();
}

/**
 * Save edited question
 */
function saveEditedQuestion() {
    console.log('Saving edited question...');
    
    // Get form elements
    const saveQuestionBtn = document.getElementById('save-question-btn');
    const questionId = parseInt(saveQuestionBtn.getAttribute('data-question-id'));
    const questionTextInput = document.getElementById('question-text');
    
    // Find the question in the data
    const question = surveyQuestions.find(q => q.id === questionId);
    if (!question) {
        console.error(`Question with ID ${questionId} not found`);
        return;
    }
    
    // Update question text
    question.text = questionTextInput.value.trim();
    
    // Update options
    const optionTextInputs = document.querySelectorAll('.option-text-input');
    const optionScoreSelects = document.querySelectorAll('.option-score-select');
    
    optionTextInputs.forEach(input => {
        const optionId = input.getAttribute('data-option-id');
        const option = question.options.find(o => o.id === optionId);
        if (option) {
            option.text = input.value.trim();
        }
    });
    
    optionScoreSelects.forEach(select => {
        const optionId = select.getAttribute('data-option-id');
        const option = question.options.find(o => o.id === optionId);
        if (option) {
            option.score = parseInt(select.value);
        }
    });
    
    // Save changes
    saveSurveyQuestions();
    
    // Close modal
    document.getElementById('edit-question-modal').style.display = 'none';
    
    // Refresh questions display
    const valueId = document.getElementById('edit-questions-modal').getAttribute('data-value-id');
    showEditQuestionsModal(valueId);
}

/**
 * Save values data to the server
 */
async function saveValuesData() {
    console.log('Saving values data...');
    
    // Update last updated timestamp
    valuesData.lastUpdated = new Date().toISOString();
    
    // Save to GitHub if configured
    if (githubAPI && githubAPI.isConfigured()) {
        try {
            await githubAPI.saveValuesData(valuesData);
            console.log('Values data saved to GitHub');
        } catch (error) {
            console.error('Error saving values data to GitHub:', error);
            showError('Failed to save values data to GitHub. Changes may not persist.');
        }
    } else {
        console.warn('GitHub API not configured, changes will not persist');
        showError('GitHub API not configured. Changes will not persist after page reload.');
    }
    
    // Store in localStorage for immediate use
    localStorage.setItem('valuesData', JSON.stringify(valuesData));
}

/**
 * Save survey questions to the server
 */
async function saveSurveyQuestions() {
    console.log('Saving survey questions...');
    
    // Get the full survey data
    const surveyData = JSON.parse(localStorage.getItem('surveyData') || '{}');
    
    // Update questions in the survey data
    if (surveyData.questions) {
        surveyData.questions = surveyQuestions;
        
        // Save to GitHub if configured
        if (githubAPI && githubAPI.isConfigured()) {
            try {
                await githubAPI.saveSurveyData(surveyData);
                console.log('Survey questions saved to GitHub');
            } catch (error) {
                console.error('Error saving survey questions to GitHub:', error);
                showError('Failed to save survey questions to GitHub. Changes may not persist.');
            }
        } else {
            console.warn('GitHub API not configured, changes will not persist');
            showError('GitHub API not configured. Changes will not persist after page reload.');
        }
        
        // Store in localStorage for immediate use
        localStorage.setItem('surveyData', JSON.stringify(surveyData));
    } else {
        console.error('Survey data not found in localStorage');
        showError('Failed to save survey questions. Survey data not found.');
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorElement = document.getElementById('values-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}

// Export functions for use in admin.html
window.adminValues = {
    initialize: initializeValuesManagement,
    saveEditedValue: saveEditedValue,
    saveEditedQuestion: saveEditedQuestion
};
