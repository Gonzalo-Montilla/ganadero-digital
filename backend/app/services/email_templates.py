"""
Plantillas HTML y texto plano estandarizadas para correos del sistema.
"""
from __future__ import annotations

from html import escape

from app.core.config import settings

# Paleta de marca (alineada con frontend Tailwind)
BRAND_PRIMARY = "#1f663c"
BRAND_PRIMARY_DARK = "#19432a"
BRAND_ACCENT = "#257f48"
BRAND_LIGHT = "#ddf3e1"
BRAND_BG = "#f3faf4"
TEXT_PRIMARY = "#0f172a"
TEXT_MUTED = "#64748b"
BORDER = "#e2e8f0"
WHITE = "#ffffff"

BADGE_COLORS = {
    "alertas": ("#b91c1c", "#fef2f2"),
    "info": ("#1d4ed8", "#eff6ff"),
    "exito": ("#166534", "#f0fdf4"),
    "prueba": ("#a16207", "#fffbeb"),
    "sistema": ("#1f663c", "#f3faf4"),
}


def _badge_html(label: str, variant: str = "sistema") -> str:
    color, bg = BADGE_COLORS.get(variant, BADGE_COLORS["sistema"])
    return (
        f'<span style="display:inline-block;margin-top:14px;padding:6px 12px;border-radius:999px;'
        f'background:{bg};color:{color};font-size:12px;font-weight:700;letter-spacing:0.04em;">'
        f"{escape(label.upper())}</span>"
    )


def _logo_header_html(logo_cid: str | None) -> str:
    if logo_cid:
        return (
            f'<img src="cid:{logo_cid}" alt="Logo Finca El Progreso" width="52" height="52" '
            f'style="display:block;border-radius:14px;border:1px solid rgba(255,255,255,0.25);background:{WHITE};" />'
        )
    return (
        f'<div style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.14);'
        f'border:1px solid rgba(255,255,255,0.22);text-align:center;line-height:52px;color:{WHITE};'
        f'font-size:18px;font-weight:800;">FP</div>'
    )


def render_email_html(
    *,
    titulo: str,
    contenido_html: str,
    subtitulo: str | None = None,
    badge: str | None = None,
    badge_variant: str = "sistema",
    preheader: str | None = None,
    logo_cid: str | None = None,
) -> str:
    brand_name = escape(settings.SMTP_FROM_NAME or "Finca El Progreso")
    titulo_safe = escape(titulo)
    subtitulo_html = (
        f'<p style="margin:8px 0 0;color:rgba(255,255,255,0.92);font-size:15px;line-height:1.5;">{escape(subtitulo)}</p>'
        if subtitulo
        else ""
    )
    badge_html = _badge_html(badge, badge_variant) if badge else ""
    preheader_html = (
        f'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(preheader)}</div>'
        if preheader
        else ""
    )

    logo_html = _logo_header_html(logo_cid)

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{titulo_safe}</title>
</head>
<body style="margin:0;padding:0;background:{BRAND_BG};font-family:Arial,Helvetica,sans-serif;color:{TEXT_PRIMARY};">
  {preheader_html}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{BRAND_BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:{WHITE};border-radius:20px;overflow:hidden;border:1px solid {BORDER};box-shadow:0 12px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 28px 24px;background:linear-gradient(135deg,{BRAND_PRIMARY_DARK} 0%,{BRAND_ACCENT} 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:56px;vertical-align:middle;">
                    {logo_html}
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <div style="color:{WHITE};font-size:24px;font-weight:800;letter-spacing:0.06em;line-height:1.1;">{brand_name.upper()}</div>
                    <div style="color:rgba(255,255,255,0.82);font-size:12px;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Gestion ganadera inteligente</div>
                  </td>
                </tr>
              </table>
              <h1 style="margin:18px 0 0;color:{WHITE};font-size:22px;line-height:1.3;font-weight:700;">{titulo_safe}</h1>
              {subtitulo_html}
              {badge_html}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              {contenido_html}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;background:{BRAND_BG};border-top:1px solid {BORDER};">
              <p style="margin:0 0 8px;color:{TEXT_MUTED};font-size:12px;line-height:1.6;">
                Este correo fue generado automaticamente por <strong style="color:{BRAND_PRIMARY};">{brand_name}</strong>.
              </p>
              <p style="margin:0;color:{TEXT_MUTED};font-size:12px;line-height:1.6;">
                Por favor no respondas a este mensaje. Ingresa al sistema para gestionar tus registros de campo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def render_email_text(*, titulo: str, lineas: list[str]) -> str:
    brand_name = settings.SMTP_FROM_NAME or "Finca El Progreso"
    cuerpo = "\n".join(lineas)
    return f"{brand_name.upper()}\n{'=' * len(brand_name)}\n{titulo}\n\n{cuerpo}\n\n---\nCorreo automatico. No responder."


def render_info_box(content_html: str, variant: str = "info") -> str:
    _, bg = BADGE_COLORS.get(variant, BADGE_COLORS["info"])
    return (
        f'<div style="padding:14px 16px;border-radius:14px;background:{bg};'
        f'border:1px solid {BORDER};font-size:14px;line-height:1.6;color:{TEXT_PRIMARY};">'
        f"{content_html}</div>"
    )


def render_data_table(headers: list[str], rows: list[list[str]]) -> str:
    head_html = "".join(
        f'<th style="padding:10px 12px;text-align:left;font-size:12px;color:{TEXT_MUTED};'
        f'text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid {BORDER};">{escape(h)}</th>'
        for h in headers
    )
    rows_html = ""
    for row in rows:
        cells = "".join(
            f'<td style="padding:12px;border-bottom:1px solid {BORDER};font-size:14px;color:{TEXT_PRIMARY};">'
            f"{cell}</td>"
            for cell in row
        )
        rows_html += f"<tr>{cells}</tr>"

    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;">
      <thead><tr style="background:{BRAND_BG};">{head_html}</tr></thead>
      <tbody>{rows_html}</tbody>
    </table>
    """
