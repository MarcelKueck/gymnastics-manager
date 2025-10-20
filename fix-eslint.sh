#!/bin/bash
# Script to fix ESLint errors before production deployment

echo "🔧 Fixing ESLint errors for production..."
echo ""

# Run ESLint auto-fix
echo "Step 1: Running ESLint auto-fix..."
npm run lint -- --fix

echo ""
echo "Step 2: Testing build..."
npm run build

echo ""
echo "✅ ESLint fixes applied!"
echo ""
echo "If build still fails, check PRODUCTION_READINESS_REPORT.md for manual fixes."
