from __future__ import annotations

import math
import os
import datetime as dt
from collections import Counter

import requests
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

OWNER = "Fasuiker"
REPO = "Timeline4Things"
OUT_PATH = "assets/star-history.svg"
DEFAULT_LOOKBACK_DAYS = 14


def fetch_stars(owner: str, repo: str) -> list[str]:
    headers = {
        "Accept": "application/vnd.github.star+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    stars = []
    page = 1

    while True:
        url = f"https://api.github.com/repos/{owner}/{repo}/stargazers"
        resp = requests.get(
            url,
            headers=headers,
            params={"per_page": 100, "page": page},
            timeout=30,
        )
        if resp.status_code in (401, 403):
            print(f"GitHub API auth/rate limit issue ({resp.status_code}); using empty star list.")
            break
        resp.raise_for_status()
        data = resp.json()

        if not data:
            break

        for item in data:
            starred_at = item.get("starred_at")
            if starred_at:
                stars.append(starred_at[:10])

        page += 1

    return stars


def fetch_repo_created_at(owner: str, repo: str) -> dt.date | None:
    headers = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        resp = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers,
            timeout=30,
        )
        if resp.ok:
            created = resp.json().get("created_at", "")[:10]
            if created:
                return dt.date.fromisoformat(created)
    except requests.RequestException:
        pass
    return None


def compute_y_max(max_stars: int) -> int:
    """Keep the line in the upper portion of the chart with readable ticks."""
    if max_stars <= 0:
        return 10
    padded = max_stars * 1.2 + 1
    if padded <= 10:
        return 10
    if padded <= 20:
        return 20
    if padded <= 50:
        return int(math.ceil(padded / 5) * 5)
    if padded <= 100:
        return int(math.ceil(padded / 10) * 10)
    magnitude = 10 ** math.floor(math.log10(padded))
    return int(math.ceil(padded / magnitude) * magnitude)


def build_cumulative_series(
    star_dates: list[str],
    repo_created: dt.date | None = None,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
):
    today = dt.date.today()

    if not star_dates:
        start = today - dt.timedelta(days=lookback_days)
        if repo_created and repo_created > start:
            start = repo_created
        return _fill_daily_range(start, today, Counter())

    daily = Counter(star_dates)
    first_star = dt.date.fromisoformat(min(star_dates))
    last_star = dt.date.fromisoformat(max(star_dates))

    # Only show history from first real star; extend a little before if all stars are recent.
    if first_star == last_star:
        start = first_star - dt.timedelta(days=lookback_days)
    else:
        start = first_star

    if repo_created and start < repo_created:
        start = repo_created

    end = today
    return _fill_daily_range(start, end, daily)


def _fill_daily_range(start: dt.date, end: dt.date, daily: Counter):
    if end < start:
        start = end

    # Guarantee at least two points so matplotlib draws a line segment.
    if start == end:
        start = end - dt.timedelta(days=DEFAULT_LOOKBACK_DAYS)

    dates: list[dt.date] = []
    counts: list[int] = []
    total = 0
    cur = start
    while cur <= end:
        total += daily.get(cur.isoformat(), 0)
        dates.append(cur)
        counts.append(total)
        cur += dt.timedelta(days=1)

    return dates, counts


def draw_xkcd_chart(dates, counts, out_path: str):
    plt.rcParams["svg.fonttype"] = "none"

    max_count = max(counts) if counts else 0
    y_max = compute_y_max(max_count)

    with plt.xkcd(scale=0.8, length=80, randomness=2):
        fig, ax = plt.subplots(figsize=(8.5, 4.2))

        ax.plot(dates, counts, linewidth=2.8, marker="o", markersize=4, markevery=max(1, len(dates) // 12))
        ax.scatter(dates[-1], counts[-1], s=45, zorder=5)

        ax.set_title("Timeline4Things Stars Over Time", pad=14)
        ax.set_xlabel("Time")
        ax.set_ylabel("GitHub stars")

        ax.set_xlim(dates[0], dates[-1])
        ax.set_ylim(0, y_max)

        span_days = (dates[-1] - dates[0]).days
        if span_days <= 21:
            locator = mdates.DayLocator(interval=max(1, span_days // 7))
            formatter = mdates.DateFormatter("%m-%d")
        elif span_days <= 120:
            locator = mdates.WeekdayLocator(byweekday=mdates.MO, interval=1)
            formatter = mdates.DateFormatter("%m-%d")
        else:
            locator = mdates.MonthLocator()
            formatter = mdates.DateFormatter("%Y-%m")

        ax.xaxis.set_major_locator(locator)
        ax.xaxis.set_major_formatter(formatter)

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(True, alpha=0.25)

        label = f"{counts[-1]} star" if counts[-1] == 1 else f"{counts[-1]} stars"
        ax.annotate(
            label,
            xy=(dates[-1], counts[-1]),
            xytext=(-70, 25),
            textcoords="offset points",
            arrowprops=dict(arrowstyle="->", lw=1.2),
        )

        fig.autofmt_xdate()
        fig.tight_layout()
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        fig.savefig(out_path, format="svg", bbox_inches="tight")
        plt.close(fig)


def main():
    stars = fetch_stars(OWNER, REPO)
    created = fetch_repo_created_at(OWNER, REPO)
    dates, counts = build_cumulative_series(stars, repo_created=created)
    draw_xkcd_chart(dates, counts, OUT_PATH)
    print(f"Saved {OUT_PATH} ({counts[-1]} stars, {dates[0]} → {dates[-1]}, y_max={compute_y_max(max(counts))})")


if __name__ == "__main__":
    main()
