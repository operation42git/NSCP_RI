#!/usr/bin/env bash

# Deploy script with Maven PATH setup for Git Bash
# This script sets up Maven PATH and then runs the deployment
#
# Usage:
#   ./deploy-with-maven.sh                    # Build with tests, gates only
#   ./deploy-with-maven.sh skip-tests         # Build without tests, gates only
#   ./deploy-with-maven.sh with-domibus       # Build with tests, include Domibus
#   ./deploy-with-maven.sh skip-tests with-domibus  # Build without tests, include Domibus

# Stop on fail
set -e
cd $(dirname $0)

# Add Java and Maven to PATH
JAVA_HOME="/c/Users/opera/scoop/apps/temurin17-jdk/current"
MAVEN_HOME="/c/Users/opera/scoop/apps/maven/current"
export JAVA_HOME
export MAVEN_HOME
export PATH="$JAVA_HOME/bin:$MAVEN_HOME/bin:$PATH"

# Verify Java is available
if ! command -v java &> /dev/null; then
    echo "Error: Java not found. Please ensure Java is installed."
    echo "Expected location: $JAVA_HOME"
    exit 1
fi

# Verify Maven is available
if ! command -v mvn &> /dev/null; then
    echo "Error: Maven not found. Please ensure Maven is installed."
    echo "Expected location: $MAVEN_HOME"
    exit 1
fi

echo "Using Maven: $(mvn -version | head -n 1)"

# Parse arguments
SKIP_TESTS=""
WITH_DOMIBUS=false

for arg in "$@"; do
  case $arg in
    skip-tests)
      SKIP_TESTS="-DskipTests"
      ;;
    with-domibus)
      WITH_DOMIBUS=true
      ;;
    *)
      echo "Unsupported parameter: $arg"
      echo "Usage: $0 [skip-tests] [with-domibus]"
      exit 1
      ;;
  esac
done

projectPomFile=../../../implementation/pom.xml

echo "Cleaning up..."
mvn -B clean --file $projectPomFile

echo "Building..."
mvn -B package --file $projectPomFile $SKIP_TESTS

echo "Copying apps..."
# Copy executable JAR files (Spring Boot executable JARs with shell script prepended)
# The docker-compose.yml uses 'sh -c "exec java -jar ..."' to properly handle executable JARs
cp -f ../../../implementation/gate/target/gate-*.jar ./gate/efti-gate.jar
cp -f ../../../implementation/platform-gate-simulator/target/platform-gate-simulator-*.jar ./platform/platform-simulator.jar

echo "Starting up docker compose"
docker compose up -d
docker compose restart efti-gate-HR efti-gate-SLO efti-gate-AT platform-ACME platform-MASSIVE platform-UMBRELLA

wait_for_gate() {
    gate_port=$1
    echo "Waiting for the gate to be up and running at $gate_port..."
    until $(curl --output /dev/null --silent --head --fail http://localhost:$gate_port/actuator/health); do
        echo "Waiting for the gate to be up and running at $gate_port..."
        sleep 5
    done
}

wait_for_gate 8880
wait_for_gate 8881
wait_for_gate 8882

echo "Gates are up and running"

echo "Configure the gates with initial data"
# This goes through the schemas in the common database and configures all of them with the same data
for schema in eftihr eftislo eftiat; do
  echo 'Configuring gate with initial data for database: ' $schema
  sed "1iset search_path to $schema;" ./gate-db/gate-config.sql | docker exec -i reference-gate-shared-db psql -U efti -d efti
done

# Start Domibus if requested
if [ "$WITH_DOMIBUS" = true ]; then
  echo ""
  echo "=========================================="
  echo "Starting Domibus (eDelivery Access Points)"
  echo "=========================================="
  
  # Navigate to Domibus directory
  pushd ../domibus > /dev/null
  
  echo "Starting Domibus docker compose..."
  docker compose up -d
  
  # Wait for MariaDB to be healthy
  echo "Waiting for MariaDB databases to initialize..."
  sleep 30
  
  # Function to wait for Domibus
  wait_for_domibus() {
    domibus_port=$1
    domibus_name=$2
    echo "Waiting for Domibus $domibus_name at port $domibus_port..."
    max_attempts=60
    attempt=0
    until $(curl --output /dev/null --silent --fail http://localhost:$domibus_port/domibus/); do
      attempt=$((attempt + 1))
      if [ $attempt -ge $max_attempts ]; then
        echo "Warning: Domibus $domibus_name did not start within timeout. Check logs with: docker logs domibus-domibus-$domibus_name-1"
        return 1
      fi
      sleep 5
    done
    echo "Domibus $domibus_name is ready!"
  }
  
  # Wait for all Domibus instances
  wait_for_domibus 8081 "sybo"
  wait_for_domibus 8090 "li"
  wait_for_domibus 8100 "platform"
  
  echo ""
  echo "=========================================="
  echo "Domibus Access Points Started"
  echo "=========================================="
  echo "Domibus Sybo:     http://localhost:8081/domibus/"
  echo "Domibus Li:       http://localhost:8090/domibus/"
  echo "Domibus Platform: http://localhost:8100/domibus/"
  echo ""
  echo "Get super user passwords with:"
  echo "  docker logs domibus-domibus-sybo-1 2>&1 | grep 'Default password'"
  echo "  docker logs domibus-domibus-li-1 2>&1 | grep 'Default password'"
  echo "  docker logs domibus-domibus-platform-1 2>&1 | grep 'Default password'"
  echo ""
  echo "See deploy/local/domibus/README.md for PMode and Plugin User setup"
  echo "=========================================="
  
  popd > /dev/null
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Gates:"
echo "  HR (Croatia):  http://localhost:8880"
echo "  AT (Austria):  http://localhost:8881"
echo "  SLO (Slovenia): http://localhost:8882"
echo ""
echo "Platforms:"
echo "  ACME:      http://localhost:8070"
echo "  MASSIVE:   http://localhost:8071"
echo "  UMBRELLA:  http://localhost:8072"
echo ""
echo "Portal: http://portal.efti.fr:83 (requires portal-mock to be running)"
echo "=========================================="

