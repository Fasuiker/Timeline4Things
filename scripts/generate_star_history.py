from __future__ import annotations

import math
import os
import datetime as dt
from collections import Counter

import requests
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.ticker import MaxNLocator

OWNER = "Fasuiker"
REPO = "Timeline4Things"
OUT_PATH = "assets/star-history.svg"
MONTHS_BACK = 2


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


def get_chart_window(months_back: int = MONTHS_BACK) -> tuple[dt.date, dt.date]:
    """From the 1st of the current month, go back `months_back` months to today."""
    today = dt.date.today()
    end = today
    start = today.replace(day=1)
    for _ in range(months_back):
        start = (start - dt.timedelta(days=1)).replace(day=1)
    return start, end


def compute_y_max(max_stars: int) -> float:
    """Scale Y-axis to the actual star count with modest headroom (not fixed 10/20/50)."""
    if max_stars <= 0:
        return 5.0
    padding = max(1.0, math.ceil(max_stars * 0.2))
    return float(max_stars + padding)


def build_cumulative_series(star_dates: list[str], months_back: int = MONTHS_BACK):
    start, end = get_chart_window(months_back)
    daily = Counter(star_dates)

    baseline = sum(count for day, count in daily.items() if day < start.isoformat())

    dates: list[dt.date] = []
    counts: list[int] = []
    total = baseline
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

        ax.plot(dates, counts, linewidth=2.8, marker="o", markersize=4, markevery=max(1, len(dates) // 10))
        if counts:
            ax.scatter(dates[-1], counts[-1], s=45, zorder=5)

        ax.set_title("Timeline4Things Stars Over Time", pad=14)
        ax.set_xlabel("Time")
        ax.set_ylabel("GitHub stars")

        ax.set_xlim(dates[0], dates[-1])
        ax.set_ylim(0, y_max)
        ax.yaxis.set_major_locator(MaxNLocator(integer=True, nbins=5, min_n_ticks=3))

        ax.xaxis.set_major_locator(mdates.MonthLocator())
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
        ax.xaxis.set_minor_locator(mdates.WeekdayLocator(byweekday=mdates.MO))

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(True, alpha=0.25)

        if counts:
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
    dates, counts = build_cumulative_series(stars)
    draw_xkcd_chart(dates, counts, OUT_PATH)
    print(
        f"Saved {OUT_PATH} ({counts[-1]} stars, {dates[0]} → {dates[-1]}, y_max={compute_y_max(max(counts)):.0f})"
    )


if __name__ == "__main__":
    main()
