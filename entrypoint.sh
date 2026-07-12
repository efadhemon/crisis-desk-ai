#!/bin/bash

# Run migrations using node directly (ts-node is not available in production)
node ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js

# Run seeds
node dist/database/seeds/seed.js

# Start the application with explicit heap limit
# Server: 4GB VPS | ~512MB Valkey | ~250MB OS → 1536MB safe for V8 heap
node --max-old-space-size=1536 dist/main.js
