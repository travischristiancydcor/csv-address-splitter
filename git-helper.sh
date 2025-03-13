#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display the menu
show_menu() {
    clear
    echo -e "${BLUE}=== Git Helper Script ===${NC}"
    echo "This script helps with common Git operations."
    echo ""
    echo "1. Check status"
    echo "2. Stage all changes"
    echo "3. Commit changes"
    echo "4. Push to GitHub"
    echo "5. Pull from GitHub"
    echo "6. View commit history"
    echo "7. Create a new branch"
    echo "8. Switch branch"
    echo "9. Merge branch"
    echo "0. Exit"
    echo ""
    echo -e "${YELLOW}Current branch:${NC} $(git branch --show-current)"
    echo ""
}

# Function to check Git status
check_status() {
    echo -e "${BLUE}=== Git Status ===${NC}"
    git status
    echo ""
    read -p "Press Enter to continue..."
}

# Function to stage all changes
stage_changes() {
    echo -e "${BLUE}=== Staging Changes ===${NC}"
    git add .
    echo -e "${GREEN}All changes staged.${NC}"
    echo ""
    read -p "Press Enter to continue..."
}

# Function to commit changes
commit_changes() {
    echo -e "${BLUE}=== Commit Changes ===${NC}"
    read -p "Enter commit message: " commit_message
    if [ -z "$commit_message" ]; then
        echo -e "${RED}Commit message cannot be empty.${NC}"
    else
        git commit -m "$commit_message"
        echo -e "${GREEN}Changes committed.${NC}"
    fi
    echo ""
    read -p "Press Enter to continue..."
}

# Function to push to GitHub
push_to_github() {
    echo -e "${BLUE}=== Push to GitHub ===${NC}"
    current_branch=$(git branch --show-current)
    echo -e "Pushing to branch: ${YELLOW}$current_branch${NC}"
    git push origin $current_branch
    echo ""
    read -p "Press Enter to continue..."
}

# Function to pull from GitHub
pull_from_github() {
    echo -e "${BLUE}=== Pull from GitHub ===${NC}"
    current_branch=$(git branch --show-current)
    echo -e "Pulling from branch: ${YELLOW}$current_branch${NC}"
    git pull origin $current_branch
    echo ""
    read -p "Press Enter to continue..."
}

# Function to view commit history
view_history() {
    echo -e "${BLUE}=== Commit History ===${NC}"
    git log --oneline --graph --decorate -n 10
    echo ""
    read -p "Press Enter to continue..."
}

# Function to create a new branch
create_branch() {
    echo -e "${BLUE}=== Create New Branch ===${NC}"
    read -p "Enter new branch name: " branch_name
    if [ -z "$branch_name" ]; then
        echo -e "${RED}Branch name cannot be empty.${NC}"
    else
        git checkout -b $branch_name
        echo -e "${GREEN}Created and switched to branch: ${YELLOW}$branch_name${NC}"
    fi
    echo ""
    read -p "Press Enter to continue..."
}

# Function to switch branch
switch_branch() {
    echo -e "${BLUE}=== Switch Branch ===${NC}"
    echo "Available branches:"
    git branch
    echo ""
    read -p "Enter branch name to switch to: " branch_name
    if [ -z "$branch_name" ]; then
        echo -e "${RED}Branch name cannot be empty.${NC}"
    else
        git checkout $branch_name
        echo -e "${GREEN}Switched to branch: ${YELLOW}$branch_name${NC}"
    fi
    echo ""
    read -p "Press Enter to continue..."
}

# Function to merge branch
merge_branch() {
    echo -e "${BLUE}=== Merge Branch ===${NC}"
    current_branch=$(git branch --show-current)
    echo "Available branches:"
    git branch
    echo ""
    read -p "Enter branch name to merge into $current_branch: " branch_name
    if [ -z "$branch_name" ]; then
        echo -e "${RED}Branch name cannot be empty.${NC}"
    else
        git merge $branch_name
        echo -e "${GREEN}Merged $branch_name into $current_branch.${NC}"
    fi
    echo ""
    read -p "Press Enter to continue..."
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [0-9]: " choice
    
    case $choice in
        1) check_status ;;
        2) stage_changes ;;
        3) commit_changes ;;
        4) push_to_github ;;
        5) pull_from_github ;;
        6) view_history ;;
        7) create_branch ;;
        8) switch_branch ;;
        9) merge_branch ;;
        0) echo "Exiting..."; exit 0 ;;
        *) echo -e "${RED}Invalid option. Please try again.${NC}"; read -p "Press Enter to continue..." ;;
    esac
done 