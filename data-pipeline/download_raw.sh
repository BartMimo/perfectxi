#!/usr/bin/env bash
# Download the raw Transfermarkt CSVs needed by build_dataset.py.
# Source: Kaggle dataset davidcariboo/player-scores (CC0 Public Domain).
# No Kaggle account / API token required.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)/raw"
mkdir -p "$DIR"
BASE="https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores"

FILES=(competitions clubs players games player_valuations appearances)

for f in "${FILES[@]}"; do
  echo "downloading $f.csv ..."
  curl -s -L -o "$DIR/$f.csv" "$BASE/$f.csv"
  echo "  $(ls -lh "$DIR/$f.csv" | awk '{print $5}')"
done
echo "done -> $DIR"
