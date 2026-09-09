const MAX_BYTES = 1_500_000;

function isBlockedHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '0.0.0.0' || h === '::1') return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  const match = h.match(/^172\.(\d+)\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return h.includes(':') && (h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe8') || h.startsWith('fe9') || h.startsWith('fea') || h.startsWith('feb'));
}

export function safeUrl(raw: string) {
  if (!raw.trim() || (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw))) throw new Error('公開されているHTTPまたはHTTPSのURLを入力してください。');
  const value = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname || isBlockedHost(url.hostname)) throw new Error('公開されているHTTPまたはHTTPSのURLを入力してください。');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('安全のため、通常とは異なるポート番号には接続できません。');
  return url;
}

export async function fetchSafely(start: URL) {
  let current = start;
  const signal = AbortSignal.timeout(20_000);
  for (let i = 0; i < 4; i++) {
    const response = await fetch(current, { redirect: 'manual', signal, headers: { 'User-Agent': 'TechLens/1.0 (+website technology analysis)', Accept: 'text/html,application/xhtml+xml' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('転送先を確認できませんでした。');
      current = safeUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`サイトからエラーが返されました（HTTP ${response.status}）。`);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) throw new Error('このURLはWebページ（HTML）ではないようです。');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('ページ内容を読み取れませんでした。');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_BYTES) { await reader.cancel(); break; } chunks.push(value); }
    const merged = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0)); let offset = 0; for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
    return { response, html: new TextDecoder().decode(merged), finalUrl: current.toString(), truncated: size > MAX_BYTES };
  }
  throw new Error('転送回数が多すぎるため、安全に分析できませんでした。');
}


