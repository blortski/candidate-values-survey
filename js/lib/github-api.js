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
     * Save survey results to GitHub
     * @param {Object} results - Survey results object
     * @returns {Promise<Object>} - Promise resolving to the API response
     */
    async saveSurveyResults(results) {
        if (!this.isConfigured()) {
            throw new Error('GitHub API is not configured. Please set a token.');
        }
        
        // Create a unique filename based on timestamp and email
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const email = results.candidateEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${timestamp}_${email}.json`;
        const path = `${this.resultsPath}/${filename}`;
        
        // Convert results to JSON string
        const content = JSON.stringify(results, null, 2);
        
        // Encode content to base64
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        
        // Prepare request data
        const data = {
            message: `Add survey results for ${results.candidateName}`,
            content: base64Content,
            branch: this.branch
        };
        
        // Send request to GitHub API
        try {
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
        } catch (error) {
            console.error('Error saving survey results to GitHub:', error);
            throw error;
        }
    }
    
    /**
     * Get all survey results from GitHub
     * @returns {Promise<Array>} - Promise resolving to an array of survey results
     */
    async getAllSurveyResults() {
        if (!this.isConfigured()) {
            throw new Error('GitHub API is not configured. Please set a token.');
        }
        
        try {
            // Get directory contents
            const response = await fetch(`${this.baseUrl}/${this.resultsPath}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            
            const files = await response.json();
            
            // Filter out non-JSON files and README
            const jsonFiles = files.filter(file => 
                file.type === 'file' && 
                file.name.endsWith('.json') && 
                file.name !== 'README.md'
            );
            
            // Get content of each file
            const resultsPromises = jsonFiles.map(async file => {
                const fileResponse = await fetch(file.download_url);
                if (!fileResponse.ok) {
                    throw new Error(`Failed to download file: ${file.name}`);
                }
                return await fileResponse.json();
            });
            
            return await Promise.all(resultsPromises);
        } catch (error) {
            console.error('Error getting survey results from GitHub:', error);
            throw error;
        }
    }
    
    /**
     * Save in-progress survey information to GitHub
     * @param {Object} surveyInfo - Information about the in-progress survey
     * @returns {Promise<Object>} - Promise resolving to the API response
     */
    async saveInProgressSurvey(surveyInfo) {
        if (!this.isConfigured()) {
            throw new Error('GitHub API is not configured. Please set a token.');
        }
        
        // Create a unique identifier for the in-progress survey
        const id = surveyInfo.id || `${Date.now()}_${surveyInfo.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        surveyInfo.id = id;
        
        // Path for in-progress surveys
        const path = `${this.resultsPath}/in-progress/${id}.json`;
        
        // Convert data to JSON string
        const content = JSON.stringify(surveyInfo, null, 2);
        
        // Encode content to base64
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        
        // Prepare request data
        const data = {
            message: `Update in-progress survey for ${surveyInfo.name}`,
            content: base64Content,
            branch: this.branch
        };
        
        // Check if file already exists
        try {
            const checkResponse = await fetch(`${this.baseUrl}/${path}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            // If file exists, include its SHA in the request
            if (checkResponse.ok) {
                const fileData = await checkResponse.json();
                data.sha = fileData.sha;
            }
            
            // Send request to GitHub API
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
        } catch (error) {
            console.error('Error saving in-progress survey to GitHub:', error);
            throw error;
        }
    }
    
    /**
     * Get in-progress surveys from GitHub
     * @returns {Promise<Array>} - Promise resolving to an array of in-progress surveys
     */
    async getInProgressSurveys() {
        if (!this.isConfigured()) {
            throw new Error('GitHub API is not configured. Please set a token.');
        }
        
        try {
            // Create in-progress directory if it doesn't exist
            try {
                await this.ensureInProgressDirectory();
            } catch (error) {
                console.warn('Error ensuring in-progress directory exists:', error);
                // Continue anyway, as the directory might already exist
            }
            
            // Get directory contents
            const response = await fetch(`${this.baseUrl}/${this.resultsPath}/in-progress?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!response.ok) {
                // If directory doesn't exist, return empty array
                if (response.status === 404) {
                    return [];
                }
                
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            
            const files = await response.json();
            
            // Filter out non-JSON files and README
            const jsonFiles = files.filter(file => 
                file.type === 'file' && 
                file.name.endsWith('.json') &&
                file.name !== 'README.md'
            );
            
            console.log('Found in-progress survey files:', jsonFiles);
            
            // Return the file metadata directly
            return jsonFiles;
        } catch (error) {
            console.error('Error getting in-progress surveys from GitHub:', error);
            // Return empty array in case of error
            return [];
        }
    }
    
    /**
     * Delete an in-progress survey from GitHub
     * @param {string} id - ID of the in-progress survey to delete
     * @returns {Promise<Object>} - Promise resolving to the API response
     */
    async deleteInProgressSurvey(id) {
        if (!this.isConfigured()) {
            throw new Error('GitHub API is not configured. Please set a token.');
        }
        
        const path = `${this.resultsPath}/in-progress/${id}.json`;
        
        try {
            // Get file SHA
            const fileResponse = await fetch(`${this.baseUrl}/${path}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });
            
            if (!fileResponse.ok) {
                if (fileResponse.status === 404) {
                    // File doesn't exist, nothing to delete
                    return { deleted: false, message: 'File not found' };
                }
                
                const errorData = await fileResponse.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            
            const fileData = await fileResponse.json();
            
            // Delete file
            const deleteResponse = await fetch(`${this.baseUrl}/${path}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Remove in-progress survey ${id}`,
                    sha: fileData.sha,
                    branch: this.branch
                })
            });
            
            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            
            return await deleteResponse.json();
        } catch (error) {
            console.error('Error removing in-progress survey from GitHub:', error);
            throw error;
        }
    }
    
    /**
     * Ensure the in-progress directory exists
     * @returns {Promise<void>}
     */
    async ensureInProgressDirectory() {
        // Check if directory exists
        const response = await fetch(`${this.baseUrl}/${this.resultsPath}/in-progress?ref=${this.branch}`, {
            headers: {
                'Authorization': `token ${this.token}`
            }
        });
        
        // If directory doesn't exist, create it with a README
        if (response.status === 404) {
            const readmeContent = `# In-Progress Surveys\n\nThis directory contains information about surveys that are currently in progress.\n\nFiles are automatically managed by the application.`;
            const base64Content = btoa(unescape(encodeURIComponent(readmeContent)));
            
            await fetch(`${this.baseUrl}/${this.resultsPath}/in-progress/README.md`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Create in-progress surveys directory',
                    content: base64Content,
                    branch: this.branch
                })
            });
        }
    }
    
    /**
     * Get survey data from GitHub
     * @returns {Promise<Object>} - Promise resolving to the survey data
     */
    async getSurveyData() {
        try {
            const response = await this.getFileContent('data/survey.json');
            return JSON.parse(atob(response.content));
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
            const response = await this.getFileContent('data/values.json');
            return JSON.parse(atob(response.content));
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
                const currentFile = await this.getFileContent('data/values.json');
                sha = currentFile.sha;
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
     * @returns {Promise<Object>} - Promise resolving to the file content
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
            
            const fileData = await response.json();
            
            // Decode content
            const content = atob(fileData.content);
            
            // Parse JSON content
            return JSON.parse(content);
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

    /**
     * Get in-progress and completed surveys from the surveys index file
     * @returns {Promise<Object>} - Promise resolving to an object with inProgressSurveys and completedSurveys
     */
    async getInProgressAndCompletedSurveys() {
        try {
            const response = await this.getFileContent('data/surveys_index.json');
            const surveysIndex = JSON.parse(atob(response.content));
            
            // Separate into in-progress and completed surveys
            const inProgressSurveys = surveysIndex.filter(survey => !survey.completed);
            const completedSurveys = surveysIndex.filter(survey => survey.completed);
            
            return { inProgressSurveys, completedSurveys };
        } catch (error) {
            console.error('Error getting surveys index:', error);
            throw error;
        }
    }
}

// Create GitHub API instance if in browser environment
const githubAPI = typeof window !== 'undefined' ? new GitHubAPI(appConfig.github) : null;

// If in browser environment, add a method to check localStorage for token on initialization
if (typeof window !== 'undefined' && githubAPI) {
    // Initialize token from localStorage if available
    const storedToken = localStorage.getItem('wildZora_githubToken');
    if (storedToken) {
        githubAPI.setToken(storedToken);
    }
}
