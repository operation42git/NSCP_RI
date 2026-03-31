# Permanent Git Bash Setup for Java and Maven

## Step-by-Step Instructions

### Step 1: Find Your Git Bash Profile File

Open Git Bash and run:
```bash
echo $HOME
```

This will show your home directory (usually something like `/c/Users/opera`).

### Step 2: Check Which Profile File Exists

Run these commands to see which file exists:
```bash
ls -la ~/.bashrc
ls -la ~/.bash_profile
ls -la ~/.profile
```

One of these files should exist. If none exist, we'll create `.bashrc`.

### Step 3: Edit the Profile File

**Option A: Using Notepad (Windows)**
```bash
notepad ~/.bashrc
```

**Option B: Using nano (if available)**
```bash
nano ~/.bashrc
```

**Option C: Using vim**
```bash
vim ~/.bashrc
```

### Step 4: Add These Lines to the File

Add these lines at the end of the file:

```bash
# Java and Maven Setup for Git Bash
export JAVA_HOME="/c/Users/opera/scoop/apps/temurin17-jdk/current"
export MAVEN_HOME="/c/Users/opera/scoop/apps/maven/current"
export PATH="$JAVA_HOME/bin:$MAVEN_HOME/bin:$PATH"
```

**Important:** 
- Replace `/c/Users/opera` with your actual home directory path if different
- The paths use forward slashes `/` and `/c/` represents `C:\` in Git Bash

### Step 5: Save and Close

- **Notepad**: File → Save, then close
- **nano**: Press `Ctrl+X`, then `Y`, then `Enter`
- **vim**: Press `Esc`, type `:wq`, then `Enter`

### Step 6: Reload Your Profile

Run this command in Git Bash:
```bash
source ~/.bashrc
```

Or if you edited `.bash_profile`:
```bash
source ~/.bash_profile
```

### Step 7: Verify It Works

Test that Java and Maven are now available:
```bash
java -version
mvn -version
```

You should see version information for both.

## Alternative: Create Profile File If It Doesn't Exist

If no profile file exists, create one:

```bash
touch ~/.bashrc
notepad ~/.bashrc
```

Then add the lines from Step 4 above.

## Quick Reference

**Your Java location:** `/c/Users/opera/scoop/apps/temurin17-jdk/current`  
**Your Maven location:** `/c/Users/opera/scoop/apps/maven/current`

**Path conversion:**
- Windows: `C:\Users\opera\scoop\apps\maven\current`
- Git Bash: `/c/Users/opera/scoop/apps/maven/current`

## Troubleshooting

**If it doesn't work after reloading:**
1. Check the file was saved correctly: `cat ~/.bashrc`
2. Make sure there are no typos in the paths
3. Verify the paths exist: `ls -la /c/Users/opera/scoop/apps/maven/current`
4. Try opening a new Git Bash window (it should auto-load the profile)

**If you have multiple Java installations:**
- Check which one is active: `which java` (in Git Bash after setup)
- Update JAVA_HOME to point to that installation's parent directory

## After Setup

Once this is done, you can use the original `deploy.sh` script without any modifications:
```bash
cd deploy/local/efti-gate
./deploy.sh skip-tests
```

The environment variables will be automatically loaded every time you open Git Bash!







