import { kv } from '@vercel/kv';

export const config = {
  matcher: ['/', '/index.html', '/obrigado', '/obrigado.html']
};

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function middleware(request) {
  // Only modify HTML responses
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) return;

  // Fetch the static HTML from origin (Vercel rewrites internally)
  const originResponse = await fetch(request, { redirect: 'manual' });
  if (!originResponse.ok) return originResponse;
  const ct = originResponse.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return originResponse;

  let html = await originResponse.text();

  // Pull scripts + content in parallel (errors fall through to defaults)
  let scripts = { head: '', footer: '' };
  let content = {};
  try {
    const [s, c] = await Promise.all([
      kv.get('scripts'),
      kv.get('content')
    ]);
    if (s && typeof s === 'object') scripts = { head: s.head || '', footer: s.footer || '' };
    if (c && typeof c === 'object') content = c;
  } catch (e) {
    // KV unreachable — serve page without injections
  }

  // 1) Replace [data-cms="key"] inner text from content map (HTML-escaped)
  for (const [key, value] of Object.entries(content)) {
    if (!/^[a-z0-9_-]{1,80}$/i.test(key)) continue;
    const safe = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const re = new RegExp(
      `(<([a-z0-9]+)([^>]*\\sdata-cms="${escapeForRegex(key)}"[^>]*)>)([\\s\\S]*?)(</\\2>)`,
      'gi'
    );
    html = html.replace(re, `$1${safe}$5`);
  }

  // 2) Inject head scripts just before </head>
  if (scripts.head) {
    html = html.replace(/<\/head>/i, `\n<!-- injected:head -->\n${scripts.head}\n</head>`);
  }

  // 3) Inject footer scripts just before </body>
  if (scripts.footer) {
    html = html.replace(/<\/body>/i, `\n<!-- injected:footer -->\n${scripts.footer}\n</body>`);
  }

  const headers = new Headers(originResponse.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');

  return new Response(html, {
    status: originResponse.status,
    headers
  });
}
