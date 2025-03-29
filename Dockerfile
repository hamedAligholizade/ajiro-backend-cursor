FROM node:20

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Uninstall and reinstall bcrypt with proper compilation
RUN npm uninstall bcrypt
RUN npm install bcrypt --build-from-source

# Copy app source
COPY . .

# Make startup script executable
RUN chmod +x ./startup.sh

EXPOSE 3000

# Use the startup script instead of direct npm run
CMD ["./startup.sh"] 