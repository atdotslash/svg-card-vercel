export const config = {
  runtime: 'edge', // 👈 Edge Runtime
};

function escapeXml(input: string) {
  return input
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&apos;");
}

// Utilidad: calcula una "ventana" de tiempo (p.ej. cada 1 o 4 horas)
// Devuelve el índice de bloque (entero) y la hora de inicio del bloque.
function computeWindow(now: Date, hoursPerWindow: number) {
  const msPerWindow = hoursPerWindow * 60 * 60 * 1000;
  const epoch = new Date(0); // 1970-01-01
  const diff = now.getTime() - epoch.getTime();
  const index = Math.floor(diff / msPerWindow);
  const start = new Date(epoch.getTime() + index * msPerWindow);
  return { index, start };
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") ?? "Dynamic SVG — Edge Runtime";
  const subtitle = url.searchParams.get("subtitle") ?? "Paso 2: base de rotación";
  // período en horas (1, 2, 4...). Si no llega, usamos 4.
  const period = Math.max(1, parseInt(url.searchParams.get("period") || "4", 10));

  const now = new Date();
  const { index, start } = computeWindow(now, period);

  // (Solo visual) mostramos el índice de ventana y próxima actualización estimada
  const nextRefresh = new Date(start.getTime() + period * 3600_000)
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", "Z");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="220" viewBox="0 0 760 220" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="760" height="220" fill="url(#g)" rx="16" />
  <g filter="url(#shadow)">
    <text x="32" y="84" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="30" font-weight="700" fill="#ffffff">
      ${escapeXml(title)}
    </text>
    <text x="32" y="118" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="18" fill="#cbd5e1">
      ${escapeXml(subtitle)}
    </text>
    <text x="32" y="154" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="15" fill="#94a3b8">
      Period: ${period}h · Window #${index}
    </text>
    <text x="32" y="178" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="13" fill="#94a3b8">
      Next refresh (approx): ${nextRefresh}
    </text>
  </g>
  <g transform="translate(680, 28)">
    <circle cx="24" cy="24" r="24" fill="#22c55e" />
    <path d="M18 24l6 6 10-14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`.trim();

  // Headers para asegurar que el navegador/Proxy no lo cachee (luego podremos afinar ETag/If-None-Match)
  const headers = new Headers({
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "no-store, max-age=0, must-revalidate",
  });

  return new Response(svg, { status: 200, headers });
}
