# Git Bash Maven Setup

## Problem
Git Bash doesn't have access to Maven because it's installed via Scoop and not in the Git Bash PATH.

## Solution

I've created a modified deploy script that includes Maven PATH setup. Use this instead:

### Option 1: Use the Modified Deploy Script (Recommended)

```bash
cd deploy/local/efti-gate
chmod +x deploy-with-maven.sh
./deploy-with-maven.sh skip-tests
```

### Option 2: Add Maven to Git Bash PATH Permanently

Add this to your `~/.bashrc` or `~/.bash_profile` file in Git Bash:

```bash
# Add Maven to PATH
export MAVEN_HOME="/c/Users/opera/scoop/apps/maven/current"
export PATH="$MAVEN_HOME/bin:$PATH"
```

Then reload your bash profile:
```bash
source ~/.bashrc
# or
source ~/.bash_profile
```

### Option 3: Set PATH in Current Session

Before running the original deploy script, run:

```bash
export MAVEN_HOME="/c/Users/opera/scoop/apps/maven/current"
export PATH="$MAVEN_HOME/bin:$PATH"
./deploy.sh skip-tests
```

## Verify Maven is Working

After setting up, verify Maven is accessible:

```bash
mvn -version
```

You should see output like:
```
Apache Maven 3.9.12
Maven home: C:\Users\opera\scoop\apps\maven\current
...
```

## Note

The modified script (`deploy-with-maven.sh`) automatically sets up the Maven PATH before running, so you don't need to do anything extra.







