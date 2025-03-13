#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== GitHub Repository Setup ===${NC}"
echo "This script will help you set up a GitHub repository for your project."
echo ""

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo -e "${GREEN}GitHub CLI detected!${NC}"
    echo "We can use it to create a repository directly from the command line."
    
    # Check if user is logged in to GitHub CLI
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}You need to log in to GitHub CLI first.${NC}"
        echo "Running 'gh auth login'..."
        gh auth login
    fi
    
    # Ask for repository name
    read -p "Enter repository name (default: csv-address-splitter): " repo_name
    repo_name=${repo_name:-csv-address-splitter}
    
    # Ask for repository description
    read -p "Enter repository description (default: CSV Address Splitter & Lead Uploader): " repo_description
    repo_description=${repo_description:-"CSV Address Splitter & Lead Uploader"}
    
    # Ask if repository should be private
    read -p "Make repository private? (y/N): " private_choice
    private_option=""
    if [[ $private_choice =~ ^[Yy]$ ]]; then
        private_option="--private"
    else
        private_option="--public"
    fi
    
    # Create the repository
    echo -e "${GREEN}Creating GitHub repository: $repo_name${NC}"
    gh repo create "$repo_name" --description "$repo_description" $private_option --source=. --remote=origin --push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Repository created and code pushed successfully!${NC}"
        echo "Your code is now available on GitHub."
        
        # Get the repository URL
        repo_url=$(gh repo view --json url -q .url)
        echo -e "Repository URL: ${YELLOW}$repo_url${NC}"
    else
        echo -e "${RED}Failed to create repository.${NC}"
        echo "Please try the manual method below."
    fi
else
    echo -e "${YELLOW}GitHub CLI not found.${NC}"
    echo "You'll need to create a repository manually on GitHub and connect it to your local repository."
    echo ""
    echo "Follow these steps:"
    echo "1. Go to https://github.com/new"
    echo "2. Enter 'csv-address-splitter' as the repository name"
    echo "3. Add a description (e.g., 'CSV Address Splitter & Lead Uploader')"
    echo "4. Choose public or private"
    echo "5. Do NOT initialize with README, .gitignore, or license"
    echo "6. Click 'Create repository'"
    echo ""
    echo "After creating the repository, run these commands in your terminal:"
    echo -e "${YELLOW}git remote add origin https://github.com/YOUR-USERNAME/csv-address-splitter.git${NC}"
    echo -e "${YELLOW}git branch -M main${NC}"
    echo -e "${YELLOW}git push -u origin main${NC}"
    echo ""
    echo "Replace 'YOUR-USERNAME' with your GitHub username."
fi

echo ""
echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Make changes to your code"
echo "2. Stage changes: git add ."
echo "3. Commit changes: git commit -m 'Description of changes'"
echo "4. Push to GitHub: git push" 