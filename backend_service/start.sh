#!/bin/bash
set -e

echo "Starting FactLab Backend Service..."

# JAR 파일이 없다면 다시 빌드
if [ ! -f app.jar ]; then
    echo "JAR file not found. Building..."
    mvn clean package -DskipTests
    cp target/factlab-backend-0.0.1-SNAPSHOT.jar app.jar
    echo "Build completed."
fi

echo "Starting Java application..."
exec java ${JAVA_OPTS} -jar app.jar