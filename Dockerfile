FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the backend code
COPY backend ./backend

# Set environment variable for port (optional, Railway sets this automatically)
ENV PORT=4200

# Expose the port
EXPOSE 4200

# Start the application
CMD ["node", "backend/index.js"]
