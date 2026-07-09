import os
import datetime as dt
from collections import Counter

import requests
import matplotlib.pyplot as plt

OWNER = "Fasuiker"
REPO = "Timeline4Things"
OUT_PATH = "assets/star-history.svg"


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
        if resp.status_code == 403:
            print("GitHub API rate limit hit; generating chart with available data.")
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


def build_cumulative_series(star_dates: list[str]):
    if not star_dates:
        today = dt.date.today()
        return [today], [0]

    daily = Counter(star_dates)
    start = dt.date.fromisoformat(min(star_dates))
    end = dt.date.today()

    dates = []
    counts = []
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

    with plt.xkcd(scale=0.8, length=80, randomness=2):
        fig, ax = plt.subplots(figsize=(8.5, 4.2))

        ax.plot(dates, counts, linewidth=2.8)
        ax.scatter(dates[-1], counts[-1], s=45)

        ax.set_title("Timeline4Things Stars Over Time", pad=14)
        ax.set_xlabel("Time")
        ax.set_ylabel("GitHub stars")

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(True, alpha=0.25)

        ax.annotate(
            f"{counts[-1]} stars",
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
    print(f"Saved {OUT_PATH}")


if __name__ == "__main__":
    main()
