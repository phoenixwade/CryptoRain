#!/bin/bash


export GITHUB_TOKEN="${CryptoRainToken}"

echo "Creating PR for Crypto Rain web conversion..."

gh pr create \
  --repo phoenixwade/CryptoRain \
  --title "Convert Crypto Rain to Web Browser Application with XPR Webauth and Top 10 Leaderboard" \
  --body-file PR_DESCRIPTION.md \
  --base main \
  --head devin/1752514784-crypto-rain-game

echo "PR creation completed."
