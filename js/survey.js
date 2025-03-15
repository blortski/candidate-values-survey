/**
 * Wild Zora Potential Hire Survey
 * 
 * This script handles the functionality of the candidate values survey,
 * including loading questions, collecting responses, calculating scores,
 * and displaying results.
 */

// Global variables
let surveyData = null;
let currentQuestion = 0;
let userResponses = {};
let candidateName = '';
let candidateEmail = '';

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
        const response = await fetch('/data/survey.json');
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
            showQuestions();
        }
    });
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
    
    // Add event listeners to navigation buttons
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
    if (questionIndex < 0 || questionIndex >= surveyData.questions.length) {
        return;
    }
    
    currentQuestion = questionIndex;
    const question = surveyData.questions[questionIndex];
    const questionContainer = document.getElementById('question-container');
    
    // Update progress indicator
    document.getElementById('current-question').textContent = questionIndex + 1;
    document.querySelector('.progress-fill').style.width = `${((questionIndex + 1) / surveyData.questions.length) * 100}%`;
    
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
    
    // Update button states
    document.getElementById('prev-btn').disabled = questionIndex === 0;
    const nextBtn = document.getElementById('next-btn');
    
    if (questionIndex === surveyData.questions.length - 1) {
        nextBtn.textContent = 'Submit';
    } else {
        nextBtn.textContent = 'Next';
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
    const totalScore = Object.values(results).reduce((sum, score) => sum + score, 0);
    
    // Calculate maximum possible score
    const maxPossibleScore = surveyData.categories.reduce((sum, category) => {
        return sum + (category.questions.length * 3); // Assuming max score per question is 3
    }, 0);
    
    // Calculate overall percentage
    const overallPercentage = Math.round((totalScore / maxPossibleScore) * 100);
    
    // Determine overall alignment level
    let overallAlignment = 'low';
    if (overallPercentage >= 80) {
        overallAlignment = 'high';
    } else if (overallPercentage >= 60) {
        overallAlignment = 'medium';
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
    
    // Save results locally and display them
    localStorage.setItem(`survey_result_${candidateEmail}`, JSON.stringify(finalResults));
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
    
    // Add event listener for printing
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
    const areas = [];
    
    if (levels.optimism === 'high') strengths.push('strong optimism');
    if (levels.productivity === 'high') strengths.push('excellent productivity habits');
    if (levels.valueOrientation === 'high') strengths.push('strong focus on business value');
    if (levels.collaboration === 'high') strengths.push('great collaborative skills');
    
    if (levels.optimism === 'low') areas.push('optimism');
    if (levels.productivity === 'low') areas.push('productivity habits');
    if (levels.valueOrientation === 'low') areas.push('focus on business value');
    if (levels.collaboration === 'low') areas.push('collaborative approach');
    
    let description = '';
    
    if (strengths.length > 0) {
        description += `${strengths.join(', ')}`;
    } else {
        description += 'a balanced approach across all categories';
    }
    
    if (areas.length > 0) {
        description += ` with opportunities for growth in ${areas.join(', ')}`;
    }
    
    return description;
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
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add the new error message
    const currentSection = document.querySelector('.container > main > div:not(.hidden)');
    currentSection.prepend(errorDiv);
    
    // Remove the error after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}
