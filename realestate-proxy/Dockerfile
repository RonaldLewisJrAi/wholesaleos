# Use a Node.js base image
FROM node:22-slim

# Install Python 3 and required packages
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Set up a virtual environment for Python to avoid PEP 668 PEP-managed environment errors
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies (requests, bs4)
RUN pip install requests beautifulsoup4

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the correct port
EXPOSE 3001

# Start the Node.js server
CMD [ "node", "server.cjs" ]
