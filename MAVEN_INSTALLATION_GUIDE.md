# Maven Installation Guide for Windows

## Quick Installation Options

### Option 1: Manual Download and Installation (Recommended)

1. **Download Maven:**
   - Go to: https://maven.apache.org/download.cgi
   - Download the latest `apache-maven-3.x.x-bin.zip` file (e.g., `apache-maven-3.9.6-bin.zip`)

2. **Extract Maven:**
   - Extract the zip file to a location like `C:\Program Files\Apache\maven` or `C:\tools\maven`
   - You should have a folder like `C:\Program Files\Apache\maven\apache-maven-3.9.6`

3. **Set Environment Variables:**
   
   Open PowerShell as Administrator and run:
   
   ```powershell
   # Set MAVEN_HOME (adjust path to your Maven installation)
   [System.Environment]::SetEnvironmentVariable("MAVEN_HOME", "C:\Program Files\Apache\maven\apache-maven-3.9.6", [System.EnvironmentVariableTarget]::Machine)
   
   # Add Maven bin to PATH
   $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
   $mavenBin = "$env:MAVEN_HOME\bin"
   if ($currentPath -notlike "*$mavenBin*") {
       [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$mavenBin", [System.EnvironmentVariableTarget]::Machine)
   }
   ```

4. **Verify Installation:**
   - Close and reopen PowerShell
   - Run: `mvn -version`

### Option 2: Using Chocolatey (If you install it)

1. **Install Chocolatey first:**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install Maven:**
   ```powershell
   choco install maven -y
   ```

### Option 3: Using Scoop (If you install it)

1. **Install Scoop first:**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Install Maven:**
   ```powershell
   scoop install maven
   ```

## Verify Installation

After installation, verify Maven is working:

```powershell
mvn -version
```

You should see output like:
```
Apache Maven 3.9.6
Maven home: C:\Program Files\Apache\maven\apache-maven-3.9.6
Java version: 17.0.17, vendor: Eclipse Adoptium
...
```

## Next Steps

Once Maven is installed, you can build the project:

```powershell
cd D:\Radno\git\NSCP_RI\implementation
mvn clean install
```

## Troubleshooting

**If `mvn` command is not found after installation:**
- Close and reopen your terminal/PowerShell
- Verify PATH includes Maven bin directory: `echo $env:PATH`
- Check MAVEN_HOME is set: `echo $env:MAVEN_HOME`

**If you get Java version errors:**
- Verify Java 17 is installed: `java -version`
- Set JAVA_HOME if needed: `[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", [System.EnvironmentVariableTarget]::Machine)`







