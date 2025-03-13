const { readFileSync } = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Log the request
    console.log(`Request received: ${req.method} ${req.url}`);
    
    // Serve index.html for the root path
    if (req.url === '/' || req.url === '') {
      const indexPath = path.join(__dirname, '..', 'index.html');
      const content = readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.end(content);
    }
    
    // Serve script.js
    if (req.url === '/script.js') {
      const scriptPath = path.join(__dirname, '..', 'script.js');
      const content = readFileSync(scriptPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(content);
    }
    
    // Serve styles.css
    if (req.url === '/styles.css') {
      const stylePath = path.join(__dirname, '..', 'styles.css');
      const content = readFileSync(stylePath, 'utf8');
      res.setHeader('Content-Type', 'text/css');
      return res.end(content);
    }
    
    // Serve csvWorker.js
    if (req.url === '/csvWorker.js') {
      const workerPath = path.join(__dirname, '..', 'public', 'csvWorker.js');
      const content = readFileSync(workerPath, 'utf8');
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(content);
    }
    
    // API endpoint for configuration
    if (req.url === '/api/config') {
      const config = {
        apiVersion: process.env.API_VERSION || 'test',
        apiToken: process.env.API_TOKEN || '',
        apiKey: process.env.API_KEY || ''
      };
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(config));
    }
    
    // 404 for everything else
    res.statusCode = 404;
    return res.end('Not Found');
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    return res.end('Internal Server Error');
  }
}; 