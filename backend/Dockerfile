# Use Node.js LTS
FROM node:20-slim

# Install poppler-utils for PDF to image conversion
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace/backend

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p uploads temp output

# Expose port
EXPOSE 5001

# Start the server
CMD ["npm", "start"]







