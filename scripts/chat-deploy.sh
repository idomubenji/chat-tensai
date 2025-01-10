#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
    echo "Error: Please provide a commit message"
    echo "Usage: chat-deploy \"your commit message\""
    exit 1
fi

# Store the commit message
COMMIT_MESSAGE="$1"

# Add all changes
git add .

# Commit with the provided message
git commit -m "$COMMIT_MESSAGE"

# Push to main branch
git push origin main

echo "✨ Deployed with message: $COMMIT_MESSAGE" 