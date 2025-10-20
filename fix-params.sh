#!/bin/bash
# Quick fix script for Next.js 15 params type changes

echo "🔧 Fixing Next.js 15 dynamic params types..."

# Fix all route files with dynamic [id] segments
FILES=(
  "src/app/api/trainer/athletes/[id]/attendance/route.ts"
  "src/app/api/trainer/athletes/[id]/config/route.ts"
  "src/app/api/trainer/athletes/[id]/route.ts"
  "src/app/api/trainer/training-plans/[id]/route.ts"
  "src/app/api/training-plans/[id]/download/route.ts"
  "src/app/api/trainer/sessions/[date]/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Use sed to replace params type (this is a simplified approach)
    sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
    sed -i 's/{ params }: { params: { date: string } }/{ params }: { params: Promise<{ date: string }> }/g' "$file"
    
    # Add await params at the start of function (after variable declarations)
    # This is more complex and may need manual adjustment
  fi
done

echo "✅ Type fixes applied"
echo "Now manually add 'const { id } = await params;' or 'const { date } = await params;' at start of each function"
echo "And remove any 'params.id' or 'params.date' references"
