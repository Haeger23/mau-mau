#!/bin/bash

FILE="src/app/services/game.service.ts"

# Replace Math.random() - 0.5 pattern (for sort)
sed -i '' 's/Math\.random() - 0\.5/this.rng.next() - 0.5/g' "$FILE"

# Replace Math.random() < probability patterns
sed -i '' 's/Math\.random() < 0\.3/this.rng.next() < 0.3/g' "$FILE"
sed -i '' 's/Math\.random() < 0\.5/this.rng.next() < 0.5/g' "$FILE"
sed -i '' 's/Math\.random() < 0\.8/this.rng.next() < 0.8/g' "$FILE"
sed -i '' 's/Math\.random() < 0\.9/this.rng.next() < 0.9/g' "$FILE"

# Replace Math.floor(Math.random() pattern in shuffleDeck
sed -i '' 's/Math\.floor(Math\.random() \* (i + 1))/Math.floor(this.rng.next() * (i + 1))/g' "$FILE"

echo "✅ Replaced all Math.random() calls with this.rng.next()"
echo "📝 Please verify the changes in $FILE"
