#!/bin/bash

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations
echo "Running database migrations..."
node src/db/migrations/migrate.js up

# Run database seed
echo "Running database seed..."
node src/db/seeders/seed.js up

# Start the application
echo "Starting the application..."
npm run dev 