#!/bin/bash

# Build the Docker Compose images
docker-compose build

# Run the Docker Compose services in detached mode
docker-compose up -d

docker system prune -af