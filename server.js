require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Add detailed error logging
console.log('Starting server...');
console.log(`Node environment: ${process.env.NODE_ENV}`);
console.log(`Current directory: ${__dirname}`);

// Enable CORS with more options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies with size limit
app.use(express.json({ limit: '10mb' }));

// Set proper MIME types
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.css') {
    res.type('text/css');
  } else if (ext === '.js') {
    res.type('application/javascript');
  } else if (ext === '.html') {
    res.type('text/html');
  }
  next();
});

// Serve static files from public directory with explicit caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.html') {
      // No cache for HTML files
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Explicit routes for static files with error handling
app.get('/styles.css', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'styles.css');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`styles.css not found at ${filePath}`);
      res.status(404).send('CSS file not found');
    }
  } catch (error) {
    console.error('Error serving styles.css:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/script.js', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'script.js');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`script.js not found at ${filePath}`);
      res.status(404).send('JavaScript file not found');
    }
  } catch (error) {
    console.error('Error serving script.js:', error);
    res.status(500).send('Internal server error');
  }
});

// API endpoint to get config with improved error handling
app.get('/api/config', (req, res) => {
  try {
    // Get API token and version from environment variables with fallbacks
    const apiToken = process.env.BUBBLE_API_TOKEN || '9d68fe22933950e82082ce92b10ca711';
    const apiVersion = process.env.BUBBLE_API_VERSION || 'test';
    
    console.log(`API config requested. Using version: ${apiVersion}`);
    console.log(`Token length: ${apiToken.length} characters`);
    
    res.json({
      apiToken: apiToken,
      apiVersion: apiVersion
    });
  } catch (error) {
    console.error('Error in /api/config endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes with improved error handling
app.get('*', (req, res) => {
  try {
    console.log(`Serving index.html for path: ${req.path}`);
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    // Check if the file exists
    if (fs.existsSync(indexPath)) {
      console.log(`index.html found at ${indexPath}`);
      res.sendFile(indexPath);
    } else {
      console.error(`Index file not found at ${indexPath}`);
      // Try to list the directory contents for debugging
      try {
        const dirContents = fs.readdirSync(path.join(__dirname, 'public'));
        console.error(`Directory contents: ${dirContents.join(', ')}`);
      } catch (dirError) {
        console.error(`Could not read directory: ${dirError.message}`);
      }
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal server error: ' + error.message);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Something broke!');
});

// For Vercel serverless functions, we need to export the app
module.exports = app;

// Only start the server if not running in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} 