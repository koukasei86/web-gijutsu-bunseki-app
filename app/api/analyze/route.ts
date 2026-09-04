import { NextRequest, NextResponse } from 'next/server';

type Certainty = '確認できた技術' | '可能性が高い技術' | '推定された技術' | '判定できない技術';
type Tech = { name: string; category: string; certainty: Certainty; confidence: number; what: string; where: string; evidence: string; learn: string; actual?: string; command?: string; sample?: string };

const MAX_BYTES = 1_500_000;

function isBlockedHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h === '0.0.0.0' || h === '::1') return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  const match = h.match(/^172\.(\d+)\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return h.includes(':') && (h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe8') || h.startsWith('fe9') || h.startsWith('fea') || h.startsWith('feb'));
}

function safeUrl(raw: string) {
  const value = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname || isBlockedHost(url.hostname)) throw new Error('公開されているHTTPまたはHTTPSのURLを入力してください。');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('安全のため、通常とは異なるポート番号には接続できません。');
  return url;
}

async function fetchSafely(start: URL) {
  let current = start;
  for (let i = 0; i < 4; i++) {
    const response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(10_000), headers: { 'User-Agent': 'TechLens/1.0 (+website technology analysis)', Accept: 'text/html,application/xhtml+xml' } });
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

const info: Record<string, Omit<Tech, 'name' | 'category' | 'certainty' | 'confidence' | 'evidence'>> = {
  React: { what: '画面を部品ごとに組み立てるJavaScriptライブラリです。', where: 'ボタンやメニューなど、操作に反応して変化する画面に使われます。', learn: 'HTML・CSS・JavaScriptの基礎 → Reactの順がおすすめです。' },
  'Next.js': { what: 'Reactを使ってWebサイト全体を作りやすくするフレームワークです。', where: 'ページ表示、画面遷移、サーバー側の処理などに使われます。', learn: 'JavaScript → React → Next.jsの順に学びましょう。' },
  Vue: { what: '操作に応じて変わる画面を作るJavaScriptフレームワークです。', where: 'フォームや一覧など、動きのある画面に使われます。', learn: 'JavaScriptの基礎を学んでからVueに進むと理解しやすいです。' },
  WordPress: { what: '記事やページを管理できるCMS（サイト管理システム）です。', where: '記事の投稿、テーマによる見た目、プラグインによる機能追加に使われます。', learn: 'HTML・CSS、WordPressのテーマ、PHPの基礎がおすすめです。' },
  Shopify: { what: '商品や注文を管理できるネットショップ作成サービスです。', where: '商品ページ、カート、決済までの仕組みに使われます。', learn: 'HTML・CSS、Liquid、ECサイトの仕組みを学びましょう。' },
  Cloudflare: { what: 'サイトを速く安全に届けるネットワークサービスです。', where: '閲覧者とWebサーバーの間で通信を中継します。', learn: 'HTTP、DNS、CDN（高速配信の仕組み）を学びましょう。' },
  Vercel: { what: 'Webアプリをインターネットへ公開するサービスです。', where: 'サイトの配信やサーバー処理を担当します。', learn: 'Git、デプロイ（公開作業）、環境変数を学びましょう。' },
  'Google Analytics': { what: '訪問数や閲覧ページを調べるアクセス解析サービスです。', where: 'ページ内の計測用スクリプトとして動きます。', learn: 'scriptタグ、イベント、Cookieとプライバシーを学びましょう。' },
  'Google Ads': { what: '広告の表示や成果計測に使われるGoogleのサービスです。', where: '広告用スクリプトや計測タグとしてページに組み込まれます。', learn: 'Web広告、コンバージョン、Cookieの基礎を学びましょう。' },
  Stripe: { what: 'クレジットカードなどのオンライン決済サービスです。', where: '安全な支払いフォームや購入処理に使われます。', learn: 'フォーム、API、決済時のセキュリティを学びましょう。' },
  YouTube: { what: '動画を配信・埋め込みできる外部サービスです。', where: 'ページ内の動画プレーヤーに使われます。', learn: 'iframeと外部コンテンツ埋め込みを学びましょう。' },
};

const examples: Record<string, string> = {
  React: `function NewsCard({ title }) {\n  return <article><h2>{title}</h2></article>;\n}`,
  'Next.js': `export default function Page() {\n  return <main><h1>ニュース一覧</h1></main>;\n}`,
  Vue: `<script setup>\nconst title = 'ニュース一覧'\n</script>\n<template><h1>{{ title }}</h1></template>`,
  WordPress: `<?php if (have_posts()): while (have_posts()): the_post(); ?>\n  <h2><?php the_title(); ?></h2>\n<?php endwhile; endif; ?>`,
  Shopify: `{% for product in collections.frontpage.products %}\n  <h2>{{ product.title }}</h2>\n{% endfor %}`,
  Cloudflare: `// 静的ファイルを長めにキャッシュする設定例\nexport default {\n  async fetch(request) { return fetch(request); }\n};`,
  Vercel: `// APIとしてJSONを返す簡単な例\nexport function GET() {\n  return Response.json({ status: 'ok' });\n}`,
  'Google Analytics': `gtag('event', 'select_content', {\n  content_type: 'news'\n});`,
  'Google Ads': `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>`,
  Stripe: `const checkout = await stripe.checkout.sessions.create({\n  mode: 'payment', line_items: items\n});`,
  YouTube: `<iframe src="https://www.youtube.com/embed/VIDEO_ID" title="動画"></iframe>`,
};

function codeAround(source: string, marker: string | RegExp) {
  const match = typeof marker === 'string' ? source.toLowerCase().indexOf(marker.toLowerCase()) : source.search(marker);
  if (match < 0) return undefined;
  return source.slice(Math.max(0, match - 80), Math.min(source.length, match + 220)).replace(/\s+/g, ' ').trim();
}

function detect(html: string, headers: Headers): Tech[] {
  const text = html.toLowerCase(); const server = (headers.get('server') || '').toLowerCase(); const results: Tech[] = [];
  const add = (name: string, category: string, certainty: Certainty, confidence: number, evidence: string, actual?: string) => { if (!results.some(r => r.name === name)) results.push({ name, category, certainty, confidence, evidence, actual, sample: examples[name], ...info[name] }); };
  if (text.includes('__next_data__') || text.includes('/_next/static/')) add('Next.js', 'フレームワーク', '確認できた技術', 98, 'HTML内にNext.js特有の __NEXT_DATA__ または /_next/static/ が見つかりました。', codeAround(html, text.includes('__next_data__') ? '__next_data__' : '/_next/static/'));
  if (text.includes('data-reactroot') || text.includes('_reactrootcontainer') || text.includes('react-dom')) add('React', 'フロントエンド', '可能性が高い技術', 88, 'HTMLまたはスクリプトURLにReact特有の文字列が見つかりました。', codeAround(html, text.includes('react-dom') ? 'react-dom' : 'data-reactroot'));
  if (text.includes('__vue__') || /data-v-[a-f0-9]{6,}/.test(text) || text.includes('vue.runtime')) add('Vue', 'フレームワーク', '可能性が高い技術', 86, 'HTML内にVueが生成する属性またはスクリプト名が見つかりました。', codeAround(html, /data-v-[a-f0-9]{6,}|vue\.runtime|__vue__/i));
  if (text.includes('/wp-content/') || text.includes('/wp-includes/') || /generator[^>]+wordpress/.test(text)) add('WordPress', 'CMS', '確認できた技術', 97, 'HTML内にWordPress特有のパスまたはgenerator情報が見つかりました。', codeAround(html, /\/wp-(content|includes)\/|generator[^>]+wordpress/i));
  if (text.includes('cdn.shopify.com') || text.includes('shopify.theme') || text.includes('myshopify.com')) add('Shopify', 'CMS', '確認できた技術', 97, 'HTML内にShopify特有の配信URLまたは設定情報が見つかりました。', codeAround(html, /cdn\.shopify\.com|shopify\.theme|myshopify\.com/i));
  if (server.includes('cloudflare') || headers.has('cf-ray')) add('Cloudflare', 'サーバー・ホスティング', '確認できた技術', 99, 'HTTPヘッダーにCloudflareの server または cf-ray が見つかりました。', `server: ${headers.get('server') || '(非公開)'}\ncf-ray: ${headers.get('cf-ray') || '(非公開)'}`);
  if (server.includes('vercel') || headers.has('x-vercel-id')) add('Vercel', 'サーバー・ホスティング', '確認できた技術', 99, 'HTTPヘッダーにVercel特有の情報が見つかりました。', `server: ${headers.get('server') || '(非公開)'}\nx-vercel-id: ${headers.get('x-vercel-id') || '(非公開)'}`);
  if (text.includes('googletagmanager.com/gtag') || /gtag\(['"]config['"]/.test(text) || /g-[a-z0-9]{8,}/.test(text)) add('Google Analytics', 'アクセス解析', '可能性が高い技術', 93, 'HTML内にGoogle Analyticsの計測タグまたは測定IDが見つかりました。', codeAround(html, /googletagmanager\.com\/gtag|gtag\(['"]config['"]|g-[a-z0-9]{8,}/i));
  if (text.includes('pagead2.googlesyndication.com') || text.includes('adsbygoogle')) add('Google Ads', '広告', '可能性が高い技術', 94, 'HTML内にGoogle広告の配信スクリプトが見つかりました。', codeAround(html, /pagead2\.googlesyndication\.com|adsbygoogle/i));
  if (text.includes('js.stripe.com') || text.includes('stripe.js')) add('Stripe', '決済', '可能性が高い技術', 95, 'HTML内にStripeの公式JavaScript配信URLが見つかりました。', codeAround(html, /js\.stripe\.com|stripe\.js/i));
  if (text.includes('youtube.com/embed/') || text.includes('youtube-nocookie.com/embed/')) add('YouTube', 'その他の外部サービス', '確認できた技術', 96, 'HTML内にYouTube動画の埋め込みURLが見つかりました。', codeAround(html, /youtube(?:-nocookie)?\.com\/embed\//i));
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== 'string' || body.url.length > 2048) return NextResponse.json({ error: 'URLを正しく入力してください。' }, { status: 400 });
    const { response, html, finalUrl, truncated } = await fetchSafely(safeUrl(body.url.trim()));
    const techs = detect(html, response.headers);
    if (!techs.length) techs.push({ name: '特定できませんでした', category: 'その他の外部サービス', certainty: '判定できない技術', confidence: 0, what: '今回取得できた公開情報には、対応技術を示す特徴がありませんでした。', where: 'サイト内部では何らかの技術が使われていますが、外からは見えない場合があります。', evidence: 'HTMLとHTTPヘッダーを確認しましたが、登録済みの判定パターンに一致しませんでした。', learn: 'ブラウザの開発者ツールでHTML・通信・Cookieを見る方法を学ぶと、調査範囲を広げられます。' });
    techs.forEach(tech => { tech.command = `curl -L -I "${finalUrl}"\ncurl -L "${finalUrl}"`; });
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => { try { return new URL(m[1], finalUrl).toString(); } catch { return m[1]; } }).slice(0, 8);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 120);
    return NextResponse.json({ label: title || new URL(finalUrl).hostname, techs, meta: { finalUrl, checked: ['HTML', 'HTTPヘッダー', 'メタ情報', 'スクリプトURL'], scripts, truncated } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '分析中に問題が発生しました。';
    const friendly = /timed out|abort/i.test(message) ? 'サイトから時間内に応答がありませんでした。' : message;
    return NextResponse.json({ error: friendly }, { status: 422 });
  }
}
