#!/bin/bash

# Backup
cp "src/app/services/game.service.ts" "src/app/services/game.service.backup.ts"

# Add import nach Zeile 4
sed -i '' '4a\
import { SeededRandom } from '\''../../utils/seeded-random'\'';
' "src/app/services/game.service.ts"

# Add private rng property nach gameState
sed -i '' '/private gameState = signal/a\
\ \ private rng = new SeededRandom();
' "src/app/services/game.service.ts"

# Add setSeed method
sed -i '' '/readonly state = this.gameState.asReadonly();/a\
\
\ \ /**\
\ \ * Sets seed for deterministic testing\
\ \ * @param seed - Random seed value\
\ \ */\
\ \ setSeed(seed: number): void {\
\ \ \ \ this.rng = new SeededRandom(seed);\
\ \ }
' "src/app/services/game.service.ts"

echo "✅ SeededRandom integration prepared"
echo "⚠️  Manual steps needed:"
echo "1. Replace all Math.random() with this.rng.next()"
echo "2. Replace shuffleDeck implementation with this.rng.shuffle()"
echo "3. Check src/app/services/game.service.ts"
