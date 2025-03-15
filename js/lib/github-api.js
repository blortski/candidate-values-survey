/**
 * GitHub API Utility for Candidate Values Survey
 * 
 * This utility provides functions to save and retrieve survey results using GitHub's API.
 * Survey results are stored as JSON files in a 'data/results' directory in the repository.
 */

class GitHubAPI {
    constructor(options = {}) {
        this.owner = options.owner || 'blortski';
        this.repo = options.repo || 'candidate-values-survey';
        this.branch = options.branch || 'main';
        this.resultsPath = options.resultsPath || 'data/results';
        this.token = options.token || '';
    }

    /**
     * Set the GitHub Personal Access Token
     * @param {string} token - GitHub Personal Access Token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Save a survey result to GitHub
     * @param {object} result - The survey result to save
     * @returns {Promise} - A promise that resolves when the result is saved
     */
    async saveSurveyResult(result) {
        if (!this.token) {
            throw new Error('GitHub token not set. Please set a token before saving results.');
        }

        try {
            // Create a unique filename based on timestamp and email
            const timestamp = new Date(result.timestamp).getTime();
            const sanitizedEmail = result.candidateEmail.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `${timestamp}_${sanitizedEmail}.json`;
            const path = `${this.resultsPath}/${filename}`;
            
            // Convert result to JSON string
            const content = JSON.stringify(result, null, 2);
            
            // Encode content to base64
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Check if the results directory exists, create if not
            await this._ensureResultsDirectoryExists();
            
            // Create the file in the repository
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Add survey result for ${result.candidateName}`,
                    content: encodedContent,
                    branch: this.branch
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to save survey result: ${error.message}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving survey result to GitHub:', error);
            throw error;
        }
    }

    /**
     * Get all survey results from GitHub
     * @returns {Promise<Array>} - A promise that resolves to an array of survey results
     */
    async getAllSurveyResults() {
        try {
            // Get the contents of the results directory
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.resultsPath}?ref=${this.branch}`);
            
            if (!response.ok) {
                // If directory doesn't exist yet, return empty array
                if (response.status === 404) {
                    return [];
                }
                const error = await response.json();
                throw new Error(`Failed to get survey results: ${error.message}`);
            }
            
            const files = await response.json();
            
            // If no files or not an array, return empty array
            if (!files || !Array.isArray(files)) {
                return [];
            }
            
            // Fetch the content of each file
            const results = await Promise.all(
                files.map(async (file) => {
                    const fileResponse = await fetch(file.download_url);
                    if (!fileResponse.ok) {
                        console.error(`Failed to fetch file: ${file.name}`);
                        return null;
                    }
                    return await fileResponse.json();
                })
            );
            
            // Filter out any null results and return
            return results.filter(result => result !== null);
        } catch (error) {
            console.error('Error getting survey results from GitHub:', error);
            // Return empty array on error to prevent app from breaking
            return [];
        }
    }

    /**
     * Ensure the results directory exists in the repository
     * @private
     */
    async _ensureResultsDirectoryExists() {
        try {
            // Check if the directory exists
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.resultsPath}?ref=${this.branch}`);
            
            // If directory exists, return
            if (response.ok) {
                return;
            }
            
            // If error is not 404 (Not Found), throw error
            if (response.status !== 404) {
                const error = await response.json();
                throw new Error(`Failed to check if results directory exists: ${error.message}`);
            }
            
            // Create a placeholder file to create the directory
            const placeholderContent = '# Survey Results\n\nThis directory contains survey results submitted by candidates.';
            const encodedContent = btoa(unescape(encodeURIComponent(placeholderContent)));
            
            const createResponse = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.resultsPath}/README.md`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Create survey results directory',
                    content: encodedContent,
                    branch: this.branch
                })
            });
            
            if (!createResponse.ok) {
                const error = await createResponse.json();
                throw new Error(`Failed to create results directory: ${error.message}`);
            }
        } catch (error) {
            console.error('Error ensuring results directory exists:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const githubAPI = new GitHubAPI();
