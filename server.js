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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), err => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

app.get('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'script.js'), err => {
    if (err) {
      console.error('Error sending script.js:', err);
      res.status(500).send('Error loading script');
    }
  });
});

app.get('/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'styles.css'), err => {
    if (err) {
      console.error('Error sending styles.css:', err);
      res.status(500).send('Error loading styles');
    }
  });
});

// Serve the Web Worker file
app.get('/csvWorker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'csvWorker.js'), err => {
    if (err) {
      console.error('Error sending csvWorker.js:', err);
      res.status(500).send('Error loading worker script');
    }
  });
});

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
  try {
    // Read from .env file or use defaults
    const config = {
      apiVersion: process.env.API_VERSION || 'test',
      apiToken: process.env.API_TOKEN || ''
    };
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Error handling for 404
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).send('Not Found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
}); 