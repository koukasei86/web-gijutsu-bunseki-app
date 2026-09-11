import { buildLearningSite } from './learning-template.ts';

export type SiteProfile = {
  url: string; title: string; description: string; headings: string[];
  navigation: string[]; hasSearch: boolean; hasVideo: boolean;
  hasProducts: boolean; hasArticles: boolean; inspected: boolean;
};
export type SiteKind = 'catalog' | 'shop' | 'article' | 'landing' | 'learning';
export type PrototypeOptions = { name?: string; theme?: 'dark' | 'light'; items?: string[]; columns?: 2 | 3; search?: boolean; filters?: boolean };
export const kindNames: Record<SiteKind, string> = { learning: 'コードを書いて学ぶ学習サイト', catalog: '動画・作品カタログ', shop: '商品一覧・ショップ', article: '記事・ニュース', landing: 'サービス紹介' };
export const kindFeatures: Record<SiteKind, string[]> = {
  learning: ['説明・コード入力・実行結果の3ペイン', 'HTML・CSSの3つのレッスン', 'ヒント・解答例・課題チェック', '進捗表示・次の課題への移動'],
  catalog: ['作品のカタログ', 'タイトル検索・カテゴリー切替', '作品の詳細を開く'],
  shop: ['商品一覧・参考価格', '商品検索・カテゴリー切替', 'お試しカートへの追加'],
  article: ['見出しを中心にした記事一覧', 'キーワード検索・カテゴリー切替', '記事の詳細を開く'],
  landing: ['サービスの紹介・特徴', '項目検索・カテゴリー切替', '詳細説明を開く'],
};

function plain(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, s => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' })[s] || s).replace(/\s+/g, ' ').trim();
}
export function inspectHtml(html: string, url: string): SiteProfile {
  const clean = html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const title = plain(clean.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || new URL(url).hostname).slice(0, 120);
  const tags = clean.match(/<meta\b[^>]*>/gi) || [];
  const description = plain(tags.find(t => /(?:name|property)\s*=\s*["'](?:description|og:description)["']/i.test(t))?.match(/content\s*=\s*["']([^"']*)["']/i)?.[1] || '').slice(0, 280);
  const headings = [...clean.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map(m => plain(m[1]).slice(0, 100)).filter(Boolean).slice(0, 8);
  const nav = clean.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1] || '';
  const navigation = [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map(m => plain(m[1]).slice(0, 32)).filter(Boolean).slice(0, 5);
  const text = `${title} ${description} ${headings.join(' ')}`;
  return { url, title, description, headings, navigation, inspected: true,
    hasSearch: /type\s*=\s*["']search|role\s*=\s*["']search/i.test(clean),
    hasVideo: /<video\b|youtube(?:-nocookie)?\.com\/embed/i.test(clean) || /動画|映画|配信|streaming|movies/i.test(text),
    hasProducts: /schema.org\/Product|"@type"\s*:\s*"Product"/i.test(html) || /商品|カート|通販|shopping|shop\b/i.test(text),
    hasArticles: /<article\b/i.test(clean) || /ニュース|記事|ブログ|news|blog/i.test(text) };
}
export function suggestKind(profile: SiteProfile, brief = ''): SiteKind {
  const text = brief || `${profile.title} ${profile.description} ${profile.headings.join(' ')} ${profile.url}`;
  if (/progate|prog-8|プロゲート|レッスン|教材|コード.*(?:学|入力)|プログラミング.*学|学習サイト/i.test(text)) return 'learning';
  if (brief) {
    if (/商品|カート|通販|ショップ/i.test(brief)) return 'shop';
    if (/動画|映画|作品|配信/i.test(brief)) return 'catalog';
    if (/記事|ニュース|ブログ/i.test(brief)) return 'article';
    if (/紹介|サービス|企業/i.test(brief)) return 'landing';
  }
  return profile.hasProducts ? 'shop' : profile.hasVideo ? 'catalog' : profile.hasArticles ? 'article' : 'landing';
}
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Only our own executable template is emitted. Remote markup never becomes code.
export function buildPrototype(profile: SiteProfile, kind: SiteKind, brief: string, options: PrototypeOptions = {}) {
  if (!profile.inspected && brief.trim().length < 10) throw new Error('ページを確認できないため、作りたい画面や機能を10文字以上で教えてください。');
  const title = `${kindNames[kind]}の試作`;
  const name = options.name?.trim().slice(0, 60) || (kind === 'learning' ? 'CodeSteps' : 'Learning Studio');
  if (kind === 'learning') return { html: buildLearningSite(name, options.theme === 'light'), title: name };
  const heading = options.name?.trim().slice(0, 60) || profile.headings[0] || kindNames[kind];
  const descriptions = { catalog: '気になる作品を探して、詳細を開いてみましょう。', shop: '商品を探して、お試しカートに追加できます。', article: '記事を探して、続きを読んでみましょう。', landing: 'サービスの特徴を確認して、紹介を開いてみましょう。' };
  const labels = kind === 'catalog' ? ['サンプル映画', 'サンプルシリーズ', 'サンプルドキュメンタリー'] : kind === 'shop' ? ['サンプルバッグ', 'サンプルマグ', 'サンプルノート'] : kind === 'article' ? ['暮らしのアイデア', '新しい学び', '今週のトピック'] : ['サービスの特徴', '使い方の紹介', 'よくある質問'];
  const customItems = (options.items || []).map(item => item.trim().slice(0, 100)).filter(Boolean).slice(0, 6);
  const names = customItems.length ? customItems : profile.headings.slice(1, 4);
  const cardLabels = customItems.length ? customItems : labels;
  const cards = cardLabels.map((label, i) => `<article class="card" data-category="${i % 2 ? 'おすすめ' : '新着'}"><div class="art art-${i}" aria-hidden="true">${String(i + 1).padStart(2, '0')}</div><div class="card-body"><small>${i % 2 ? 'おすすめ' : '新着'} / SAMPLE</small><h2>${escapeHtml(names[i] || label)}</h2><p>学習用のサンプルです。実際の商品・作品・記事ではありません。</p>${kind === 'shop' ? `<p>参考価格 ¥${[2400, 1800, 900][i % 3].toLocaleString()}</p>` : ''}<button class="detail" type="button">${kind === 'shop' ? 'カートに追加' : '詳細を見る'}</button></div></article>`).join('\n');
  const note = brief.trim() || profile.description || (options.search === false ? '気になる項目を選んで、ボタンの動きを試せます。' : descriptions[kind]);
  const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>${escapeHtml(title)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#0b1322;color:#ecf3ff;font:16px/1.7 system-ui,sans-serif}header{border-bottom:1px solid #304056;padding:18px max(5%,calc((100% - 1040px)/2));display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}main{max-width:1100px;margin:auto;padding:36px 24px}small{color:#9ddcec;font-size:14px}.notice{background:#20324a;padding:12px 16px;border-radius:10px;font-size:14px}h1{font-size:clamp(26px,5vw,42px);line-height:1.3;margin:28px 0 16px;overflow-wrap:anywhere}h2{font-size:20px;overflow-wrap:anywhere}p{color:#b9c9df;overflow-wrap:anywhere}button,input{font:inherit}button{cursor:pointer;border:1px solid #52657f;border-radius:8px;padding:9px 16px;background:#163144;color:#e5f9ff}button:hover{background:#245169}button:focus-visible,input:focus-visible{outline:3px solid #5ed8f0;outline-offset:3px}input{width:100%;padding:12px;background:#121f32;color:white;border:1px solid #52657f;border-radius:8px}.controls{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.controls button[aria-pressed="true"]{background:#84e1ee;color:#08151c}.grid{display:grid;grid-template-columns:repeat(${options.columns === 2 ? 2 : 3},minmax(0,1fr));gap:20px}.card{background:#142238;border:1px solid #304056;border-radius:14px;overflow:hidden}.art{display:grid;place-items:center;aspect-ratio:16/9;font-size:42px;font-weight:700;color:#b4e7f2;background:#18394c}.art-1{background:#343454}.art-2{background:#25473f}.card-body{padding:20px}.card button{width:100%}dialog{max-width:560px;width:90%;background:#142238;color:white;border:1px solid #52657f;border-radius:14px;padding:24px}dialog::backdrop{background:#000a}[hidden]{display:none!important}footer{margin-top:36px;font-size:14px;color:#a9bbd4}@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding:24px 16px}}
</style></head><body>
<!-- 元サイトのソースではなく、公開情報と選択した構成から作成した学習用テンプレートです。 -->
<header><strong>LEARNING STUDIO</strong><span id="cart" aria-live="polite">${kind === 'shop' ? 'お試しカート：0点' : 'TechLensで作った試作'}</span></header>
<main><div class="notice">学習用の試作 / 元サイトとは関係ありません。ログイン・決済・動画配信は行いません。</div><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(note)}</p>
<label for="search">${kind === 'shop' ? '商品' : kind === 'catalog' ? '作品' : '項目'}を探す</label><input id="search" type="search" placeholder="タイトルのキーワードを入力"><div class="controls" aria-label="カテゴリー"><button type="button" data-filter="すべて" aria-pressed="true">すべて</button><button type="button" data-filter="新着" aria-pressed="false">新着</button><button type="button" data-filter="おすすめ" aria-pressed="false">おすすめ</button></div>
<div class="grid">${cards}</div><p id="empty" role="status" hidden>一致する項目がありません。検索条件を変えてください。</p><footer>構成の参考：${escapeHtml(profile.title)}<br>${profile.inspected ? '公開HTMLの文字情報を参考にしました。見た目の完全な再現ではありません。' : '元ページは未確認です。入力した説明と選択した構成をもとにしています。'}</footer></main>
<dialog aria-labelledby="detail-title"><h2 id="detail-title"></h2><p>詳細表示の動作サンプルです。実際のコンテンツやサーバーの機能は、ここから追加していきます。</p><button id="close" type="button">閉じる</button></dialog>
<script>
// 入力に応じてカードを絞り込みます。
const search = document.querySelector('#search');
const cards = [...document.querySelectorAll('.card')];
let category = 'すべて';
function filterCards() {
  const keyword = (search?.value || '').trim().toLowerCase();
  cards.forEach(card => { card.hidden = !card.querySelector('h2').textContent.toLowerCase().includes(keyword) || (category !== 'すべて' && card.dataset.category !== category); });
  document.querySelector('#empty').hidden = cards.some(card => !card.hidden);
}
search?.addEventListener('input', filterCards);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  filterCards();
}));
const dialog = document.querySelector('dialog');
let count = 0;
document.querySelectorAll('.detail').forEach(button => button.addEventListener('click', () => {
  ${kind === 'shop' ? "count += 1; document.querySelector('#cart').textContent = 'お試しカート：' + count + '点';" : "document.querySelector('#detail-title').textContent = button.closest('.card').querySelector('h2').textContent; dialog.showModal();"}
}));
document.querySelector('#close').addEventListener('click', () => dialog.close());
</script></body></html>`;
  const refinedStyle = `
body{--panel:#142238;--muted:#b9c9df}header strong{letter-spacing:.04em}.card{box-shadow:0 10px 30px #00000018}.card-body{padding:24px}h1{max-width:850px}main>p{max-width:760px}.art{letter-spacing:.12em}
${kind === 'catalog' ? '.art{aspect-ratio:3/4;font-size:64px}.card-body h2{font-size:21px}.grid{gap:24px}' : ''}
${kind === 'article' ? '.grid{grid-template-columns:1fr}.card{display:grid;grid-template-columns:180px 1fr}.art{height:100%;min-height:160px;aspect-ratio:auto}.card button{width:auto}.card:first-child h2{font-size:28px}@media(max-width:600px){.card{grid-template-columns:1fr}.art{min-height:100px;max-height:130px}}' : ''}
${kind === 'landing' ? '.grid{grid-template-columns:1fr}.card{display:grid;grid-template-columns:120px 1fr;align-items:center}.art{height:100%;aspect-ratio:auto}.card button{width:auto}main>h1{padding-top:28px;padding-bottom:12px;font-size:clamp(32px,6vw,56px)}@media(max-width:600px){.card{grid-template-columns:1fr}.art{min-height:90px}}' : ''}
${options.theme === 'light' ? 'body{background:#f3f6fc;color:#17243a}p,footer{color:#53627a}header{border-color:#d4dfed}.notice{background:#e1ebf6;color:#254367}.card,dialog{background:white;color:#17243a;border-color:#d4dfed}input{background:white;color:#17243a;border-color:#a5b6ca}button{background:#e6f0fa;color:#17324f;border-color:#a5b6ca}button:hover{background:#cde1f4}.controls button[aria-pressed="true"]{background:#165b78;color:white}small{color:#306078}' : ''}
`;
  let result = html;
  if (options.search === false) result = result.replace(/<label for="search">[\s\S]*?<input id="search"[^>]*>/, '');
  if (options.filters === false) result = result.replace(/<div class="controls"[\s\S]*?<\/div>/, '');
  return { html: result.replace('<strong>LEARNING STUDIO</strong>', `<strong>${escapeHtml(name)}</strong>`).replace('</style>', refinedStyle + '</style>'), title };
}
