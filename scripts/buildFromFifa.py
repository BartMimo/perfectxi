#!/usr/bin/env python3
"""Convert EA FC / FIFA Kaggle CSVs into clubSeasons.json for Perfect XI."""

import csv
import json
import os
import math

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "kaggle")
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "clubSeasons.json")

LEAGUE_MAP = {
    "Premier League": ("GB1", "Premier League"),
    "La Liga": ("ES1", "La Liga"),
    "Serie A": ("IT1", "Serie A"),
    "Bundesliga": ("L1", "Bundesliga"),
    "Ligue 1": ("FR1", "Ligue 1"),
    "Eredivisie": ("NL1", "Eredivisie"),
    "Liga Portugal": ("PO1", "Primeira Liga"),
    "Primeira Liga": ("PO1", "Primeira Liga"),
}

VERSION_TO_SEASON = {
    "15": "2014-2015", "15.0": "2014-2015",
    "16": "2015-2016", "16.0": "2015-2016",
    "17": "2016-2017", "17.0": "2016-2017",
    "18": "2017-2018", "18.0": "2017-2018",
    "19": "2018-2019", "19.0": "2018-2019",
    "20": "2019-2020", "20.0": "2019-2020",
    "21": "2020-2021", "21.0": "2020-2021",
    "22": "2021-2022", "22.0": "2021-2022",
    "23": "2022-2023", "23.0": "2022-2023",
    "24": "2023-2024", "24.0": "2023-2024",
    "25": "2024-2025",
    "26": "2025-2026",
}

POS_MAP = {
    "GK": "Goalkeeper",
    "CB": "Defender", "LB": "Defender", "RB": "Defender",
    "LWB": "Defender", "RWB": "Defender",
    "CDM": "Midfield", "CM": "Midfield", "CAM": "Midfield",
    "LM": "Midfield", "RM": "Midfield",
    "LW": "Attack", "RW": "Attack", "CF": "Attack",
    "ST": "Attack", "RF": "Attack", "LF": "Attack",
}

SUB_MAP = {
    "GK": "Goalkeeper",
    "CB": "Centre-Back", "LB": "Left-Back", "RB": "Right-Back",
    "LWB": "Left-Back", "RWB": "Right-Back",
    "CDM": "Defensive Midfield", "CM": "Central Midfield", "CAM": "Attacking Midfield",
    "LM": "Left Midfield", "RM": "Right Midfield",
    "LW": "Left Winger", "RW": "Right Winger", "CF": "Centre-Forward",
    "ST": "Centre-Forward", "RF": "Right Winger", "LF": "Left Winger",
}


def safe_int(v, default=0):
    try:
        return int(float(v)) if v else default
    except (ValueError, TypeError):
        return default


def compute_attack_defense(row, source):
    """Compute attack/defense ratings from available attributes."""
    if source == "2015-2024" or source == "2026":
        shooting = safe_int(row.get("shooting"))
        passing = safe_int(row.get("passing"))
        dribbling = safe_int(row.get("dribbling"))
        defending = safe_int(row.get("defending"))
        physic = safe_int(row.get("physic"))
        pace = safe_int(row.get("pace"))
        attack = round((shooting + passing + dribbling) / 3) if shooting else 0
        defense = round((defending + physic) / 2) if defending else 0
        return attack, defense
    else:  # 2025
        finishing = safe_int(row.get("finishing"))
        short_passing = safe_int(row.get("short_passing"))
        dribbling = safe_int(row.get("dribbling"))
        def_aware = safe_int(row.get("defensive_awareness"))
        standing = safe_int(row.get("standing_tackle"))
        sliding = safe_int(row.get("sliding_tackle"))
        attack = round((finishing + short_passing + dribbling) / 3) if finishing else 0
        defense = round((def_aware + standing + sliding) / 3) if def_aware else 0
        return attack, defense


def parse_row(row, source):
    """Parse a CSV row into a normalized player dict."""
    if source == "2025":
        name = row.get("name", "")
        overall = safe_int(row.get("overall_rating"))
        club = row.get("club_name", "")
        league = row.get("club_league_name", "")
        version = "25"
        value = safe_int(row.get("value"))
        positions_raw = row.get("positions", "")
    else:
        name = row.get("short_name", "")
        overall = safe_int(row.get("overall"))
        club = row.get("club_name", "")
        league = row.get("league_name", "")
        version = row.get("fifa_version", "")
        value = safe_int(row.get("value_eur"))
        positions_raw = row.get("player_positions", "")

    if not name or not club or not league or overall < 1:
        return None

    league_info = LEAGUE_MAP.get(league)
    if not league_info:
        return None

    season = VERSION_TO_SEASON.get(version)
    if not season:
        return None

    positions = [p.strip() for p in positions_raw.split(",") if p.strip()]
    primary_pos = positions[0] if positions else "CM"
    pos_cat = POS_MAP.get(primary_pos, "Midfield")
    sub = SUB_MAP.get(primary_pos, "Central Midfield")

    attack, defense = compute_attack_defense(row, source)
    if attack == 0:
        attack = overall
    if defense == 0:
        defense = overall

    return {
        "name": name,
        "club": club,
        "league": league,
        "leagueCode": league_info[0],
        "leagueName": league_info[1],
        "season": season,
        "overall": overall,
        "attack": attack,
        "defense": defense,
        "mv": value,
        "pos": pos_cat,
        "sub": sub,
        "primary_pos": primary_pos,
    }


def build():
    # Collect all players grouped by (leagueCode, club, season)
    clubs = {}  # key: (leagueCode, club, season) -> list of players

    files = [
        ("2015-2024.csv", "2015-2024"),
        ("2025.csv", "2025"),
        ("2026.csv", "2026"),
    ]

    for filename, source in files:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename} (not found)")
            continue

        print(f"Reading {filename}...")
        seen_in_file = set()
        with open(filepath, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                parsed = parse_row(row, source)
                if not parsed:
                    continue

                # Deduplicate: same player in same club+season (multiple updates)
                dedup_key = (parsed["name"], parsed["club"], parsed["season"])
                if dedup_key in seen_in_file:
                    continue
                seen_in_file.add(dedup_key)

                key = (parsed["leagueCode"], parsed["club"], parsed["season"])
                if key not in clubs:
                    clubs[key] = {
                        "league": parsed["leagueName"],
                        "leagueCode": parsed["leagueCode"],
                        "club": parsed["club"],
                        "season": parsed["season"],
                        "players": [],
                    }
                clubs[key]["players"].append({
                    "name": parsed["name"],
                    "pos": parsed["pos"],
                    "sub": parsed["sub"],
                    "overall": parsed["overall"],
                    "attack": parsed["attack"],
                    "defense": parsed["defense"],
                    "goals": 0,
                    "assists": 0,
                    "minutes": 0,
                    "games": 0,
                    "mv": parsed["mv"],
                })

    # Build clubSeasons list
    club_seasons = []
    for key, data in clubs.items():
        players = data["players"]
        if len(players) < 11:
            continue
        # Sort by overall descending, keep top 25
        players.sort(key=lambda p: p["overall"], reverse=True)
        players = players[:25]
        team_rating = round(sum(p["overall"] for p in players[:11]) / 11)
        cs_id = f"{data['leagueCode']}-{data['club'][:20]}-{data['season'][:4]}"
        cs_id = cs_id.replace(" ", "_")
        club_seasons.append({
            "id": cs_id,
            "league": data["league"],
            "leagueCode": data["leagueCode"],
            "club": data["club"],
            "season": data["season"],
            "teamRating": team_rating,
            "players": players,
        })

    club_seasons.sort(key=lambda cs: (cs["leagueCode"], cs["season"], cs["club"]))

    result = {
        "meta": {
            "source": "EA Sports FC / FIFA via Kaggle (SoFIFA.com)",
            "leagues": {v[0]: v[1] for v in LEAGUE_MAP.values()},
            "minSeason": 2014,
        },
        "clubSeasons": club_seasons,
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    size_mb = os.path.getsize(OUT) / 1024 / 1024
    print(f"\nDone! {len(club_seasons)} club-seasons, {size_mb:.1f} MB")
    seasons = sorted(set(cs["season"] for cs in club_seasons))
    print(f"Seasons: {seasons}")
    for code in sorted(set(cs["leagueCode"] for cs in club_seasons)):
        count = sum(1 for cs in club_seasons if cs["leagueCode"] == code)
        print(f"  {code}: {count} club-seasons")


if __name__ == "__main__":
    build()
