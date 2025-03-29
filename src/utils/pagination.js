/**
 * Create pagination data for responses
 * 
 * @param {Object} options - Pagination options
 * @param {number} options.page - Current page (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {number} options.total - Total number of items
 * @param {string} options.baseUrl - Base URL for pagination links (optional)
 * @returns {Object} - Pagination data for response
 */
const getPagination = ({ page = 1, limit = 10, total = 0, baseUrl = '' }) => {
  // Ensure page and limit are numbers
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  
  // Ensure page and limit are valid
  page = page < 1 ? 1 : page;
  limit = limit < 1 ? 10 : (limit > 100 ? 100 : limit);
  
  // Calculate pagination
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  const result = {
    page,
    limit,
    total,
    totalPages,
    offset,
    hasNextPage,
    hasPrevPage
  };
  
  // Add links if base URL is provided
  if (baseUrl) {
    result.links = {
      self: `${baseUrl}?page=${page}&limit=${limit}`
    };
    
    if (hasNextPage) {
      result.links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    }
    
    if (hasPrevPage) {
      result.links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    }
    
    result.links.first = `${baseUrl}?page=1&limit=${limit}`;
    
    if (totalPages > 0) {
      result.links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;
    }
  }
  
  return result;
};

/**
 * Get sequelize pagination parameters from request query
 * 
 * @param {Object} query - Express request query object
 * @param {number} [query.page] - Page number (default: 1)
 * @param {number} [query.limit] - Items per page (default: 10)
 * @returns {Object} - Sequelize pagination parameters (limit, offset)
 */
const getPaginationParams = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  
  return {
    limit: limit > 100 ? 100 : (limit < 1 ? 10 : limit),
    offset: (page < 1 ? 0 : page - 1) * limit
  };
};

module.exports = {
  getPagination,
  getPaginationParams
}; 