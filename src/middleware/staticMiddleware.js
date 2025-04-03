const path = require('path');
const express = require('express');

/**
 * Middleware to serve static files with proper CORS headers
 * @param {string} urlPath - URL path to serve files from
 * @param {string} dirPath - Directory path on the server
 * @returns {Array} - Array of middleware functions
 */
const staticWithCors = (urlPath, dirPath) => {
  return [
    // Add CORS headers for static files
    (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    // Serve static files
    express.static(dirPath)
  ];
};

module.exports = { staticWithCors }; 