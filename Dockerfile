# Base image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy source code
COPY . .

# Install dependencies
RUN npm install

RUN npm run build

# Expose the desired port (replace 3000 with your server's port)
EXPOSE 3000

# Run the server
CMD [ "npm", "run", "start:prod" ]
