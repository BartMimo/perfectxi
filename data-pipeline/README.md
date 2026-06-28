# Data pipeline

Builds `../data/clubSeasons.json` — the dataset the game draws from (club-seasons,
squads, and per-player attack/defense/overall ratings).

## Source & license

Player, squad and market-value data come from the Kaggle dataset
**[davidcariboo/player-scores](https://www.kaggle.com/datasets/davidcariboo/player-scores)**
("Football Data from Transfermarkt"), released under **CC0 1.0 (Public Domain)**.
Scraped from [Transfermarkt](https://www.transfermarkt.com). No API token required.

## How to (re)build

```bash
cd data-pipeline
./download_raw.sh        # fetches ~650 MB of CSVs into ./raw (gitignored)
python3 build_dataset.py # writes ../data/clubSeasons.json (~7 MB)
```

## What it does

1. **Scope** — keeps top European leagues (`LEAGUES` in the script: Premier League,
   La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Primeira Liga) and
   seasons `>= MIN_SEASON`. Data effectively begins at 2012/13.
2. **Squads** — aggregates `appearances.csv` per (club, season): goals, assists,
   minutes, games. Players with `< MIN_MINUTES` are dropped; top `MAX_SQUAD` by
   minutes are kept.
3. **Ratings (v2)** — `overall` is a blend that avoids market value's age bias
   (young players have inflated value, veterans deflated):
   `overall01 = 0.45·marketValuePct + 0.35·minutesShare + 0.20·output` → mapped
   to 40–95. Minutes share (manager trust / availability) and goal-involvement
   output pull young low-minute talents down and reliable performers up.
   `attack` / `defense` split off `overall` by position (`POS_WEIGHTS`); for
   goalkeepers & defenders, `defense` is further adjusted by the club's
   season defensive record (goals conceded percentile). Tune via `W_MV/W_MIN/W_OUT`,
   `POS_WEIGHTS`, `ratings()`.
4. **Output** — `clubSeasons.json`: `{ meta, clubSeasons: [{ id, league, club,
   season, teamRating, players: [{ name, pos, overall, attack, defense, ... }] }] }`.

## Tuning knobs (top of script)

| Constant | Meaning |
|---|---|
| `LEAGUES` | which competitions to include |
| `MIN_SEASON` | earliest season |
| `MIN_MINUTES` | drop fringe players |
| `MAX_SQUAD` | max players per club-season |
| `POS_WEIGHTS` / `ratings()` | rating formula |
