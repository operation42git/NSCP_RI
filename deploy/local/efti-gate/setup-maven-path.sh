#!/usr/bin/env bash

# Add Maven to PATH for Git Bash
# This script adds Maven to the current session's PATH

# Maven installed via Scoop
MAVEN_HOME="/c/Users/opera/scoop/apps/maven/current"
export PATH="$MAVEN_HOME/bin:$PATH"

# Verify Maven is available
if command -v mvn &> /dev/null; then
    echo "Maven is now available: $(mvn -version | head -n 1)"
else
    echo "Warning: Maven not found. Please check your installation."
fi







