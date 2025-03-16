/**
 * Wild Zora Candidate Values Survey
 * 
 * This script handles the functionality of the candidate values survey,
 * including loading questions, collecting responses, calculating scores,
 * and displaying results.
 * 
 * Version: v1.5.0
 */

// Global variables
let surveyData = null;
let valuesData = null;
let currentQuestion = 0;
let userResponses = {};
let candidateName = '';
let candidateEmail = '';
let surveyId = null;
let githubAPI = null;
let filteredQuestions = [];
let percentageResults = {};
let overallScore = 0;

// Initialize the survey when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Initialize GitHub API if available
    if (window.githubAPI) {
        githubAPI = window.githubAPI;
        console.log('GitHub API initialized');
        
        // Check if token is set in localStorage
        const token = localStorage.getItem('github_token');
        if (token) {
            githubAPI.setToken(token);
            console.log('GitHub token set from localStorage');
        }
    }
    
    // Load survey data
    initializeSurvey();
    
    // Add event listener to start button
    const startButton = document.getElementById('start-survey');
    if (startButton) {
        console.log('Start button found, adding event listener');
        // Remove any existing event listeners
        startButton.replaceWith(startButton.cloneNode(true));
        
        // Get the new button reference after replacing
        const newStartButton = document.getElementById('start-survey');
        newStartButton.addEventListener('click', function(e) {
            console.log('Start button clicked');
            e.preventDefault();
            startSurvey();
        });
        console.log('Event listener added to start button');
    } else {
        console.error('Start button not found');
    }
});

// Fallback for direct script loading
window.onload = function() {
    console.log('Window loaded');
    
    // Check if we already set up the event listener in DOMContentLoaded
    const startButton = document.getElementById('start-survey');
    if (startButton && !startButton._hasClickListener) {
        console.log('Adding click listener in window.onload');
        startButton.addEventListener('click', function() {
            console.log('Start button clicked (from window.onload)');
            startSurvey();
        });
        startButton._hasClickListener = true;
    }
};

/**
 * Initialize the survey by loading the survey data and values data
 */
async function initializeSurvey() {
    try {
        console.log('Initializing survey...');
        
        // Load survey data
        const surveyResponse = await fetch('./data/survey.json');
        if (!surveyResponse.ok) {
            throw new Error(`Failed to load survey data: ${surveyResponse.status} ${surveyResponse.statusText}`);
        }
        surveyData = await surveyResponse.json();
        console.log('Survey data loaded successfully:', surveyData);
        
        // Load values data
        const valuesResponse = await fetch('./data/values.json');
        if (!valuesResponse.ok) {
            throw new Error(`Failed to load values data: ${valuesResponse.status} ${valuesResponse.statusText}`);
        }
        valuesData = await valuesResponse.json();
        console.log('Values data loaded successfully:', valuesData);
        
        // Filter questions based on enabled values
        filterQuestionsByEnabledValues();
    } catch (error) {
        console.error('Error loading survey data:', error);
        showError('Failed to load survey. Please refresh the page and try again.');
    }
}

/**
 * Filter questions to only include those associated with enabled values
 */
function filterQuestionsByEnabledValues() {
    if (!surveyData || !valuesData) {
        console.error('Survey data or values data not loaded');
        return;
    }
    
    // Create a map of enabled values
    const enabledValues = {};
    valuesData.values.forEach(value => {
        enabledValues[value.id] = value.enabled;
    });
    
    console.log('Enabled values:', enabledValues);
    
    // Get list of questions associated with enabled values
    const enabledQuestionIds = [];
    surveyData.categories.forEach(category => {
        if (enabledValues[category.id]) {
            // If this value is enabled, add all its questions to the enabled list
            enabledQuestionIds.push(...category.questions);
        }
    });
    
    console.log('Enabled question IDs:', enabledQuestionIds);
    
    // Filter the questions array to only include enabled questions
    filteredQuestions = surveyData.questions.filter(question => 
        enabledQuestionIds.includes(question.id)
    );
    
    console.log('Filtered questions:', filteredQuestions.length);
    
    // If no questions are enabled, use all questions as a fallback
    if (filteredQuestions.length === 0) {
        console.warn('No enabled questions found, using all questions as fallback');
        filteredQuestions = surveyData.questions;
    }
}

/**
 * Start the survey by collecting candidate information
 */
function startSurvey() {
    console.log('Start survey function called');
    
    // Make sure we have survey data and questions
    if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
        console.error('Survey data not loaded or no questions available');
        showError('Survey data is not available. Please refresh the page and try again.');
        return;
    }
    
    // Make sure we have filtered questions
    if (!filteredQuestions || filteredQuestions.length === 0) {
        console.warn('No filtered questions available, using all questions');
        filteredQuestions = surveyData.questions;
    }
    
    const introSection = document.getElementById('intro-section');
    if (!introSection) {
        console.error('Intro section not found');
        return;
    }
    
    // Create a form to collect candidate information
    introSection.innerHTML = `
        <h2>Before we begin</h2>
        <p>Please provide your information:</p>
        <form id="candidate-info-form" class="candidate-form">
            <div class="form-group">
                <label for="candidate-name">Full Name:</label>
                <input type="text" id="candidate-name" required>
            </div>
            <div class="form-group">
                <label for="candidate-email">Email:</label>
                <input type="email" id="candidate-email" required>
            </div>
            <button type="submit" class="btn primary-btn">Continue to Survey</button>
        </form>
    `;

    // Add event listener to the form
    const form = document.getElementById('candidate-info-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            candidateName = document.getElementById('candidate-name').value.trim();
            candidateEmail = document.getElementById('candidate-email').value.trim();
            
            if (candidateName && candidateEmail) {
                // Generate a unique ID for this survey
                surveyId = `${Date.now()}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
                
                // Save in-progress survey to GitHub
                saveInProgressSurvey();
                
                // Show questions
                showQuestions();
            }
        });
    } else {
        console.error('Candidate info form not found');
    }
}

/**
 * Save in-progress survey information to GitHub
 */
async function saveInProgressSurvey() {
    console.log('Saving in-progress survey...');
    
    try {
        // Get GitHub token from localStorage
        const token = localStorage.getItem('github_token');
        
        if (!token) {
            console.error('GitHub token not found');
            return false;
        }
        
        // Create GitHub API instance
        const github = new GitHubAPI({
            token: token,
            owner: config.github.owner,
            repo: config.github.repo,
            branch: config.github.branch,
            resultsPath: config.github.resultsPath
        });
        
        // Generate survey ID if not already set
        if (!surveyId) {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const email = candidateEmail ? candidateEmail.replace(/[@.]/g, '_') : 'anonymous';
            surveyId = `${timestamp}_${email}`;
        }
        
        // Prepare survey data
        const surveyData = {
            id: surveyId,
            name: candidateName,
            email: candidateEmail,
            timestamp: new Date().toISOString(),
            currentQuestion: currentQuestion,
            answers: userResponses,
            status: 'in_progress'
        };
        
        // Save in-progress survey
        const success = await github.saveSurvey(surveyData);
        
        if (success) {
            console.log('In-progress survey saved successfully');
            return true;
        } else {
            console.error('Failed to save in-progress survey');
            return false;
        }
    } catch (error) {
        console.error('Error saving in-progress survey:', error);
        return false;
    }
}

/**
 * Display the questions section and show the first question
 */
function showQuestions() {
    console.log('Showing questions');
    
    // Make sure we have filtered questions
    if (!filteredQuestions || filteredQuestions.length === 0) {
        console.error('No questions available to display');
        showError('No survey questions are available. Please contact the administrator.');
        return;
    }
    
    const introSection = document.getElementById('intro-section');
    const questionsSection = document.getElementById('questions-section');
    
    if (!introSection || !questionsSection) {
        console.error('Required sections not found');
        return;
    }
    
    introSection.classList.add('hidden');
    questionsSection.classList.remove('hidden');
    
    // Initialize progress tracker
    questionsSection.innerHTML = `
        <div class="progress-container">
            <div class="progress-text">Question <span id="current-question">1</span> of ${filteredQuestions.length}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(1/filteredQuestions.length) * 100}%"></div>
            </div>
        </div>
        <div id="question-container"></div>
        <div class="nav-buttons">
            <button id="prev-btn" class="btn secondary-btn" disabled>Previous</button>
            <button id="next-btn" class="btn primary-btn">Next</button>
        </div>
    `;
    
    // Add event listeners to navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', showPreviousQuestion);
        nextBtn.addEventListener('click', handleNextQuestion);
        
        // Show the first question
        showQuestion(0);
    } else {
        console.error('Navigation buttons not found');
    }
}

/**
 * Display a specific question
 * @param {number} questionIndex - The index of the question to display
 */
function showQuestion(questionIndex) {
    if (!filteredQuestions || filteredQuestions.length === 0) {
        console.error('No filtered questions available');
        return;
    }
    
    if (questionIndex < 0 || questionIndex >= filteredQuestions.length) {
        console.error('Invalid question index:', questionIndex);
        return;
    }
    
    currentQuestion = questionIndex;
    const question = filteredQuestions[questionIndex];
    const questionContainer = document.getElementById('question-container');
    
    if (!questionContainer) {
        console.error('Question container not found');
        return;
    }
    
    // Update progress indicator
    const currentQuestionEl = document.getElementById('current-question');
    const progressFill = document.querySelector('.progress-fill');
    
    if (currentQuestionEl) {
        currentQuestionEl.textContent = questionIndex + 1;
    }
    
    if (progressFill) {
        progressFill.style.width = `${((questionIndex + 1) / filteredQuestions.length) * 100}%`;
    }
    
    // Update button states
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = questionIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.textContent = questionIndex === filteredQuestions.length - 1 ? 'Submit' : 'Next';
    }
    
    // Create the question HTML
    questionContainer.innerHTML = `
        <div class="question" data-question-id="${question.id}">
            <h3 class="question-text">${question.text}</h3>
            <ul class="options">
                ${question.options.map(option => `
                    <li class="option">
                        <label>
                            <input type="radio" name="q${question.id}" value="${option.id}" 
                                ${userResponses[question.id] === option.id ? 'checked' : ''}>
                            ${option.text}
                        </label>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

/**
 * Show the previous question
 */
function showPreviousQuestion() {
    if (currentQuestion > 0) {
        showQuestion(currentQuestion - 1);
    }
}

/**
 * Handle the next button click - either show the next question or submit the survey
 */
function handleNextQuestion() {
    if (!filteredQuestions || filteredQuestions.length === 0) {
        console.error('No filtered questions available');
        return;
    }
    
    // Save the current response
    const question = filteredQuestions[currentQuestion];
    const selectedOption = document.querySelector(`input[name="q${question.id}"]:checked`);
    
    if (!selectedOption) {
        showError('Please select an answer before continuing.');
        return;
    }
    
    userResponses[question.id] = selectedOption.value;
    
    // Update in-progress survey with the new response
    saveInProgressSurvey();
    
    // If this is the last question, submit the survey
    if (currentQuestion === filteredQuestions.length - 1) {
        calculateResults();
    } else {
        // Otherwise, show the next question
        showQuestion(currentQuestion + 1);
    }
}

/**
 * Calculate the survey results
 */
function calculateResults() {
    console.log('Calculating results');
    
    // Initialize results object with all categories from values data
    const results = {};
    if (valuesData && valuesData.values) {
        valuesData.values.forEach(value => {
            if (value.enabled) {
                results[value.id] = 0;
            }
        });
    } else {
        // Fallback if values data is not available
        results.optimism = 0;
        results.productivity = 0;
        results.valueOrientation = 0;
        results.collaboration = 0;
        results.generalInsight = 0;
    }
    
    // Calculate scores for each category
    Object.entries(userResponses).forEach(([questionId, optionId]) => {
        const questionObj = filteredQuestions.find(q => q.id === parseInt(questionId));
        if (!questionObj) return;
        
        const option = questionObj.options.find(opt => opt.id === optionId);
        
        if (option && option.score !== undefined) {
            // Find which category this question belongs to
            for (const category of surveyData.categories) {
                if (category.questions.includes(parseInt(questionId))) {
                    // Only add score if the category is enabled
                    if (results[category.id] !== undefined) {
                        results[category.id] += option.score;
                    }
                    break;
                }
            }
        }
    });
    
    // Calculate percentage scores
    const maxScores = {};
    
    // Calculate max scores based on enabled values and their questions
    surveyData.categories.forEach(category => {
        if (results[category.id] !== undefined) {
            // Count how many questions from this category are in the filtered questions
            const categoryQuestionCount = filteredQuestions.filter(q => 
                category.questions.includes(q.id)
            ).length;
            
            // Max score is 3 points per question
            maxScores[category.id] = categoryQuestionCount * 3;
        }
    });
    
    percentageResults = {};
    Object.keys(results).forEach(category => {
        if (maxScores[category] && maxScores[category] > 0) {
            percentageResults[category] = Math.round((results[category] / maxScores[category]) * 100);
        } else {
            percentageResults[category] = 0;
        }
    });
    
    // Calculate overall score (average of all categories)
    overallScore = Object.keys(percentageResults).length > 0 
        ? Math.round(
            Object.values(percentageResults).reduce((sum, score) => sum + score, 0) / 
            Object.keys(percentageResults).length
        )
        : 0;
    
    // Determine result levels
    const levels = {};
    Object.keys(percentageResults).forEach(category => {
        const score = percentageResults[category];
        if (score >= 85) {
            levels[category] = 'excellent';
        } else if (score >= 70) {
            levels[category] = 'good';
        } else if (score >= 50) {
            levels[category] = 'average';
        } else {
            levels[category] = 'needs_improvement';
        }
    });
    
    // Prepare final results object
    const finalResults = {
        candidateName: candidateName,
        candidateEmail: candidateEmail,
        timestamp: new Date().toISOString(),
        rawScores: results,
        percentageScores: percentageResults,
        levels: levels,
        overallScore: overallScore,
        responses: userResponses
    };
    
    console.log('Final results:', finalResults);
    
    // Save survey results to GitHub
    saveSurveyResponses();
    
    // Display the results
    showResults(finalResults);
    
    // Save results to localStorage as a backup
    try {
        localStorage.setItem(`survey_result_${candidateEmail}`, JSON.stringify(finalResults));
    } catch (error) {
        console.warn('Failed to save results to localStorage:', error);
    }
}

/**
 * Saves survey responses to GitHub
 * @param {Object} responses - The survey responses to save
 */
async function saveSurveyResponses() {
    console.log('Saving survey results...');
    showLoading(true);
    
    try {
        // Get GitHub token from localStorage
        const token = localStorage.getItem('github_token');
        
        if (!token) {
            console.error('GitHub token not found');
            showError('GitHub token not found. Please contact the administrator.');
            showLoading(false);
            return;
        }
        
        // Create GitHub API instance
        const github = new GitHubAPI({
            token: token,
            owner: config.github.owner,
            repo: config.github.repo,
            branch: config.github.branch,
            resultsPath: config.github.resultsPath
        });
        
        // Prepare survey data
        const surveyData = {
            name: candidateName,
            email: candidateEmail,
            timestamp: new Date().toISOString(),
            answers: userResponses,
            value_scores: percentageResults,
            final_score: overallScore,
            status: 'completed'
        };
        
        // Save survey results
        const success = await github.saveSurvey(surveyData);
        
        if (success) {
            console.log('Survey results saved successfully');
            
            // Try to delete in-progress survey if it exists
            if (surveyId) {
                try {
                    // The in-progress survey is now saved as a completed survey
                    console.log('Survey completed, no need to delete in-progress survey as we use a unified approach');
                } catch (error) {
                    console.warn('Error deleting in-progress survey:', error);
                    // Continue anyway, as this is not critical
                }
            }
            
            showLoading(false);
            showResults();
        } else {
            console.error('Failed to save survey results');
            showError('Failed to save survey results. Please try again or contact the administrator.');
            showLoading(false);
        }
    } catch (error) {
        console.error('Error saving survey results:', error);
        showError('Error saving survey results: ' + error.message);
        showLoading(false);
    }
}

/**
 * Display the survey results
 * @param {object} results - The calculated survey results
 */
function showResults(results) {
    console.log('Showing results');
    
    const questionsSection = document.getElementById('questions-section');
    const resultsSection = document.getElementById('results-section');
    
    if (!questionsSection || !resultsSection) {
        console.error('Required sections not found');
        return;
    }
    
    questionsSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Get strength description based on result levels
    const strengthDescription = getStrengthDescription(results.levels);
    
    // Create results HTML
    resultsSection.innerHTML = `
        <h2>Survey Results</h2>
        <p>Thank you for completing the Wild Zora Candidate Values Survey, ${results.candidateName}!</p>
        
        <div class="overall-result">
            <h3>Overall Alignment Score: ${results.overallScore}%</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${results.overallScore}%"></div>
            </div>
        </div>
        
        <div class="results-container">
            ${surveyData.categories.map(category => `
                <div class="result-category">
                    <h4>${category.name}</h4>
                    <p>${category.description}</p>
                    <div class="score-display">
                        <span class="score-value">${results.percentageScores[category.id]}%</span>
                        <div class="progress-bar">
                            <div class="progress-fill ${getScoreClass(results.percentageScores[category.id])}" 
                                style="width: ${results.percentageScores[category.id]}%"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="result-summary">
            <h3>Your Strengths</h3>
            <p>${strengthDescription}</p>
        </div>
        
        <div class="result-actions">
            <p>Your results have been recorded. Thank you for your participation!</p>
            <button id="print-results" class="btn secondary-btn">Print Results</button>
        </div>
    `;
    
    // Add event listener to print button
    const printButton = document.getElementById('print-results');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }
}

/**
 * Generate a description of the candidate's strengths based on their result levels
 * @param {object} levels - The result levels for each category
 * @returns {string} A description of the candidate's strengths
 */
function getStrengthDescription(levels) {
    const strengths = [];
    
    if (levels.optimism === 'excellent' || levels.optimism === 'good') {
        strengths.push('maintaining a positive outlook and finding solutions in challenging situations');
    }
    
    if (levels.productivity === 'excellent' || levels.productivity === 'good') {
        strengths.push('organizing your work effectively and continuously improving your processes');
    }
    
    if (levels.valueOrientation === 'excellent' || levels.valueOrientation === 'good') {
        strengths.push('focusing on business value and making decisions that drive meaningful results');
    }
    
    if (levels.collaboration === 'excellent' || levels.collaboration === 'good') {
        strengths.push('working well with others and communicating effectively in a team environment');
    }
    
    if (levels.generalInsight === 'excellent' || levels.generalInsight === 'good') {
        strengths.push('demonstrating good general awareness and adaptability in various situations');
    }
    
    if (strengths.length === 0) {
        return 'Based on your responses, we recommend focusing on developing skills across all our core value areas.';
    } else if (strengths.length === 1) {
        return `Based on your responses, you show particular strength in ${strengths[0]}.`;
    } else {
        const lastStrength = strengths.pop();
        return `Based on your responses, you show particular strengths in ${strengths.join(', ')} and ${lastStrength}.`;
    }
}

/**
 * Get CSS class based on score
 * @param {number} score - The score to classify
 * @returns {string} The CSS class name
 */
function getScoreClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-needs-improvement';
}

/**
 * Display an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    console.error('Error:', message);
    
    // Create error element if it doesn't exist
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.body.appendChild(errorElement);
    }
    
    // Show the error message
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide the error after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Make functions globally accessible
window.startSurvey = startSurvey;
window.showQuestions = showQuestions;
