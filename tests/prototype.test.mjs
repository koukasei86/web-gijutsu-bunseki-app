import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { inspectHtml, suggestKind, buildPrototype } from '../lib/prototype.ts';
import { safeUrl, fetchSafely } from '../lib/fetch-site.ts';

const profile = inspectHtml('<title>映画 &amp; 作品</title><meta name="description" content="動画の紹介"><h1>作品を探す</h1><h2>今週の作品</h2><input type="search"><script>evil()</script>', 'https://example.com');
test('learning intent overrides generic website category', () => {
  assert.equal(suggestKind(profile, 'プロゲートのような学習サイトを作りたい'), 'learning');
  assert.equal(suggestKind({ ...profile, title: 'Progate' }), 'learning');
  assert.equal(suggestKind(profile, '商品をカートに追加するショップ'), 'shop');
});
test('learning template isolates student code and safely accepts a custom title', () => {
  const { html } = buildPrototype(profile, 'learning', '', { name: '</strong><script>evil()</script>', theme: 'light' });
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.ok(!html.includes('<script>evil()'));
  assert.match(html, /id="result" sandbox title=/);
  assert.ok(html.includes('script-src &apos;none&apos;')); 
  assert.match(html, /color-scheme:light/);
  new vm.Script(scripts[0][1]);
});
test('learning exercise navigation, feedback, hints and progress work', () => {
  const { html } = buildPrototype(profile, 'learning', '');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const makeNode = () => ({value:'',textContent:'',hidden:false,disabled:false,dataset:{},events:{},addEventListener(k,f){this.events[k]=f;},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];}});
  const ids = ['result','editor','lesson-title','explanation','task','hint','answer','step','feedback','next','run','progress','progress-label','hint-button','answer-button','reset'];
  const nodes = Object.fromEntries(ids.map(id => [id,makeNode()]));
  const buttons = [0,1,2].map(i => Object.assign(makeNode(), {dataset:{lesson:String(i)}}));
  let correctDocument = false;
  const document = {getElementById:id => nodes[id], querySelectorAll:() => buttons};
  class DOMParser { parseFromString() {return {querySelector:() => correctDocument ? {textContent:'こんにちは',style:{color:'blue'}} : null, querySelectorAll:() => correctDocument ? [{textContent:'はじめる'}] : []};} }
  new vm.Script(script).runInNewContext({document,DOMParser});
  assert.match(nodes['lesson-title'].textContent, /見出し/);
  nodes.run.events.click(); assert.equal(nodes.next.disabled,true);
  nodes['hint-button'].events.click(); assert.equal(nodes.hint.hidden,false);
  correctDocument = true;
  nodes.run.events.click(); assert.equal(nodes.progress.value,1);
  nodes.next.events.click(); assert.match(nodes['lesson-title'].textContent,/色/);
  nodes.run.events.click(); nodes.next.events.click();
  assert.match(nodes.editor.value,/\n<!--/);
  nodes.run.events.click(); assert.equal(nodes.progress.value,3); assert.match(nodes.feedback.textContent,/3レッスン完了/);
  nodes.reset.events.click(); assert.equal(nodes.progress.value,2); assert.equal(nodes.next.disabled,true);
});
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

test('custom item labels, grid width and optional controls reach the exported HTML', () => {
  const { html } = buildPrototype(profile, 'shop', '', { items: ['<script>bad()</script>', '二つ目', '三つ目', '四つ目'], columns: 2, search: false, filters: false });
  assert.equal((html.match(/<article class="card"/g) || []).length, 4);
  assert.ok(html.includes('&lt;script&gt;bad()&lt;/script&gt;'));
  assert.ok(!html.includes('<script>bad()'));
  assert.ok(!html.includes('<input id="search"'));
  assert.ok(!html.includes('data-filter="'));
  assert.ok(html.includes('repeat(2,minmax(0,1fr))'));
  assert.ok(!html.includes('undefined'));
  new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
});

test('large response chunks retain the allowed HTML prefix and disclose truncation', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<title>Large page</title>' + 'x'.repeat(1_500_000), {headers:{'content-type':'Text/HTML; charset=UTF-8'}});
    const result = await fetchSafely(safeUrl('https://example.com'));
    assert.equal(result.truncated, true);
    assert.equal(result.html.length, 1_500_000);
    assert.ok(result.html.startsWith('<title>Large page</title>'));
  } finally { globalThis.fetch = original; }
});

