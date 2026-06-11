"""Generate favicon and PWA icon assets with a unified brand background."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "branding" / "logo.png"
BG_COLOR = "#ddf3e1"
PADDING_RATIO = 0.1
MASKABLE_PADDING_RATIO = 0.24
EMBLEM_HEIGHT_RATIO = 0.62
DARK_PIXEL_THRESHOLD = 35


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def prepare_emblem() -> Image.Image:
    logo = Image.open(SOURCE).convert("RGBA")
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


def render_icon(size: int, emblem: Image.Image, *, maskable: bool = False) -> Image.Image:
    canvas = Image.new("RGB", (size, size), hex_to_rgb(BG_COLOR))

    padding_ratio = MASKABLE_PADDING_RATIO if maskable else PADDING_RATIO
    padding = int(size * padding_ratio)
    inner = size - (padding * 2)
    scaled = emblem.copy()
    scaled.thumbnail((inner, inner), Image.Resampling.LANCZOS)

    emblem_rgb = Image.new("RGB", scaled.size, hex_to_rgb(BG_COLOR))
    emblem_rgb.paste(scaled, mask=scaled.split()[3])

    x = (size - emblem_rgb.width) // 2
    y = (size - emblem_rgb.height) // 2
    canvas.paste(emblem_rgb, (x, y))
    return canvas


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source logo: {SOURCE}")

    emblem = prepare_emblem()

    standard_outputs = {
        PUBLIC / "favicon.png": 512,
        PUBLIC / "favicon-32.png": 32,
        PUBLIC / "apple-touch-icon.png": 180,
        PUBLIC / "icon-48.png": 48,
        PUBLIC / "icon-72.png": 72,
        PUBLIC / "icon-96.png": 96,
        PUBLIC / "icon-128.png": 128,
        PUBLIC / "icon-144.png": 144,
        PUBLIC / "icon-192.png": 192,
        PUBLIC / "icon-256.png": 256,
        PUBLIC / "icon-512.png": 512,
    }

    maskable_outputs = {
        PUBLIC / "icon-maskable-192.png": 192,
        PUBLIC / "icon-maskable-512.png": 512,
    }

    for path, size in standard_outputs.items():
        render_icon(size, emblem).save(path, format="PNG", optimize=True)
        print(f"Wrote {path.name} ({size}x{size})")

    for path, size in maskable_outputs.items():
        render_icon(size, emblem, maskable=True).save(path, format="PNG", optimize=True)
        print(f"Wrote {path.name} ({size}x{size})")

    ico_sizes = [16, 32, 48]
    ico_images = [render_icon(size, emblem) for size in ico_sizes]
    ico_path = PUBLIC / "favicon.ico"
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(size, size) for size in ico_sizes],
        append_images=ico_images[1:],
    )
    print(f"Wrote {ico_path.name}")


if __name__ == "__main__":
    main()
