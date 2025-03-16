/**
 * GitHub API utility for the Candidate Values Survey
 * Handles saving and retrieving survey results to/from GitHub
 */

class GitHubAPI {
    constructor(config) {
        this.owner = config.owner;
        this.repo = config.repo;
        this.branch = config.branch;
        this.resultsPath = config.resultsPath;
        this.token = config.token || '';
        this.baseUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents`;
    }
    
    /**
     * Set the GitHub token
     * @param {string} token - GitHub Personal Access Token
     */
    setToken(token) {
        this.token = token;
    }
    
    /**
     * Check if the API is properly configured
     * @returns {boolean} - True if configured, false otherwise
     */
    isConfigured() {
        return !!this.token;
    }
    
    /**
     * Test GitHub API access with the current token
     * @returns {Promise<boolean>} - True if access is successful, false otherwise
     */
    async testAccess() {
        console.log('GitHubAPI.testAccess: Testing GitHub API access...');
        
        if (!this.isConfigured()) {
            console.error('GitHubAPI.testAccess: GitHub API is not configured. Please set a token.');
            return false;
        }
        
        try {
            // Test access by trying to get the repository details
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!response.ok) {
                console.error(`GitHubAPI.testAccess: Failed to access GitHub API. Status: ${response.status}`);
                return false;
            }
            
            console.log('GitHubAPI.testAccess: GitHub API access successful');
            return true;
        } catch (error) {
            console.error('GitHubAPI.testAccess: Error testing GitHub API access:', error);
            return false;
        }
    }
    
    /**
     * Get all surveys from GitHub
     * @returns {Promise<Array>} Array of survey results
     */
    async getAllSurveys() {
        console.log('GitHubAPI.getAllSurveys: Fetching all surveys...');
        
        try {
            // Get all files in the results directory
            const response = await fetch(`${this.baseUrl}/${this.resultsPath}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!response.ok) {
                console.error(`GitHubAPI.getAllSurveys: Failed to fetch surveys. Status: ${response.status}`);
                return [];
            }
            
            const data = await response.json();
            console.log(`GitHubAPI.getAllSurveys: Found ${data.length} files in the results directory`);
            
            // Filter out non-JSON files and directories
            const jsonFiles = data.filter(file => 
                file.type === 'file' && 
                file.name.endsWith('.json') && 
                file.name !== 'values.json'
            );
            
            console.log(`GitHubAPI.getAllSurveys: Found ${jsonFiles.length} JSON files (excluding values.json)`);
            
            // Get content of each JSON file
            const surveys = [];
            for (const file of jsonFiles) {
                try {
                    console.log(`GitHubAPI.getAllSurveys: Fetching content for ${file.name}...`);
                    
                    const fileResponse = await fetch(file.download_url, {
                        headers: {
                            'Authorization': `token ${this.token}`
                        }
                    });
                    
                    if (!fileResponse.ok) {
                        console.error(`GitHubAPI.getAllSurveys: Failed to fetch content for ${file.name}. Status: ${fileResponse.status}`);
                        continue;
                    }
                    
                    const survey = await fileResponse.json();
                    
                    // Add file name (without .json extension) as id
                    survey.id = file.name.replace('.json', '');
                    
                    // If status is not defined, determine it based on final_score
                    if (!survey.status) {
                        survey.status = survey.final_score !== undefined && survey.final_score !== null 
                            ? 'completed' 
                            : 'in_progress';
                    }
                    
                    surveys.push(survey);
                } catch (error) {
                    console.error(`GitHubAPI.getAllSurveys: Error processing ${file.name}:`, error);
                }
            }
            
            console.log(`GitHubAPI.getAllSurveys: Successfully processed ${surveys.length} surveys`);
            return surveys;
        } catch (error) {
            console.error('GitHubAPI.getAllSurveys: Error fetching surveys:', error);
            return [];
        }
    }

    /**
     * Save survey to GitHub
     * @param {Object} survey Survey data
     * @returns {Promise<boolean>} Success status
     */
    async saveSurvey(survey) {
        console.log('GitHubAPI.saveSurvey: Saving survey...');
        
        try {
            // Generate a unique ID for the survey if not provided
            if (!survey.id) {
                const timestamp = new Date().toISOString().replace(/:/g, '-');
                const email = survey.email ? survey.email.replace(/[@.]/g, '_') : 'anonymous';
                survey.id = `${timestamp}_${email}`;
            }
            
            // Set the status based on whether the survey is completed
            survey.status = survey.final_score !== undefined && survey.final_score !== null 
                ? 'completed' 
                : 'in_progress';
            
            // Set timestamp if not already set
            if (!survey.timestamp) {
                survey.timestamp = new Date().toISOString();
            }
            
            // Convert survey to JSON
            const content = JSON.stringify(survey, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Check if file already exists
            let sha = null;
            try {
                const fileResponse = await fetch(`${this.baseUrl}/${this.resultsPath}/${survey.id}.json?ref=${this.branch}`, {
                    headers: {
                        'Authorization': `token ${this.token}`
                    }
                });
                
                if (fileResponse.ok) {
                    const fileData = await fileResponse.json();
                    sha = fileData.sha;
                    console.log(`GitHubAPI.saveSurvey: Existing file found with SHA: ${sha}`);
                }
            } catch (error) {
                console.log('GitHubAPI.saveSurvey: File does not exist yet, will create new file');
            }
            
            // Prepare request body
            const body = {
                message: `${survey.status === 'completed' ? 'Completed' : 'In-progress'} survey: ${survey.id}`,
                content: encodedContent,
                branch: this.branch
            };
            
            // Add SHA if file exists (update instead of create)
            if (sha) {
                body.sha = sha;
            }
            
            // Save the file
            const saveResponse = await fetch(`${this.baseUrl}/${this.resultsPath}/${survey.id}.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!saveResponse.ok) {
                console.error(`GitHubAPI.saveSurvey: Failed to save survey. Status: ${saveResponse.status}`);
                return false;
            }
            
            console.log(`GitHubAPI.saveSurvey: Survey saved successfully with status: ${survey.status}`);
            return true;
        } catch (error) {
            console.error('GitHubAPI.saveSurvey: Error saving survey:', error);
            return false;
        }
    }
    
    /**
     * Delete a survey from GitHub
     * @param {string} surveyId - ID of the survey to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteSurvey(surveyId) {
        console.log(`GitHubAPI.deleteSurvey: Deleting survey with ID: ${surveyId}`);
        
        try {
            // Check if file exists and get its SHA
            const fileResponse = await fetch(`${this.baseUrl}/${this.resultsPath}/${surveyId}.json?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!fileResponse.ok) {
                console.error(`GitHubAPI.deleteSurvey: Survey not found. Status: ${fileResponse.status}`);
                return false;
            }
            
            const fileData = await fileResponse.json();
            const sha = fileData.sha;
            
            // Delete the file
            const deleteResponse = await fetch(`${this.baseUrl}/${this.resultsPath}/${surveyId}.json`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Delete survey: ${surveyId}`,
                    sha: sha,
                    branch: this.branch
                })
            });
            
            if (!deleteResponse.ok) {
                console.error(`GitHubAPI.deleteSurvey: Failed to delete survey. Status: ${deleteResponse.status}`);
                return false;
            }
            
            console.log(`GitHubAPI.deleteSurvey: Survey deleted successfully: ${surveyId}`);
            return true;
        } catch (error) {
            console.error('GitHubAPI.deleteSurvey: Error deleting survey:', error);
            return false;
        }
    }
    
    /**
     * Get survey data from GitHub
     * @returns {Promise<Object>} - Promise resolving to the survey data
     */
    async getSurveyData() {
        try {
            const fileData = await this.getFileContent('data/survey.json');
            return JSON.parse(atob(fileData.content));
        } catch (error) {
            console.error('Error getting survey data from GitHub:', error);
            throw error;
        }
    }

    /**
     * Get values data from GitHub
     * @returns {Promise<Object>} - Promise resolving to the values data
     */
    async getValuesData() {
        try {
            const fileData = await this.getFileContent('data/values.json');
            return JSON.parse(atob(fileData.content));
        } catch (error) {
            console.error('Error getting values data from GitHub:', error);
            throw error;
        }
    }

    /**
     * Save values data to GitHub
     * @param {Object} valuesData - Values data to save
     * @returns {Promise<Object>} - Promise resolving to the API response
     */
    async saveValuesData(valuesData) {
        try {
            // Get current file to get the SHA
            let sha = null;
            try {
                const fileData = await this.getFileContent('data/values.json');
                sha = fileData.sha;
            } catch (error) {
                // File might not exist yet, which is fine
                console.warn('Could not get current values.json file:', error);
            }

            // Prepare the file content
            const content = btoa(JSON.stringify(valuesData, null, 2));
            
            // Create or update the file
            const response = await this.createOrUpdateFile(
                'data/values.json',
                'Update values data',
                content,
                sha
            );
            
            return response;
        } catch (error) {
            console.error('Error saving values data to GitHub:', error);
            throw error;
        }
    }

    /**
     * Get file content by path
     * @param {string} path - Path to the file
     * @returns {Promise<Object>} - Promise resolving to the file data
     */
    async getFileContent(path) {
        if (!this.isConfigured()) {
            throw new Error('GitHub API is not configured. Please set a token.');
        }
        
        try {
            // Get file content
            const response = await fetch(`${this.baseUrl}/${path}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting file content from GitHub:', error);
            throw error;
        }
    }

    /**
     * Create or update a file on GitHub
     * @param {string} path - Path to the file
     * @param {string} message - Commit message
     * @param {string} content - File content (base64 encoded)
     * @param {string} sha - SHA of the file (optional)
     * @returns {Promise<Object>} - Promise resolving to the API response
     */
    async createOrUpdateFile(path, message, content, sha) {
        const data = {
            message,
            content,
            branch: this.branch
        };
        
        if (sha) {
            data.sha = sha;
        }
        
        const response = await fetch(`${this.baseUrl}/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API error: ${errorData.message}`);
        }
        
        return await response.json();
    }
}

// Create GitHub API instance if in browser environment
const githubAPI = typeof window !== 'undefined' ? new GitHubAPI(appConfig.github) : null;

// If in browser environment, add a method to check localStorage for token on initialization
if (typeof window !== 'undefined' && githubAPI) {
    // Initialize token from localStorage if available
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
        githubAPI.setToken(storedToken);
    }
}
