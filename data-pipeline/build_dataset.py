#!/usr/bin/env python3
"""Build clubSeasons.json from the Transfermarkt (player-scores) CSVs.

Filters to top European leagues, season >= MIN_SEASON, derives per club-season
squads from appearances, attaches market-value-based ratings (attack/defense/
overall) refined with performance, and writes a compact JSON for the game.
"""
import csv, json, sys, os, datetime
from collections import defaultdict

csv.field_size_limit(1 << 24)

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "data", "clubSeasons.json")

# Top leagues to include (Transfermarkt competition ids)
LEAGUES = {
    "GB1": "Premier League",
    "ES1": "La Liga",
    "IT1": "Serie A",
    "L1":  "Bundesliga",
    "FR1": "Ligue 1",
    "NL1": "Eredivisie",
    "PO1": "Primeira Liga",
}
MIN_SEASON = 2010
MIN_MINUTES = 270      # drop fringe players (~3 full games)
MAX_SQUAD = 24         # keep top-N by minutes per club-season

def p(name): return os.path.join(RAW, name)

import re
_SUFFIX = re.compile(r"\b(Football Club|FC|AFC|CF|AC|SC|SSC|SS|BV|NV|CV|RC|RCD|CD|SD|SV|US|UC|OGC|AS|VfB|VfL|TSG|FK)\b\.?", re.I)
def clean_name(n):
    n = _SUFFIX.sub("", n)
    n = re.sub(r"\s+", " ", n).strip(" -.")
    return n or "Unknown"

# ---- 1. games: game_id -> (competition_id, season) for our scope ----
print("reading games...", file=sys.stderr)
game_meta = {}
club_games = defaultdict(int)     # (club, season) -> league games played
conceded = defaultdict(int)       # (club, season) -> goals conceded
with open(p("games.csv"), encoding="utf-8") as f:
    for row in csv.DictReader(f):
        comp = row["competition_id"]
        if comp not in LEAGUES:
            continue
        try:
            season = int(row["season"])
        except ValueError:
            continue
        if season < MIN_SEASON:
            continue
        game_meta[row["game_id"]] = (comp, season)
        h, a = row["home_club_id"], row["away_club_id"]
        try:
            hg, ag = int(row["home_club_goals"] or 0), int(row["away_club_goals"] or 0)
        except ValueError:
            hg = ag = 0
        club_games[(h, season)] += 1
        club_games[(a, season)] += 1
        conceded[(h, season)] += ag
        conceded[(a, season)] += hg
print(f"  {len(game_meta)} league games in scope", file=sys.stderr)

# ---- 2. players: id -> name, position ----
print("reading players...", file=sys.stderr)
players = {}
with open(p("players.csv"), encoding="utf-8") as f:
    for row in csv.DictReader(f):
        players[row["player_id"]] = {
            "name": row["name"],
            "position": row["position"],       # Goalkeeper/Defender/Midfield/Attack
            "sub": row["sub_position"],
        }

# ---- 3. clubs: id -> name ----
clubs = {}
with open(p("clubs.csv"), encoding="utf-8") as f:
    for row in csv.DictReader(f):
        clubs[row["club_id"]] = row["name"]

# ---- 4. player_valuations: player_id -> sorted [(date, value)] ----
print("reading valuations...", file=sys.stderr)
vals = defaultdict(list)
with open(p("player_valuations.csv"), encoding="utf-8") as f:
    for row in csv.DictReader(f):
        v = row["market_value_in_eur"]
        if not v:
            continue
        try:
            d = datetime.date.fromisoformat(row["date"])
            vals[row["player_id"]].append((d, int(float(v))))
        except ValueError:
            continue
for k in vals:
    vals[k].sort()

def value_for(player_id, season):
    """Market value (eur) for a player nearest the given season (Aug start)."""
    lst = vals.get(player_id)
    if not lst:
        return 0
    target = datetime.date(season + 1, 1, 1)  # mid-season reference
    best, bestgap = 0, None
    for d, val in lst:
        gap = abs((d - target).days)
        if bestgap is None or gap < bestgap:
            bestgap, best = gap, val
    return best

# ---- 5. appearances -> aggregate per (club, season, player) ----
print("reading appearances (1.8M rows)...", file=sys.stderr)
# key: (club_id, season) -> {player_id: stats}
agg = defaultdict(lambda: defaultdict(lambda: {"g":0,"a":0,"min":0,"games":0}))
with open(p("appearances.csv"), encoding="utf-8") as f:
    for row in csv.DictReader(f):
        meta = game_meta.get(row["game_id"])
        if not meta:
            continue
        comp, season = meta
        club = row["player_club_id"]
        s = agg[(club, season)][row["player_id"]]
        s["g"] += int(row["goals"] or 0)
        s["a"] += int(row["assists"] or 0)
        s["min"] += int(row["minutes_played"] or 0)
        s["games"] += 1
        s["comp"] = comp

# ---- 6. build club-seasons with raw market values, collect per-season pool ----
print("building club-seasons...", file=sys.stderr)
season_values = defaultdict(list)   # season -> [values] for normalization
raw = []  # list of dicts before rating
for (club, season), pdict in agg.items():
    roster = []
    for pid, s in pdict.items():
        if s["min"] < MIN_MINUTES:
            continue
        meta = players.get(pid)
        if not meta:
            continue
        mv = value_for(pid, season)
        roster.append({
            "name": meta["name"], "position": meta["position"], "sub": meta["sub"],
            "goals": s["g"], "assists": s["a"], "minutes": s["min"],
            "games": s["games"], "mv": mv,
        })
        if mv > 0:
            season_values[season].append(mv)
    if len(roster) < 11:
        continue
    roster.sort(key=lambda r: r["minutes"], reverse=True)
    roster = roster[:MAX_SQUAD]
    comp = next(iter(pdict.values())).get("comp")
    raw.append({"club_id": club, "season": season, "comp": comp, "roster": roster})

# ---- 7. per-season market-value percentile -> 1..99 ----
import bisect
sorted_vals = {s: sorted(v) for s, v in season_values.items()}

def mv_percentile(season, mv):
    arr = sorted_vals.get(season)
    if not arr or mv <= 0:
        return None
    i = bisect.bisect_left(arr, mv)
    return i / len(arr)  # 0..1

# per-season team defensive strength: percentile of goals-conceded-per-game (inverted)
season_conceded = defaultdict(list)
club_cpg = {}
for (club, season), g in club_games.items():
    if g <= 0:
        continue
    cpg = conceded[(club, season)] / g
    club_cpg[(club, season)] = cpg
    season_conceded[season].append(cpg)
season_conceded_sorted = {s: sorted(v) for s, v in season_conceded.items()}

def def_strength(club, season):
    """0..1, higher = stronger defence (fewer goals conceded) that season."""
    cpg = club_cpg.get((club, season))
    arr = season_conceded_sorted.get(season)
    if cpg is None or not arr:
        return 0.5
    i = bisect.bisect_left(arr, cpg)
    return 1 - (i / len(arr))

POS_WEIGHTS = {  # (attack_bias, defense_bias) relative to overall
    "Goalkeeper": (-24, 10),
    "Defender":   (-10, 10),
    "Midfield":   (0, 0),
    "Attack":     (8, -12),
}

# Rating v2: overall = blend of market value (reputation), minutes share
# (manager trust / availability) and attacking output. Market value alone is
# age-biased (young = inflated, veterans = deflated); minutes + output correct it.
W_MV, W_MIN, W_OUT = 0.45, 0.35, 0.20

def ratings(season, r, club_id):
    pct = mv_percentile(season, r["mv"])
    if pct is None:
        pct = 0.35  # unknown value -> below median, lean on performance
    cg = club_games.get((club_id, season), 0)
    min_share = min(r["minutes"] / (cg * 90), 1.0) if cg else 0.0
    per90 = (r["goals"] + r["assists"]) / max(r["minutes"] / 90, 1)
    output01 = min(per90 / 0.9, 1.0)  # ~0.9 goal involvements/90 = elite

    overall01 = W_MV * pct + W_MIN * min_share + W_OUT * output01
    overall = round(40 + overall01 * 55)  # 40..95

    atk_b, def_b = POS_WEIGHTS.get(r["position"], (0, 0))
    attack = overall + atk_b + min(round(per90 * 5), 8)
    defense = overall + def_b
    if r["position"] in ("Goalkeeper", "Defender"):
        defense += round((def_strength(club_id, season) - 0.5) * 16)  # +/-8 team effect
    clamp = lambda x: max(30, min(99, x))
    return clamp(overall), clamp(attack), clamp(defense)

# ---- 8. emit ----
out = []
for cs in raw:
    club_name = clean_name(clubs.get(cs["club_id"], "Unknown"))
    season = cs["season"]
    sid = f"{season}-{season+1}"
    pl = []
    for r in cs["roster"]:
        o, a, d = ratings(season, r, cs["club_id"])
        pl.append({
            "name": r["name"],
            "pos": r["position"],
            "sub": r["sub"],
            "overall": o, "attack": a, "defense": d,
            "goals": r["goals"], "assists": r["assists"],
            "minutes": r["minutes"], "games": r["games"],
            "mv": r["mv"],
        })
    pl.sort(key=lambda x: x["overall"], reverse=True)
    team_rating = round(sum(x["overall"] for x in pl[:11]) / 11)
    out.append({
        "id": f"{cs['comp']}-{cs['club_id']}-{season}",
        "league": LEAGUES[cs["comp"]],
        "leagueCode": cs["comp"],
        "club": club_name,
        "season": sid,
        "teamRating": team_rating,
        "players": pl,
    })

out.sort(key=lambda c: (c["league"], c["club"], c["season"]))
with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"meta": {"source": "Transfermarkt via Kaggle davidcariboo/player-scores (CC0)",
                        "leagues": LEAGUES, "minSeason": MIN_SEASON},
               "clubSeasons": out}, f, ensure_ascii=False, separators=(",", ":"))

print(f"\nDONE: {len(out)} club-seasons -> {OUT}", file=sys.stderr)
print(f"size: {os.path.getsize(OUT)/1e6:.1f} MB", file=sys.stderr)
