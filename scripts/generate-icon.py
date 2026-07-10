#!/usr/bin/env python3
"""Generate Windows .ico from Timeline4Things favicon design."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "build"
OUT_ICO = OUT_DIR / "icon.ico"
OUT_PNG = OUT_DIR / "icon.png"

BG = (37, 99, 235, 255)
WHITE = (255, 255, 255, 255)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = max(2, round(size * 6 / 32))
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)

    def pt(x: float, y: float) -> tuple[float, float]:
        return (x * size / 32, y * size / 32)

    line = [pt(6, 22), pt(12, 14), pt(18, 18), pt(26, 8)]
    stroke = max(1, round(size * 2.5 / 32))
    draw.line(line, fill=WHITE, width=stroke, joint="curve")

    dot_r = max(1, round(size * 2 / 32))
    for x, y in [(12, 14), (18, 18), (26, 8)]:
        cx, cy = pt(x, y)
        draw.ellipse(
            (cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r),
            fill=WHITE,
        )

    return img


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sizes = [256, 128, 64, 48, 32, 16]
    images = [draw_icon(s) for s in sizes]
    images[0].save(
        OUT_ICO,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=images[1:],
    )
    images[0].save(OUT_PNG, format="PNG")
    electron_icon = ROOT / "electron" / "icon.ico"
    electron_icon.write_bytes(OUT_ICO.read_bytes())
    print(f"Wrote {OUT_ICO}, {OUT_PNG}, and {electron_icon}")


if __name__ == "__main__":
    main()
