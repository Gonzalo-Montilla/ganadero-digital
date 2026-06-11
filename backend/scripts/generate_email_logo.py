"""Genera el logo embebido para correos electronicos."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

BACKEND_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_LOGO = BACKEND_ROOT.parent / "frontend" / "public" / "branding" / "logo.png"
OUTPUT = BACKEND_ROOT / "media" / "branding" / "logo-email.png"
BG_COLOR = "#ffffff"
SIZE = 104
PADDING_RATIO = 0.12
EMBLEM_HEIGHT_RATIO = 0.62
DARK_PIXEL_THRESHOLD = 35


def prepare_emblem(source: Path) -> Image.Image:
    logo = Image.open(source).convert("RGBA")
    width, height = logo.size
    emblem = logo.crop((0, 0, width, int(height * EMBLEM_HEIGHT_RATIO)))

    pixels = emblem.load()
    for y in range(emblem.height):
        for x in range(emblem.width):
            red, green, blue, alpha = pixels[x, y]
            if red <= DARK_PIXEL_THRESHOLD and green <= DARK_PIXEL_THRESHOLD and blue <= DARK_PIXEL_THRESHOLD:
                pixels[x, y] = (0, 0, 0, 0)

    bbox = emblem.getbbox()
    if bbox:
        emblem = emblem.crop(bbox)
    return emblem


def main() -> None:
    if not FRONTEND_LOGO.exists():
        raise FileNotFoundError(f"No se encontro el logo en {FRONTEND_LOGO}")

    emblem = prepare_emblem(FRONTEND_LOGO)
    canvas = Image.new("RGB", (SIZE, SIZE), BG_COLOR)
    draw = ImageDraw.Draw(canvas)
    radius = int(SIZE * 0.22)
    draw.rounded_rectangle((0, 0, SIZE, SIZE), radius=radius, fill=BG_COLOR)

    padding = int(SIZE * PADDING_RATIO)
    inner = SIZE - (padding * 2)
    scaled = emblem.copy()
    scaled.thumbnail((inner, inner), Image.Resampling.LANCZOS)

    emblem_rgb = Image.new("RGB", scaled.size, BG_COLOR)
    emblem_rgb.paste(scaled, mask=scaled.split()[3])

    x = (SIZE - emblem_rgb.width) // 2
    y = (SIZE - emblem_rgb.height) // 2
    canvas.paste(emblem_rgb, (x, y))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, format="PNG", optimize=True)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
