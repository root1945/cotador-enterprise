#!/bin/bash
# Phase 4.2: Update Root tsconfig.json

set -e

cd /home/victoralencar/Code/cotador-enterprise

echo "📝 Updating root tsconfig.json..."

# Backup original
cp tsconfig.json tsconfig.json.backup

# Create updated tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "incremental": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": "./",
    "paths": {
      "@cotador/shared": ["packages/shared/src/index.ts"],
      "@cotador/shared/*": ["packages/shared/src/*"]
    }
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "**/node_modules",
    "**/dist"
  ]
}
EOF

echo "✅ Root tsconfig.json updated with path mappings"
echo ""
