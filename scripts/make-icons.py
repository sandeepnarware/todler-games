"""Render the PNG app icons (matches icons/icon.svg). Run: python scripts/make-icons.py"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
BG = "#ffd166"


def draw_shapes(d: ImageDraw.ImageDraw, s: float, ox: float = 0, oy: float = 0) -> None:
    """Draw the three shapes on a 512-unit design grid scaled by s and offset by (ox, oy)."""
    p = lambda x, y: (ox + x * s, oy + y * s)
    d.ellipse([*p(90, 104), *p(262, 276)], fill="#ff5d73")
    d.rounded_rectangle([*p(270, 110), *p(430, 270)], radius=26 * s, fill="#3a86ff")
    d.polygon([p(256, 256), p(366, 442), p(146, 442)], fill="#3bd16f")


def render(size: int, maskable: bool = False, rounded: bool = True) -> Image.Image:
    scale = 4  # supersample for smooth edges
    big = size * scale
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable or not rounded:
        d.rectangle([0, 0, big, big], fill=BG)
    else:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=112 / 512 * big, fill=BG)
    if maskable:
        # Keep artwork inside the central 70% safe zone.
        s = big / 512 * 0.7
        draw_shapes(d, s, big * 0.15, big * 0.15)
    else:
        draw_shapes(d, big / 512)
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(exist_ok=True)
render(192).save(OUT / "icon-192.png")
render(512).save(OUT / "icon-512.png")
render(512, maskable=True).save(OUT / "maskable-512.png")
render(180, rounded=False).convert("RGB").save(OUT / "apple-touch-icon.png")
print("icons written to", OUT)
