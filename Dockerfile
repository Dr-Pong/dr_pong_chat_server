# Base image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the desired port (replace 3000 with your server's port)
EXPOSE 4000

# Run the server
CMD [ "npm", "run", "start" ]
