/**
 * Wild Zora Potential Hire Survey
 * 
 * This script handles the functionality of the candidate values survey,
 * including loading questions, collecting responses, calculating scores,
 * and displaying results.
 */

// Import GitHub API and configuration - with fallbacks if not defined
const githubAPI = window.githubAPI || null;
const appConfig = window.appConfig || { version: 'v1.0.8' };

// Global variables
let surveyData = null;
let currentQuestion = 0;
let userResponses = {};
let candidateName = '';
let candidateEmail = '';
let surveyStartTime = null;
let surveyId = null;
let inProgressUpdateInterval = null;

// DOM elements
const introSection = document.getElementById('intro-section');
const questionsSection = document.getElementById('questions-section');
const resultsSection = document.getElementById('results-section');
const startSurveyBtn = document.getElementById('start-survey');

// Event listeners
document.addEventListener('DOMContentLoaded', initializeSurvey);
startSurveyBtn.addEventListener('click', startSurvey);

/**
 * Initialize the survey by loading the survey data
 */
async function initializeSurvey() {
    try {
        // Use a relative path that works with GitHub Pages
        const response = await fetch('./data/survey.json');
        if (!response.ok) {
            throw new Error('Failed to load survey data');
        }
        surveyData = await response.json();
        console.log('Survey data loaded successfully');
    } catch (error) {
        console.error('Error loading survey data:', error);
        showError('Failed to load survey. Please refresh the page and try again.');
    }
}

/**
 * Start the survey by collecting candidate information
 */
function startSurvey() {
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
    document.getElementById('candidate-info-form').addEventListener('submit', function(e) {
        e.preventDefault();
        candidateName = document.getElementById('candidate-name').value.trim();
        candidateEmail = document.getElementById('candidate-email').value.trim();
        
        if (candidateName && candidateEmail) {
            // Record survey start time
            surveyStartTime = new Date();
            
            // Generate a unique ID for this survey
            surveyId = `${Date.now()}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            // Save in-progress status
            saveInProgressStatus();
            
            // Start periodic updates of in-progress status (every minute)
            inProgressUpdateInterval = setInterval(saveInProgressStatus, 60000);
            
            showQuestions();
        }
    });
}

/**
 * Save the in-progress status to GitHub and localStorage
 */
function saveInProgressStatus() {
    if (!candidateName || !candidateEmail || !surveyStartTime) return;
    
    const currentTime = new Date();
    const elapsedTimeMs = currentTime - surveyStartTime;
    const elapsedMinutes = Math.floor(elapsedTimeMs / 60000);
    
    const inProgressData = {
        id: surveyId,
        name: candidateName,
        email: candidateEmail,
        startTime: surveyStartTime.toISOString(),
        lastUpdateTime: currentTime.toISOString(),
        elapsedMinutes: elapsedMinutes,
        currentQuestion: currentQuestion + 1,
        totalQuestions: surveyData.questions.length,
        progress: Math.round((currentQuestion / surveyData.questions.length) * 100),
        responses: userResponses
    };
    
    // Save to localStorage as a backup
    try {
        localStorage.setItem(`inProgressSurvey_${surveyId}`, JSON.stringify(inProgressData));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
    
    // Try to save to GitHub if API is available
    if (githubAPI && appConfig && appConfig.github && appConfig.github.token) {
        try {
            githubAPI.setToken(appConfig.github.token);
            githubAPI.saveInProgressSurvey(inProgressData).catch(error => {
                console.warn('Failed to save in-progress status to GitHub:', error);
            });
        } catch (error) {
            console.warn('Error with GitHub API:', error);
        }
    }
}

/**
 * Display the questions section and show the first question
 */
function showQuestions() {
    introSection.classList.add('hidden');
    questionsSection.classList.remove('hidden');
    
    // Initialize progress tracker
    questionsSection.innerHTML = `
        <div class="progress-container">
            <div class="progress-text">Question <span id="current-question">1</span> of ${surveyData.questions.length}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(1/surveyData.questions.length) * 100}%"></div>
            </div>
        </div>
        <div id="question-container"></div>
        <div class="nav-buttons">
            <button id="prev-btn" class="btn secondary-btn" disabled>Previous</button>
            <button id="next-btn" class="btn primary-btn">Next</button>
        </div>
    `;
    
    // Add event listeners for navigation buttons
    document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);
    document.getElementById('next-btn').addEventListener('click', handleNextQuestion);
    
    // Show the first question
    showQuestion(0);
}

/**
 * Display a specific question
 * @param {number} questionIndex - The index of the question to display
 */
function showQuestion(questionIndex) {
    currentQuestion = questionIndex;
    const question = surveyData.questions[questionIndex];
    const questionContainer = document.getElementById('question-container');
    
    // Update progress indicators
    document.getElementById('current-question').textContent = questionIndex + 1;
    document.querySelector('.progress-fill').style.width = `${((questionIndex + 1) / surveyData.questions.length) * 100}%`;
    
    // Enable/disable previous button
    document.getElementById('prev-btn').disabled = questionIndex === 0;
    
    // Update next button text for last question
    const nextBtn = document.getElementById('next-btn');
    nextBtn.textContent = questionIndex === surveyData.questions.length - 1 ? 'Submit' : 'Next';
    
    // Build the question HTML
    let questionHTML = `
        <div class="question">
            <h3>${question.text}</h3>
            <div class="options">
    `;
    
    // Add options
    question.options.forEach(option => {
        const isChecked = userResponses[question.id] === option.id ? 'checked' : '';
        questionHTML += `
            <div class="option">
                <input type="radio" id="option-${option.id}" name="q${question.id}" value="${option.id}" ${isChecked}>
                <label for="option-${option.id}">${option.text}</label>
            </div>
        `;
    });
    
    questionHTML += `
            </div>
        </div>
    `;
    
    questionContainer.innerHTML = questionHTML;
    
    // Update in-progress status
    if (surveyStartTime) {
        saveInProgressStatus();
    }
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
    // Save the current response
    const question = surveyData.questions[currentQuestion];
    const selectedOption = document.querySelector(`input[name="q${question.id}"]:checked`);
    
    if (!selectedOption) {
        showError('Please select an answer before continuing.');
        return;
    }
    
    userResponses[question.id] = selectedOption.value;
    
    // If this is the last question, submit the survey
    if (currentQuestion === surveyData.questions.length - 1) {
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
    const results = {
        optimism: 0,
        productivity: 0,
        valueOrientation: 0,
        collaboration: 0,
        generalInsight: 0
    };
    
    // Calculate scores for each category
    Object.entries(userResponses).forEach(([questionId, optionId]) => {
        const questionIndex = surveyData.questions.findIndex(q => q.id === parseInt(questionId));
        const question = surveyData.questions[questionIndex];
        const option = question.options.find(opt => opt.id === optionId);
        
        // Find which category this question belongs to
        for (const category of surveyData.categories) {
            if (category.questions.includes(parseInt(questionId))) {
                results[category.id] += option.score;
                break;
            }
        }
    });
    
    // Determine result levels for each category
    const resultLevels = {};
    Object.keys(results).forEach(category => {
        const score = results[category];
        const thresholds = surveyData.scoring.thresholds[category];
        
        if (score >= thresholds.high) {
            resultLevels[category] = 'high';
        } else if (score >= thresholds.medium) {
            resultLevels[category] = 'medium';
        } else {
            resultLevels[category] = 'low';
        }
    });
    
    // Calculate overall score
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    Object.keys(results).forEach(category => {
        totalScore += results[category];
        maxPossibleScore += surveyData.scoring.categories[category].maxScore;
    });
    
    const overallPercentage = Math.round((totalScore / maxPossibleScore) * 100);
    
    // Determine overall alignment level
    let overallAlignment;
    if (overallPercentage >= surveyData.scoring.overall.high) {
        overallAlignment = 'high';
    } else if (overallPercentage >= surveyData.scoring.overall.medium) {
        overallAlignment = 'medium';
    } else {
        overallAlignment = 'low';
    }
    
    // Store the results
    const finalResults = {
        candidateName,
        candidateEmail,
        timestamp: new Date().toISOString(),
        scores: results,
        levels: resultLevels,
        responses: userResponses,
        overallScore: {
            score: totalScore,
            maxScore: maxPossibleScore,
            percentage: overallPercentage,
            alignment: overallAlignment
        }
    };
    
    // Clear the in-progress update interval
    if (inProgressUpdateInterval) {
        clearInterval(inProgressUpdateInterval);
    }
    
    // Remove in-progress status from localStorage
    if (surveyId) {
        localStorage.removeItem(`inProgressSurvey_${surveyId}`);
    }
    
    // Try to remove in-progress status from GitHub
    if (githubAPI && appConfig && appConfig.github && appConfig.github.token && surveyId) {
        githubAPI.setToken(appConfig.github.token);
        githubAPI.removeInProgressSurvey(surveyId).catch(error => {
            console.warn('Failed to remove in-progress status from GitHub:', error);
        });
    }
    
    // Save results to localStorage as a fallback
    localStorage.setItem(`surveyResult_${candidateEmail}`, JSON.stringify(finalResults));
    
    // If GitHub API is available, save results to GitHub
    if (githubAPI && appConfig && appConfig.github && appConfig.github.token) {
        // Configure GitHub API
        githubAPI.setToken(appConfig.github.token);
        
        // Save results to GitHub
        githubAPI.saveSurveyResults(finalResults)
            .then(() => {
                console.log('Survey results saved to GitHub successfully');
            })
            .catch(error => {
                console.error('Error saving results to GitHub:', error);
                showError('Your results were saved locally, but there was an error saving to our database. Please notify the administrator.');
            });
    } else {
        console.warn('GitHub API or token not available. Results saved to localStorage only.');
    }
    
    showResults(finalResults);
}

/**
 * Display the survey results
 * @param {object} results - The calculated survey results
 */
function showResults(results) {
    questionsSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    let resultsHTML = `
        <h2>Thank You, ${results.candidateName}!</h2>
        <p>Your survey has been submitted successfully. Here's a summary of your results:</p>
        
        <div class="overall-result">
            <h3>Overall Values Alignment</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${results.overallScore.percentage}%"></div>
            </div>
            <p class="score-text">Score: ${results.overallScore.score}/${results.overallScore.maxScore} (${results.overallScore.percentage}%)</p>
            <p class="alignment-level ${results.overallScore.alignment}">
                ${results.overallScore.alignment === 'high' ? 'Strong alignment with Wild Zora values' : 
                  results.overallScore.alignment === 'medium' ? 'Moderate alignment with Wild Zora values' : 
                  'Potential misalignment with Wild Zora values'}
            </p>
        </div>
        
        <h3>Category Breakdown</h3>
        <div class="results-container">
    `;
    
    // Add each category result
    surveyData.categories.forEach(category => {
        const score = results.scores[category.id];
        const level = results.levels[category.id];
        const maxScore = surveyData.scoring.categories[category.id].maxScore;
        const interpretation = surveyData.scoring.categories[category.id].interpretation[level];
        const percentScore = (score / maxScore) * 100;
        
        resultsHTML += `
            <div class="result-category">
                <h3 class="result-title">${category.name}</h3>
                <p class="result-description">${category.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentScore}%"></div>
                </div>
                <p class="score-text">Score: ${score}/${maxScore}</p>
                <p class="interpretation">${interpretation}</p>
            </div>
        `;
    });
    
    // Add overall summary
    resultsHTML += `
        </div>
        <div class="result-summary">
            <h3>Overall Profile</h3>
            <p>Based on your responses, you show ${getStrengthDescription(results.levels)}.</p>
            <p>Thank you for completing the Wild Zora Potential Hire Survey. Your results have been recorded.</p>
        </div>
        <div class="result-actions">
            <button id="print-results" class="btn primary-btn">Print Results</button>
        </div>
    `;
    
    resultsSection.innerHTML = resultsHTML;
    
    // Add print functionality
    document.getElementById('print-results').addEventListener('click', () => {
        window.print();
    });
}

/**
 * Generate a description of the candidate's strengths based on their result levels
 * @param {object} levels - The result levels for each category
 * @returns {string} A description of the candidate's strengths
 */
function getStrengthDescription(levels) {
    const strengths = [];
    
    if (levels.optimism === 'high') {
        strengths.push('strong optimism');
    }
    
    if (levels.productivity === 'high') {
        strengths.push('high productivity');
    }
    
    if (levels.valueOrientation === 'high') {
        strengths.push('strong value orientation');
    }
    
    if (levels.collaboration === 'high') {
        strengths.push('excellent collaboration skills');
    }
    
    if (strengths.length === 0) {
        return 'areas for potential growth across all categories';
    } else if (strengths.length === 1) {
        return strengths[0];
    } else if (strengths.length === 2) {
        return `${strengths[0]} and ${strengths[1]}`;
    } else {
        const lastStrength = strengths.pop();
        return `${strengths.join(', ')}, and ${lastStrength}`;
    }
}

/**
 * Display an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());
    
    // Add the new error message
    document.body.appendChild(errorDiv);
    
    // Remove the error message after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Check if an email address is valid
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email is valid, false otherwise
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
