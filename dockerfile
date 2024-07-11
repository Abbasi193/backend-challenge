# Use the official Node.js image.
FROM node:16

# Set the working directory for the backend.
WORKDIR /app

# Copy backend package.json and package-lock.json.
COPY package*.json ./

# Install backend dependencies.
RUN npm ci

# Copy the backend application code.
COPY . .

# Build the backend application.
RUN npm run build

# Set the working directory for the frontend.
WORKDIR /app/client

# Copy frontend package.json and package-lock.json.
COPY ./client/package*.json ./

# Install frontend dependencies.
RUN npm ci

# Build the frontend application.
RUN npm run build

# Move the frontend build output to the public directory in the backend.
RUN cp -r build /app/public

# Remove frontend node_modules to save space.
RUN rm -rf node_modules

# Set the working directory back to the backend.
WORKDIR /app

# Expose the port the app runs on.
EXPOSE 3000

# Define the command to run the application.
CMD ["npm", "run", "start:prod"]
