import { analyzeDocument } from '../../../../services/api';
import { mockApiResponse, mockHtmlApiResponse, mockTableData, DATA_SOURCE_CONFIG } from './mockData';

/**
 * Parse HTML table data from API response
 * @param {string} htmlString - HTML table string
 * @returns {Array} Parsed table data
 */
export const parseHtmlTableData = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const rows = doc.querySelectorAll('tbody tr');
  
  return Array.from(rows).map((row, index) => {
    const cells = row.querySelectorAll('td');
    return {
      id: index + 1,
      pidNumber: cells[0]?.textContent?.trim() || '',
      issueFound: cells[1]?.textContent?.trim() || '',
      actionRequired: cells[2]?.textContent?.trim() || '',
      approval: 'Not', // Default approval status
      remark: '', // Default empty remark
      status: 'Pending' // Default status
    };
  });
};

/**
 * Get analysis data based on configuration
 * @param {string} fileId - File ID for analysis
 * @param {string} projectId - Project ID
 * @param {Array} providedData - Data provided via props
 * @returns {Promise<Array>} Table data
 */
export const getAnalysisData = async (fileId = null, projectId = null, providedData = []) => {
  try {
    // If real data is provided via props, use it
    if (providedData.length > 0) {
      console.log('Using provided data from props');
      return providedData;
    }

    // Use real API when configured
    if (DATA_SOURCE_CONFIG.USE_REAL_API && fileId && projectId) {
      console.log('Fetching data from external analysis API...');
      
      try {
        const response = await analyzeDocument(fileId, projectId);
        
        if (response.success && response.data && response.data.result) {
          console.log('Successfully received data from external API');
          // Parse HTML response from API
          return parseHtmlTableData(response.data.result);
        } else {
          console.warn('Invalid API response format, falling back to mock data');
          throw new Error('Invalid API response format');
        }
      } catch (apiError) {
        console.error('External API call failed:', apiError.message);
        
        // If external API fails and we're in development, fall back to mock data
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to mock data due to API failure in development mode');
        } else {
          // In production, throw the error
          throw apiError;
        }
      }
    }

    // Use HTML data (either mock or for testing real API format)
    if (DATA_SOURCE_CONFIG.USE_HTML_DATA) {
      console.log('Using HTML data...');
      // Simulate API response structure
      const mockResponse = mockApiResponse;
      if (mockResponse.success && mockResponse.data && mockResponse.data.result) {
        return parseHtmlTableData(mockResponse.data.result);
      } else {
        // Fallback to direct HTML
        return parseHtmlTableData(mockHtmlApiResponse);
      }
    } else {
      console.log('Using structured mock data...');
      return mockTableData;
    }
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    
    // Fallback to mock data on error (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback mock data due to error in development mode');
      if (DATA_SOURCE_CONFIG.USE_HTML_DATA) {
        return parseHtmlTableData(mockHtmlApiResponse);
      } else {
        return mockTableData;
      }
    } else {
      // In production, show error state
      throw error;
    }
  }
};

/**
 * Initialize analysis - can be called when component mounts or when file changes
 * @param {string} fileId - File ID for analysis
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Table data
 */
export const initializeAnalysis = async (fileId, projectId) => {
  return await getAnalysisData(fileId, projectId);
};