import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Puedes probar parámetros: ?title=Hola&subtitle=Mundo
  const title = (req.query.title as string) || "Dynamic SVG — Hello";
  const subtitle = (req.query.subtitle as string) || "Paso 1: estático";

  // SVG de prueba (seguro, sin <foreignObject>)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="200" viewBox="0 0 760 200" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="760" height="200" fill="url(#g)" rx="16" />
  <g filter="url(#shadow)">
    <text x="32" y="88" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="32" font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
    <text x="32" y="130" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="18" fill="#d1d5db">${escapeXml(subtitle)}</text>
  </g>
  <g transform="translate(680, 32)">
    <circle cx="24" cy="24" r="24" fill="#10b981" />
    <path d="M18 24l6 6 10-14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  // Evitamos caches para que luego (paso 3/4) se vean cambios “en vivo”
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  res.status(200).send(svg);
}

// Sanea contenido inyectado en texto para evitar romper el SVG.
function escapeXml(input: string) {
  return input
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&apos;");
}
