import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { inspectHtml, suggestKind, buildPrototype } from '../lib/prototype.ts';
import { safeUrl, fetchSafely } from '../lib/fetch-site.ts';

const profile = inspectHtml('<title>映画 &amp; 作品</title><meta name="description" content="動画の紹介"><h1>作品を探す</h1><h2>今週の作品</h2><input type="search"><script>evil()</script>', 'https://example.com');
test('extracts public evidence and proposes a catalog', () => {
  assert.equal(profile.title, '映画 & 作品');
  assert.equal(profile.hasSearch, true);
  assert.deepEqual(profile.headings, ['作品を探す', '今週の作品']);
  assert.equal(suggestKind(profile), 'catalog');
});
test('unavailable pages need a description and are labelled uninspected', () => {
  assert.throws(() => buildPrototype({ ...profile, inspected: false }, 'landing', ''), /10文字/);
  assert.match(buildPrototype({ ...profile, inspected: false }, 'landing', '映画の一覧と検索ができる画面').html, /元ページは未確認/);
});
for (const kind of ['catalog', 'shop', 'article', 'landing']) {
  test(`${kind}: safely generates executable interactions`, () => {
    const { html } = buildPrototype({ ...profile, title: '<img src=x onerror=alert(1)>', headings: ['</h1><script>evil()</script>'] }, kind, '</p><script>evil()</script>');
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1);
    assert.ok(!html.includes('<script>evil()'));
    assert.match(html, /connect-src 'none'/);
    const nodes = new Map();
    const node = (values = {}) => ({ hidden: false, value: '', textContent: '', events: {}, addEventListener(name, fn) { this.events[name] = fn; }, setAttribute(name, value) { this[name] = value; }, ...values });
    const cards = ['Alpha', 'Beta'].map((title, i) => node({ dataset: { category: i ? 'おすすめ' : '新着' }, querySelector() { return { textContent: title }; } }));
    const filters = ['すべて', '新着', 'おすすめ'].map(filter => node({ dataset: { filter } }));
    const details = cards.map(card => node({ closest() { return card; } }));
    ['#search', '#empty', '#cart', '#close', '#detail-title'].forEach(key => nodes.set(key, node()));
    nodes.set('dialog', node({ open: false, showModal() { this.open = true; }, close() { this.open = false; } }));
    const document = { querySelector: key => nodes.get(key), querySelectorAll: key => ({ '.card': cards, '[data-filter]': filters, '.detail': details })[key] };
    new vm.Script(scripts[0][1]).runInNewContext({ document });
    const search = nodes.get('#search');
    search.value = 'missing'; search.events.input();
    assert.ok(cards.every(card => card.hidden)); assert.equal(nodes.get('#empty').hidden, false);
    search.value = ''; search.events.input(); filters[1].events.click();
    assert.equal(cards[0].hidden, false); assert.equal(cards[1].hidden, true);
    details[0].events.click();
    if (kind === 'shop') assert.match(nodes.get('#cart').textContent, /1点/);
    else { assert.equal(nodes.get('dialog').open, true); nodes.get('#close').events.click(); assert.equal(nodes.get('dialog').open, false); }
  });
}
test('URL validation and redirect refusal', async () => {
  for (const url of ['http://127.0.0.1', 'http://10.0.0.1', 'file:///etc/passwd', '', 'http://user:pass@example.com']) assert.throws(() => safeUrl(url));
  assert.equal(safeUrl('example.com').hostname, 'example.com');
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 302, headers: { location: 'http://127.0.0.1' } });
    await assert.rejects(fetchSafely(safeUrl('https://example.com')));
    globalThis.fetch = async () => new Response('denied', { status: 403 });
    await assert.rejects(fetchSafely(safeUrl('https://example.com')), /403/);
  } finally { globalThis.fetch = original; }
});
