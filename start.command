#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)..."
  npm install
fi

echo "Building the app..."
npm run build

echo ""
echo "Starting the Class Progress Tracker."
echo "On this computer, open: http://localhost:3000"
echo "On student devices connected to the same wifi, use the Network address shown below."
echo ""

npm run start:lan
