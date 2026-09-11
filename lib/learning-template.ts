const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function buildLearningSite(title: string, light: boolean) {
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src about:; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>${escape(title)} — コード学習</title><style>
:root{color-scheme:${light ? 'light' : 'dark'};--bg:${light ? '#f3f6fc' : '#0a1120'};--panel:${light ? '#ffffff' : '#121d30'};--ink:${light ? '#17243a' : '#ecf3ff'};--muted:${light ? '#53627a' : '#a9b9d0'};--line:${light ? '#d6dfec' : '#2a3950'};--accent:#36bbab}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 system-ui,sans-serif}button,textarea{font:inherit}button{cursor:pointer;border:1px solid var(--line);border-radius:9px;padding:10px 16px;background:var(--panel);color:var(--ink)}button:hover{border-color:var(--accent)}button:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:3px}button:disabled{opacity:.5;cursor:default}header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 26px;border-bottom:1px solid var(--line);flex-wrap:wrap}header strong{font-size:18px}.badge{font-size:14px;color:var(--muted)}main{max-width:1400px;margin:auto;padding:24px}nav{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}nav button[aria-current="step"]{border-color:var(--accent);box-shadow:inset 0 -3px var(--accent)}.intro{display:flex;gap:24px;justify-content:space-between;align-items:center;flex-wrap:wrap}.intro p{color:var(--muted);margin:4px 0}.progress{min-width:180px}.progress span{font-size:14px;color:var(--muted)}progress{display:block;width:100%;height:8px;accent-color:var(--accent)}.workspace{display:grid;grid-template-columns:minmax(240px,.85fr) minmax(280px,1.2fr) minmax(240px,1fr);gap:16px;align-items:stretch}.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}.bar{padding:13px 18px;border-bottom:1px solid var(--line);font-size:14px;color:var(--muted);display:flex;justify-content:space-between}.lesson{padding:22px}.eyebrow{font-size:14px;color:var(--accent)}h1{font-size:24px;margin:8px 0}h2{font-size:20px;margin:10px 0}p{overflow-wrap:anywhere}code,pre{font:14px/1.7 ui-monospace,monospace}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);padding:12px;border-radius:8px}.task{border-left:3px solid var(--accent);padding-left:14px;margin:24px 0}.task strong{display:block}.help{display:flex;gap:8px;flex-wrap:wrap}.help button{font-size:14px}textarea{display:block;resize:vertical;width:100%;min-height:360px;padding:20px;border:0;background:#0d1728;color:#d5e4fa;font:15px/1.9 ui-monospace,monospace;tab-size:2}.actions{display:flex;gap:8px;padding:14px;flex-wrap:wrap}.primary{background:#2eb4a5;color:#06241f;border-color:#2eb4a5;font-weight:700}iframe{border:0;width:100%;min-height:430px;background:white}.feedback{padding:16px 20px;border-top:1px solid var(--line);color:var(--muted)}.feedback[data-success="true"]{color:var(--accent)}footer{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-top:20px;color:var(--muted);font-size:14px}[hidden]{display:none!important}@media(max-width:1000px){.workspace{grid-template-columns:1fr 1.3fr}.output{grid-column:1/-1}iframe{min-height:250px}}@media(max-width:620px){main{padding:16px}.workspace{grid-template-columns:1fr}.output{grid-column:auto}header{padding:16px}textarea{min-height:280px}nav button{flex:1;padding:10px 8px}}
</style></head><body><header><strong>${escape(title)}</strong><span class="badge">HTML & CSS / はじめての3レッスン</span></header><main><div class="intro"><div><span class="eyebrow">LEARN BY DOING</span><h1>書いて、動かして、理解する。</h1><p>説明を読んだら、コードを変えて実行してみましょう。</p></div><div class="progress"><span id="progress-label">0 / 3 レッスン完了</span><progress id="progress" value="0" max="3" aria-label="学習の進み具合"></progress></div></div><nav aria-label="レッスン"><button data-lesson="0" aria-current="step">01 見出し</button><button data-lesson="1">02 文字の色</button><button data-lesson="2">03 ボタン</button></nav><div class="workspace"><section class="panel"><div class="bar">LESSON <span id="step">01 / 03</span></div><div class="lesson"><h2 id="lesson-title"></h2><p id="explanation"></p><div class="task"><strong>やってみよう</strong><p id="task"></p></div><div class="help"><button id="hint-button">ヒント</button><button id="answer-button">解答例を見る</button></div><p id="hint" hidden></p><pre id="answer" hidden></pre></div></section><section class="panel"><div class="bar"><label for="editor">index.html</label><span>編集できます</span></div><textarea id="editor" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="HTMLとCSSのコード入力欄"></textarea><div class="actions"><button id="run" class="primary">実行して確認</button><button id="reset">この課題をリセット</button></div><div id="feedback" class="feedback" role="status">コードを編集して実行してください。</div></section><section class="panel output"><div class="bar">RESULT <span>実行結果</span></div><iframe id="result" sandbox title="入力したHTMLとCSSの実行結果"></iframe></section></div><footer><span>学習用の試作。進捗はこの画面を開いている間だけ保持します。JavaScript・Pythonは実行しません。</span><button id="next" disabled>次のレッスンへ →</button></footer></main><script>
const lessons = [
 { title:'見出しを作ろう', explanation:'HTMLは画面の構造を作る言語です。h1タグは、ページの主題となる見出しを表します。文字の大きさはCSSで変えられます。', task:'h1タグを使って「こんにちは」と表示してください。', hint:'開始タグと終了タグの間に文字を入れます。', initial:'<!-- ここに見出しを書いてみよう -->', answer:'<h1>こんにちは</h1>' },
 { title:'文字の色を変えよう', explanation:'CSSは見た目を指定する言語です。style属性のcolorで、文字の色を変えられます。', task:'見出しのstyle属性にcolor: blue;を設定して、文字を青くしてください。', hint:'h1の開始タグに style="color: blue;" を追加します。', initial:'<h1>こんにちは</h1>', answer:'<h1 style="color: blue;">こんにちは</h1>' },
 { title:'ボタンを作ろう', explanation:'buttonタグで、押せるボタンを作れます。このレッスンではボタンを表示するところまで学びます。', task:'buttonタグを使って「はじめる」と表示してください。', hint:'buttonの開始タグと終了タグで文字を囲みます。', initial:'<h1>私のページ</h1>\\n<!-- 下にボタンを追加しよう -->', answer:'<h1>私のページ</h1>\\n<button>はじめる</button>' }
];
let current = 0;
const completed = new Set();
const drafts = lessons.map(lesson => lesson.initial.replaceAll('\\\\n','\\n'));
const $ = id => document.getElementById(id);
function renderResult(code) {
 $('result').srcdoc = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; style-src &apos;unsafe-inline&apos;; script-src &apos;none&apos;; form-action &apos;none&apos;; base-uri &apos;none&apos;"><style>body{font:16px/1.7 system-ui;padding:24px;color:#19283b;overflow-wrap:anywhere}button{font:inherit;padding:10px 20px}</style></head><body>' + code + '</body></html>';
}
function loadLesson(index) {
 drafts[current] = $('editor').value;
 current = index;
 const lesson = lessons[current];
 $('lesson-title').textContent = lesson.title; $('explanation').textContent = lesson.explanation; $('task').textContent = lesson.task;
 $('hint').textContent = lesson.hint; $('answer').textContent = lesson.answer.replaceAll('\\\\n','\\n'); $('hint').hidden = true; $('answer').hidden = true;
 $('editor').value = drafts[current]; $('step').textContent = '0' + (current + 1) + ' / 03';
 $('feedback').textContent = 'コードを編集して実行してください。'; $('feedback').dataset.success = 'false';
 $('next').disabled = !completed.has(current) || current === 2;
 document.querySelectorAll('[data-lesson]').forEach(button => { if(Number(button.dataset.lesson) === current) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current'); });
 renderResult($('editor').value);
}
$('run').addEventListener('click', () => {
 const code = $('editor').value; drafts[current] = code; renderResult(code);
 const doc = new DOMParser().parseFromString(code, 'text/html');
 const heading = doc.querySelector('h1');
 const ok = current === 0 ? heading?.textContent.trim() === 'こんにちは' : current === 1 ? heading?.style.color === 'blue' : [...doc.querySelectorAll('button')].some(button => button.textContent.trim() === 'はじめる');
 $('feedback').textContent = ok ? 'できました！課題の条件を満たしています。' : 'まだ課題の条件を満たしていません。タグ・文字・style属性を確認してみましょう。';
 $('feedback').dataset.success = String(Boolean(ok));
 if(ok) completed.add(current); else completed.delete(current);
 $('progress').value = completed.size; $('progress-label').textContent = completed.size + ' / 3 レッスン完了';
 $('next').disabled = !ok || current === 2;
 if(completed.size === 3) $('feedback').textContent = '3レッスン完了！見出し・文字色・ボタンを作れました。';
});
$('hint-button').addEventListener('click', () => { $('hint').hidden = !$('hint').hidden; });
$('answer-button').addEventListener('click', () => { $('answer').hidden = !$('answer').hidden; });
$('reset').addEventListener('click', () => { $('editor').value = lessons[current].initial.replaceAll('\\\\n','\\n'); completed.delete(current); $('progress').value = completed.size; $('progress-label').textContent = completed.size + ' / 3 レッスン完了'; loadLesson(current); });
$('next').addEventListener('click', () => { if(current < 2 && completed.has(current)) loadLesson(current + 1); });
document.querySelectorAll('[data-lesson]').forEach(button => button.addEventListener('click', () => loadLesson(Number(button.dataset.lesson))));
$('editor').value = drafts[0]; loadLesson(0);
</script></body></html>`;
}

