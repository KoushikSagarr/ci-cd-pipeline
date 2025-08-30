# Stage 1: Build environment
# Use a full Node.js image to build the application
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and install all dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Run the build command (if any)
# If your project uses a build step (like Vite's `npm run build`), you would add it here.
# For example:
# RUN npm run build

# Stage 2: Production environment
# Use a smaller, production-ready Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
# We're only copying the necessary files to run the app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 3000

# Run the production app
CMD ["npm", "start"]