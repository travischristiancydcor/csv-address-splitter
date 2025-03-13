#!/bin/bash

# Install dependencies
npm install

# Explicitly install vary package
npm install vary@1.1.2

# Log installed packages for debugging
echo "Installed packages:"
npm list --depth=0
