#!/bin/bash

# Create and push tag v1.0.2 to trigger release workflow

set -e

echo "🔄 Creating tag v1.0.2..."

# Create the tag pointing to the latest commit
git tag v1.0.2

echo "✅ Tag created locally"

echo "📤 Pushing tag to GitHub..."

# Push the tag to GitHub (this will trigger the Release workflow)
git push origin v1.0.2

echo "✅ Tag pushed successfully!"
echo "🚀 Release workflow should start building now..."
echo ""
echo "View the build progress at:"
echo "https://github.com/SeyedTahaKhademi/hooyar/actions"
