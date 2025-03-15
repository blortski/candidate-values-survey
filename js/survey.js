/**
 * Wild Zora Candidate Values Survey
 * 
 * This script handles the functionality of the candidate values survey,
 * including loading questions, collecting responses, calculating scores,
 * and displaying results.
 * 
 * Version: v1.0.10
 */

// Global variables
let surveyData = null;
let currentQuestion = 0;
let userResponses = {};
let candidateName = '';
let candidateEmail = '';

// Initialize the survey when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Load survey data
    initializeSurvey();
    
    // Add event listener to start button
    const startButton = document.getElementById('start-survey');
    if (startButton) {
        console.log('Start button found, adding event listener');
        startButton.addEventListener('click', function() {
            console.log('Start button clicked');
            startSurvey();
        });
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
 * Initialize the survey by loading the survey data
 */
async function initializeSurvey() {
    try {
        console.log('Initializing survey...');
        const response = await fetch('./data/survey.json');
        if (!response.ok) {
            throw new Error(`Failed to load survey data: ${response.status} ${response.statusText}`);
        }
        surveyData = await response.json();
        console.log('Survey data loaded successfully:', surveyData);
    } catch (error) {
        console.error('Error loading survey data:', error);
        showError('Failed to load survey. Please refresh the page and try again.');
    }
}

/**
 * Start the survey by collecting candidate information
 */
function startSurvey() {
    console.log('Start survey function called');
    
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
                showQuestions();
            }
        });
    } else {
        console.error('Candidate info form not found');
    }
}

/**
 * Display the questions section and show the first question
 */
function showQuestions() {
    console.log('Showing questions');
    
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
    if (!surveyData || !surveyData.questions) {
        console.error('Survey data not loaded');
        return;
    }
    
    if (questionIndex < 0 || questionIndex >= surveyData.questions.length) {
        console.error('Invalid question index:', questionIndex);
        return;
    }
    
    currentQuestion = questionIndex;
    const question = surveyData.questions[questionIndex];
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
        progressFill.style.width = `${((questionIndex + 1) / surveyData.questions.length) * 100}%`;
    }
    
    // Update button states
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = questionIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.textContent = questionIndex === surveyData.questions.length - 1 ? 'Submit' : 'Next';
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
    if (!surveyData || !surveyData.questions) {
        console.error('Survey data not loaded');
        return;
    }
    
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
    console.log('Calculating results');
    
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
        
        if (option && option.score !== undefined) {
            // Find which category this question belongs to
            for (const category of surveyData.categories) {
                if (category.questions.includes(parseInt(questionId))) {
                    results[category.id] += option.score;
                    break;
                }
            }
        }
    });
    
    // Calculate percentage scores
    const maxScores = {
        optimism: 21,         // 7 questions, max score 3 per question
        productivity: 21,      // 7 questions, max score 3 per question
        valueOrientation: 21,  // 7 questions, max score 3 per question
        collaboration: 21,     // 7 questions, max score 3 per question
        generalInsight: 6      // 2 questions, max score 3 per question
    };
    
    const percentageResults = {};
    Object.keys(results).forEach(category => {
        percentageResults[category] = Math.round((results[category] / maxScores[category]) * 100);
    });
    
    // Calculate overall score (average of all categories)
    const overallScore = Math.round(
        Object.values(percentageResults).reduce((sum, score) => sum + score, 0) / 
        Object.keys(percentageResults).length
    );
    
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
