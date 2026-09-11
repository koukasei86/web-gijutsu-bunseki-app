import test from 'node:test';
import assert from 'node:assert/strict';
import { detect } from '../lib/detect.ts';
import { classifyError, summarizeTechnologies } from '../lib/analysis-status.ts';
import { parseDraft } from '../lib/prototype-draft.ts';

test('technology tutorials and commented examples are not usage evidence', () => {
  const html = `<h1>react-dom and stripe.js</h1><p>cdn.shopify.com /_next/static/ g-abcdefghij</p><!-- <script src="https://js.stripe.com/v3"></script> --><pre><script src="/_next/static/example.js"></script></pre>`;
  assert.deepEqual(detect(html, new Headers()), []);
});
test('Next.js markers and React inference remain distinguishable', () => {
  const results = detect('<script src="/_next/static/chunk.js"></script>', new Headers());
  assert.equal(results.find(t => t.name === 'Next.js').certainty, '確認できた技術');
  assert.equal(results.find(t => t.name === 'React').certainty, '推定された技術');
});
test('Google Ads tags alone do not imply Google Analytics', () => {
  const results = detect(`<script async src="https://www.googletagmanager.com/gtag/js?id=AW-12345678"></script><script>gtag('config', 'AW-12345678')</script>`, new Headers());
  assert.deepEqual(results.map(t => t.name), ['Google Ads']);
  const ga = detect(`<script>gtag('config', 'G-AB12345678')</script>`, new Headers());
  assert.deepEqual(ga.map(t => t.name), ['Google Analytics']);
});
test('AdSense and header evidence retain their own labels', () => {
  const results = detect('<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>', new Headers({'cf-ray':'test'}));
  assert.deepEqual(results.map(t => t.name), ['Cloudflare', 'Google AdSense']);
});
test('zero detections is an empty result, not a fake technology', () => {
  assert.equal(detect('<h1>Hello</h1>', new Headers()).length, 0);
  assert.match(summarizeTechnologies([]), /技術を使っていないという意味ではありません/);
});
test('failure types give different recovery actions', () => {
  assert.equal(classifyError('HTTP 403').kind, 'blocked');
  assert.equal(classifyError('時間内に応答がありません').kind, 'timeout');
  assert.equal(classifyError('このURLはWebページ（HTML）ではないようです。').kind, 'not_html');
  assert.equal(classifyError('Invalid URL').kind, 'invalid_url');
  assert.equal(classifyError('fetch failed').kind, 'unavailable');
});
test('invalid or oversized stored drafts fail closed', () => {
  for (const input of [null, '{}', '{broken', JSON.stringify({version:1,kind:'constructor'}), 'x'.repeat(600001)]) assert.equal(parseDraft(input), null);
});
