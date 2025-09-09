#!/bin/bash
# This script loads the production environment variables and runs the build.
set -e

echo "Loading environment variables from .env.prod..."
export $(grep -v '^#' .env.prod | xargs)

echo "Starting Docker Compose build..."
docker-compose -f docker-compose.prod.yml build

echo "Build command finished."
