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
        token: '',                          // GitHub Personal Access Token (to be set)
        defaultToken: 'YOUR_GITHUB_TOKEN'   // Default token (replace with actual token)
    },
    
    // Admin configuration
    admin: {
        password: 'WildZora2025'            // Admin dashboard password
    },
    
    // Application version
    version: 'v1.0.5'
};

// Export the configuration
const appConfig = config;
