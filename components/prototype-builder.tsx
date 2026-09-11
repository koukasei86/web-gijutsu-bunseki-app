'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DRAFT_KEY, type PrototypeDraft } from '@/lib/prototype-draft';
import { buildPrototype, kindNames, kindFeatures, suggestKind, type SiteKind, type SiteProfile } from '@/lib/prototype';

export function PrototypeBuilder({ profile, initialDraft, onSaved }: { profile: SiteProfile; initialDraft?: PrototypeDraft | null; onSaved?: (draft: PrototypeDraft) => void }) {
  const [kind, setKind] = useState<SiteKind>(initialDraft?.kind || suggestKind(profile));
  const [brief, setBrief] = useState(initialDraft?.brief || '');
  const [html, setHtml] = useState(initialDraft?.html || '');
  const [state, setState] = useState<'proposal' | 'generating' | 'ready' | 'dismissed'>(initialDraft?.html ? 'ready' : 'proposal');
  const [message, setMessage] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [siteName, setSiteName] = useState(initialDraft?.siteName || '');
  const [theme, setTheme] = useState<'dark' | 'light'>(initialDraft?.theme || 'dark');
  const [mobile, setMobile] = useState(false);
  const [items, setItems] = useState(initialDraft?.items || '');
  const [columns, setColumns] = useState<2 | 3>(initialDraft?.columns || 3);
  const [search, setSearch] = useState(initialDraft?.search ?? true);
  const [filters, setFilters] = useState(initialDraft?.filters ?? true);
  const [dirty, setDirty] = useState(initialDraft?.dirty || false);
  const [previousHtml, setPreviousHtml] = useState(initialDraft?.previousHtml || '');
  const [saveStatus, setSaveStatus] = useState('');
  const invalidate = () => { setDirty(true); setMessage(''); };
  useEffect(() => {
    if (!html && !brief && !siteName && !items) return;
    {
      const draft: PrototypeDraft = { version: 1, profile, kind, brief, siteName, theme, items, columns, search, filters, html, previousHtml, dirty, savedAt: new Date().toISOString() };
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setSaveStatus('この端末に下書きを保存しました。再読み込み後も「前回の試作を開く」から戻れます。'); onSaved?.(draft); }
      catch { setSaveStatus('このブラウザーでは下書きを保存できません。「HTMLを保存」で残してください。'); }
    }

  }, [profile, kind, brief, siteName, theme, items, columns, search, filters, html, previousHtml, dirty, onSaved]);
  const generate = async () => {
    setMessage(''); setState('generating'); setPreviewReady(false);
    try {
      // Yield so the generation state paints before creating the document.
      await new Promise(resolve => setTimeout(resolve, 50));
      const output = buildPrototype(profile, kind, brief, { name: siteName, theme, items: items.split('\n'), columns, search, filters });
      setPreviousHtml(html); setDirty(false); setHtml(output.html); setPreviewKey(k => k + 1); setState('ready');
    } catch (error) { setMessage(error instanceof Error ? error.message : '生成できませんでした。もう一度お試しください。'); setState(html ? 'ready' : 'proposal'); }
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
      <RadioGroup aria-label="試作する構成" value={kind} onValueChange={value => { setKind(value as SiteKind); invalidate(); }} className="mt-3 grid gap-3 sm:grid-cols-2">{(Object.keys(kindNames) as SiteKind[]).map(key => <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${kind === key ? 'border-cyan-300/60 bg-cyan-300/10' : 'border-white/10'}`}><RadioGroupItem value={key}/>{kindNames[key]}{profile.inspected && key === suggestKind(profile) ? '（推定案）' : ''}</label>)}</RadioGroup>
      <label htmlFor="prototype-brief" className="mt-5 block text-base font-semibold">作りたい画面の説明 {profile.inspected ? '（任意）' : '（必須・10文字以上）'}</label>
      <Textarea id="prototype-brief" value={brief} maxLength={1000} onChange={e => { setBrief(e.target.value); invalidate(); }} placeholder="例：映画をカードで並べて、タイトル検索と詳細表示を試したい" className="mt-2 min-h-24 w-full rounded-xl border border-white/20 bg-[#07111f] p-3 text-base text-white focus:outline-cyan-300"/>
      <Button type="button" variant="outline" disabled={!brief.trim()} className="mt-3" onClick={() => { setKind(suggestKind(profile, brief)); invalidate(); setMessage('説明のキーワードから構成を提案しました。下の「今回作るもの」を確認してください。'); }}>説明から構成を提案する</Button>
      <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><label htmlFor="prototype-name" className="block text-base font-semibold">試作のサイト名（任意）</label><Input id="prototype-name" maxLength={60} value={siteName} onChange={e => { setSiteName(e.target.value); invalidate(); }} placeholder={kind === 'learning' ? 'CodeSteps' : 'Learning Studio'} className="mt-2 h-11 border-white/20 bg-[#07111f] text-base"/></div><div><p id="theme-label" className="text-base font-semibold">配色</p><RadioGroup aria-labelledby="theme-label" value={theme} onValueChange={v => { setTheme(v as 'dark' | 'light'); invalidate(); }} className="mt-2 flex flex-wrap gap-4"><label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="dark"/>ダーク</label><label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="light"/>ライト</label></RadioGroup></div></div>
      {kind !== 'learning' && <div className="mt-5 rounded-xl border border-white/10 p-4"><h3 className="font-semibold">生成する内容を調整</h3><p className="mt-1 text-sm leading-6 text-slate-400">ここで選んだ内容は、次に生成する試作に反映されます。</p><label htmlFor="prototype-items" className="mt-4 block text-sm font-semibold">表示する項目（任意・1行1項目、最大6件）</label><Textarea id="prototype-items" value={items} maxLength={606} onChange={e => { setItems(e.target.value); invalidate(); }} placeholder="はじめてのHTML
CSSで見た目を変える
JavaScriptで動かす" className="mt-2 min-h-28 border-white/20 bg-[#07111f] text-base"/><div className="mt-3 flex flex-wrap gap-x-6 gap-y-2"><label className="flex min-h-11 cursor-pointer items-center gap-3"><Checkbox checked={search} onCheckedChange={v => { setSearch(v); invalidate(); }}/>検索を付ける</label><label className="flex min-h-11 cursor-pointer items-center gap-3"><Checkbox checked={filters} onCheckedChange={v => { setFilters(v); invalidate(); }}/>カテゴリー切替を付ける</label></div>{(kind === 'catalog' || kind === 'shop') && <div className="mt-3"><p id="columns-label" className="text-sm font-semibold">PCでの一覧の列数（スマホは1列）</p><RadioGroup aria-labelledby="columns-label" value={String(columns)} onValueChange={v => { setColumns(v === '2' ? 2 : 3); invalidate(); }} className="mt-2 flex gap-5"><label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="2"/>2列</label><label className="flex min-h-11 items-center gap-2"><RadioGroupItem value="3"/>3列</label></RadioGroup></div>}</div>}
    </fieldset>
    <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4"><h3 className="font-semibold text-cyan-100">今回作るもの：{kindNames[kind]}</h3><ul className="mt-3 space-y-1 text-sm leading-6 text-slate-200">{kindFeatures[kind].filter(feature => !feature.includes('検索')).concat(kind === 'learning' ? [] : [...(search ? ['キーワード検索'] : []), ...(filters ? ['カテゴリー切替'] : [])]).map(feature => <li key={feature}>✓ {feature}</li>)}</ul><p className="mt-3 text-sm leading-6 text-slate-400">{kind === 'learning' ? '教材はオリジナルの固定3課題です。Python・JavaScriptの実行や学習履歴の保存は含みません。' : 'データはサンプルです。ログイン・決済・動画配信・サーバーへの保存は含みません。'}</p></div>
    <p className="mt-3 text-sm leading-6 text-slate-400">説明のキーワードと公開情報から構成を選ぶ方式です。自由な文章をすべて機能に変えるAI生成ではありません。生成する機能は上の一覧に限られます。</p>
    <div className="mt-5 flex flex-wrap gap-3"><Button disabled={state === 'generating' || (!profile.inspected && brief.trim().length < 10)} onClick={generate} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">{state === 'generating' ? '試作コードを生成中…' : html ? (dirty ? '変更を反映して生成する' : 'もう一度生成する') : 'コードを生成して試す'}</Button><Button variant="outline" disabled={state === 'generating'} onClick={() => { setState('dismissed'); }}>今回は生成しない</Button></div>
    {saveStatus && <p role="status" className="mt-3 text-sm leading-6 text-slate-400">{saveStatus}</p>}
    {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
    {html && <div className="mt-6 border-t border-white/10 pt-5">
      <h3 className="text-lg font-semibold">試作プレビュー</h3>{dirty && <p role="status" className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm leading-6 text-amber-200">設定を変更しました。現在のプレビュー・保存用HTMLは変更前の試作です。「変更を反映して生成する」で更新できます。</p>}<p role="status" className="mt-2 text-sm text-cyan-200">{previewReady ? 'プレビューを読み込みました。画面内のボタンや入力欄を操作できます。' : 'プレビューを読み込んでいます…'}</p>
      <div className="mt-4 flex gap-2" aria-label="プレビューの表示幅"><Button variant="outline" aria-pressed={!mobile} onClick={() => setMobile(false)}>PC幅</Button><Button variant="outline" aria-pressed={mobile} onClick={() => setMobile(true)}>スマホ幅</Button></div>
      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-2"><iframe key={previewKey} title="生成した学習用サイトのプレビュー" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} onLoad={() => setPreviewReady(true)} style={{ maxWidth: mobile ? 390 : '100%' }} className="mx-auto block h-[680px] w-full rounded-xl border border-white/20 bg-[#0b1322]"/></div>
      <div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" onClick={() => { setPreviewReady(false); setPreviewKey(k => k + 1); }}>プレビューをリセット</Button>{previousHtml && <Button variant="outline" onClick={() => { const current = html; setHtml(previousHtml); setPreviousHtml(current); setDirty(true); setPreviewKey(k => k + 1); setPreviewReady(false); setMessage("ひとつ前の試作と切り替えました。設定欄は現在の内容を保持しています。"); }}>ひとつ前の試作に切り替える</Button>}<Button onClick={download}>HTMLを保存</Button><Button variant="outline" onClick={() => setShowCode(v => !v)} aria-expanded={showCode}>{showCode ? 'コードを閉じる' : 'コードを見る'}</Button><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(html); setMessage('コードをコピーしました。'); } catch { setMessage('コピーできませんでした。「HTMLを保存」を使ってください。'); } }}>コードをコピー</Button></div>
      <p className="mt-3 text-sm leading-6 text-slate-400">保存したHTMLをブラウザで開くと単体で動きます。HTMLは画面の構造、CSSは見た目、JavaScriptは検索やボタンの動きを担当します。</p>
      {showCode && <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-black/30 p-4 text-sm leading-6 text-cyan-100"><code>{html}</code></pre>}
    </div>}
  </section>;
}

