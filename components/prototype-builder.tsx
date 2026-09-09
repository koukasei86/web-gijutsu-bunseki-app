'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { buildPrototype, kindNames, suggestKind, type SiteKind, type SiteProfile } from '@/lib/prototype';

export function PrototypeBuilder({ profile }: { profile: SiteProfile }) {
  const [kind, setKind] = useState<SiteKind>(suggestKind(profile));
  const [brief, setBrief] = useState('');
  const [html, setHtml] = useState('');
  const [state, setState] = useState<'proposal' | 'generating' | 'ready' | 'dismissed'>('proposal');
  const [message, setMessage] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const generate = async () => {
    setMessage(''); setState('generating'); setPreviewReady(false);
    try {
      // Yield so the generation state paints before creating the document.
      await new Promise(resolve => setTimeout(resolve, 50));
      const output = buildPrototype(profile, kind, brief);
      setHtml(output.html); setPreviewKey(k => k + 1); setState('ready');
    } catch (error) { setMessage(error instanceof Error ? error.message : '生成できませんでした。もう一度お試しください。'); setState('proposal'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'techlens-prototype.html'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (state === 'dismissed') return <section className="mt-6 rounded-xl border border-white/10 p-5"><p className="text-slate-300">今回はコードを生成しません。</p><Button className="mt-3" variant="outline" onClick={() => setState('proposal')}>試作の提案をもう一度見る</Button></section>;
  return <section className="mt-7 rounded-2xl border border-cyan-300/25 bg-[#0c1728] p-5 md:p-6" aria-labelledby="prototype-title">
    <p className="text-sm text-cyan-300">技術が分からなくても、作り方を試せます</p>
    <h2 id="prototype-title" className="mt-2 text-xl font-semibold">似た構成のサイトを作ってみますか？</h2>
    <p className="mt-2 text-base leading-7 text-slate-300">元サイトのコードとは別に、学習用のHTML・CSS・JavaScriptを生成します。選んでから生成するので、まずは提案だけ確認できます。</p>
    <div className="mt-4 rounded-xl bg-[#07111f] p-4 text-sm leading-6 text-slate-300">
      <p className="font-semibold text-cyan-200">{profile.inspected ? '公開HTMLから確認できたこと' : '元ページの内容は確認できませんでした'}</p>
      {profile.inspected ? <><p className="mt-2 break-words">ページ名：{profile.title}</p>{profile.description && <p className="mt-1">説明：{profile.description}</p>}<p className="mt-1">見出し：{profile.headings.length ? profile.headings.slice(0, 4).join(' / ') : '取得できませんでした'}</p><p className="mt-2 text-slate-400">HTMLの文字情報からの提案です。画面の配色や配置、内部機能は確認できていません。</p></> : <p className="mt-2">取得拒否や通信エラーの場合、URLだけでは見た目を判断できません。下に作りたい画面を説明してください。説明をもとに試作します。</p>}
    </div>
    <fieldset disabled={state === 'generating'} className="mt-5">
      <legend className="text-base font-semibold">試作する構成</legend>
      <RadioGroup aria-label="試作する構成" value={kind} onValueChange={value => { setKind(value as SiteKind); setState('proposal'); setHtml(''); }} className="mt-3 grid gap-3 sm:grid-cols-2">{(Object.keys(kindNames) as SiteKind[]).map(key => <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${kind === key ? 'border-cyan-300/60 bg-cyan-300/10' : 'border-white/10'}`}><RadioGroupItem value={key}/>{kindNames[key]}{profile.inspected && key === suggestKind(profile) ? '（推定案）' : ''}</label>)}</RadioGroup>
      <label htmlFor="prototype-brief" className="mt-5 block text-base font-semibold">作りたい画面の説明 {profile.inspected ? '（任意）' : '（必須・10文字以上）'}</label>
      <Textarea id="prototype-brief" value={brief} maxLength={1000} onChange={e => { setBrief(e.target.value); setState('proposal'); setHtml(''); }} placeholder="例：映画をカードで並べて、タイトル検索と詳細表示を試したい" className="mt-2 min-h-24 w-full rounded-xl border border-white/20 bg-[#07111f] p-3 text-base text-white focus:outline-cyan-300"/>
    </fieldset>
    <p className="mt-3 text-sm leading-6 text-slate-400">この版はAIによる自由生成ではなく、公開情報と選んだ構成を学習用テンプレートに組み合わせます。説明は紹介文に反映されます。検索・カテゴリー切替・{kind === 'shop' ? 'お試しカート' : '詳細表示'}が動きます。ログイン、決済、動画の再生・配信は含みません。</p>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={state === 'generating'} onClick={generate} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">{state === 'generating' ? '試作コードを生成中…' : state === 'ready' ? 'もう一度生成する' : 'コードを生成して試す'}</Button><Button variant="outline" disabled={state === 'generating'} onClick={() => { setState('dismissed'); setHtml(''); }}>今回は生成しない</Button></div>
    {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
    {state === 'ready' && <div className="mt-6 border-t border-white/10 pt-5">
      <h3 className="text-lg font-semibold">試作プレビュー</h3><p role="status" className="mt-2 text-sm text-cyan-200">{previewReady ? 'プレビューを読み込みました。検索やボタンを操作して試せます。' : 'プレビューを読み込んでいます…'}</p>
      <iframe key={previewKey} title="生成した学習用サイトのプレビュー" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} onLoad={() => setPreviewReady(true)} className="mt-4 h-[560px] w-full rounded-xl border border-white/20 bg-[#0b1322]"/>
      <div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" onClick={() => { setPreviewReady(false); setPreviewKey(k => k + 1); }}>プレビューをリセット</Button><Button onClick={download}>HTMLを保存</Button><Button variant="outline" onClick={() => setShowCode(v => !v)} aria-expanded={showCode}>{showCode ? 'コードを閉じる' : 'コードを見る'}</Button><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(html); setMessage('コードをコピーしました。'); } catch { setMessage('コピーできませんでした。「HTMLを保存」を使ってください。'); } }}>コードをコピー</Button></div>
      <p className="mt-3 text-sm leading-6 text-slate-400">保存したHTMLをブラウザで開くと単体で動きます。HTMLは画面の構造、CSSは見た目、JavaScriptは検索やボタンの動きを担当します。</p>
      {showCode && <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-black/30 p-4 text-sm leading-6 text-cyan-100"><code>{html}</code></pre>}
    </div>}
  </section>;
}

