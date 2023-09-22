# Base image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY tsconfig.build.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY dist/ ./dist/

# Expose the desired port
EXPOSE 3000

#RUN npm run build

# Run the server
CMD [ "npm", "run", "start:prod" ]