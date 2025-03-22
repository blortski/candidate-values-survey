/**
 * Configuration for the Candidate Values Survey application
 */

const config = {
    // GitHub configuration
    github: {
        owner: 'blortski',                  // GitHub username
        repo: 'candidate-values-survey',    // Repository name
        branch: 'main',                     // Branch name
        resultsPath: 'data/results',        // Path to store results
        token: ''                           // GitHub Personal Access Token (to be set from localStorage)
    },
    
    // Admin configuration
    admin: {
        password: 'WildZora2025'            // Admin dashboard password
    },
    
    // Application version
    version: 'v1.9.7'
};

// Export the configuration
const appConfig = config;

// Try to load GitHub token from localStorage if in browser environment
if (typeof window !== 'undefined' && window.localStorage) {
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
        appConfig.github.token = storedToken;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = appConfig;
}
