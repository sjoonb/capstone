# Use the official Node.js image as a base
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available) into the working directory
COPY package*.json ./

# Install the dependencies
RUN npm ci

# Copy the rest of the application code into the working directory
COPY . .

# Build the application
RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Install a basic HTTP server to serve the built assets
RUN npm install -g http-server

# Start the HTTP server
CMD ["http-server", "src", "-p", "8080"]
