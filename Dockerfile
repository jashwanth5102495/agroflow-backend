# Use a standard Debian-based Node image
FROM node:20-bookworm

# Update packages and install Chromium
RUN apt update && apt install -y chromium

# Set up your application
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Start the server
CMD ["npm", "start"]