#!/usr/bin/env bash
# Render Build Script
# This script runs during the Render build phase.
# It installs Python deps, builds the React frontend, and copies it into backend/static.

set -o errexit  # Exit on any error

echo "=== Step 1: Install Python dependencies ==="
cd backend
pip install -r requirements.txt
cd ..

echo "=== Step 2: Install Node dependencies ==="
cd frontend
npm ci

echo "=== Step 3: Build React frontend ==="
npm run build

echo "=== Step 4: Copy build to backend/static ==="
cd ..
rm -rf backend/static
cp -r frontend/dist backend/static

echo "=== Step 5: Verify build output ==="
if [ ! -f backend/static/index.html ]; then
  echo "ERROR: backend/static/index.html does not exist!"
  echo "Frontend build failed or copy failed."
  exit 1
fi

echo "=== Build complete ==="
echo "Files in backend/static:"
ls -la backend/static/
echo ""
echo "Assets:"
ls backend/static/assets/ | head -5
echo "..."
echo "SUCCESS: Frontend built and copied to backend/static"
