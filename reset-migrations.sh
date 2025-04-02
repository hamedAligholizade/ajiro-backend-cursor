#!/bin/bash

# Script to reset and run all migrations
echo "Resetting database and running migrations..."

# Run migration script with clear flag
node src/db/migrations/migrate.js up --clear

echo "Database reset and migrations completed!" 