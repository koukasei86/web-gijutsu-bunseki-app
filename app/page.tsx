'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, CircleHelp, Code2, ExternalLink, Globe2, LoaderCircle, Server, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Certainty = '確認できた技術' | '可能性が高い技術' | '推定された技術' | '判定できない技術';
type Tech = { name: string; category: string; certainty: Certainty; confidence: number; what: string; where: string; evidence: string; learn: string; actual?: string; command?: string; sample?: string };

const samples: Record<string, { label: string; techs: Tech[] }> = {
  'stripe.com': { label: 'Stripe', techs: [
    { name: 'React', category: 'フロントエンド', certainty: '可能性が高い技術', confidence: 92, what: '画面を部品ごとに組み立てるJavaScriptのライブラリです。', where: 'ナビゲーションや料金表示など、操作に反応して変わる画面に使われます。', evidence: '配信されるJavaScript内のReact特有の構造とファイル名を手がかりにしています。', learn: 'HTML・CSS・JavaScriptの基礎 → Reactの順に学ぶと理解しやすいです。' },
    { name: 'Stripe', category: '決済', certainty: '確認できた技術', confidence: 99, what: 'クレジットカードなどのオンライン決済を扱うサービスです。', where: '支払いフォームや購入処理に使われます。', evidence: 'Stripe公式サイトを想定した、この試作品用のサンプルデータです。', learn: 'フォーム、API、決済時のセキュリティを学ぶと役立ちます。' },
    { name: 'Cloudflare', category: 'サーバー・ホスティング', certainty: '推定された技術', confidence: 68, what: 'サイトを速く、安全に届けるためのネットワークサービスです。', where: '閲覧者とWebサーバーの間で通信を中継します。', evidence: 'HTTPヘッダーに現れる特徴を確認する想定です。デモでは実際の通信はしていません。', learn: 'HTTP、DNS、CDN（世界各地から高速配信する仕組み）を学びましょう。' },
  ]},
  'vercel.com': { label: 'Vercel', techs: [
    { name: 'Next.js', category: 'フレームワーク', certainty: '確認できた技術', confidence: 98, what: 'Reactを使ってWebサイト全体を作りやすくするフレームワークです。', where: 'ページ表示、画面の切り替え、サーバー側の処理に使われます。', evidence: '__NEXT_DATA__ などNext.js特有のHTML情報を確認する想定です。', learn: 'JavaScript → React → Next.jsの順がおすすめです。' },
    { name: 'Vercel', category: 'サーバー・ホスティング', certainty: '確認できた技術', confidence: 99, what: '作ったWebサイトをインターネットへ公開するサービスです。', where: 'サイトの配信とサーバー処理を担当します。', evidence: 'Vercel公式サイトを想定した、この試作品用のサンプルデータです。', learn: 'Git、デプロイ（公開作業）、環境変数の基礎を学びましょう。' },
    { name: 'Google Analytics', category: 'アクセス解析', certainty: '推定された技術', confidence: 61, what: '訪問数や見られたページを調べるアクセス解析サービスです。', where: 'ページ内の計測用スクリプトとして動きます。', evidence: '計測タグに似た文字列を探す想定ですが、デモでは通信していません。', learn: 'scriptタグ、イベント、Cookieの基本が役立ちます。' },
  ]},
  'shopify.com': { label: 'Shopify', techs: [
    { name: 'Shopify', category: 'CMS', certainty: '確認できた技術', confidence: 99, what: 'ネットショップを作り、商品や注文を管理できるサービスです。', where: '商品ページ、カート、注文管理などに使われます。', evidence: 'Shopify特有のCDN URLやHTML属性を確認する想定です。', learn: 'HTML・CSS、Liquidというテンプレート言語、ECサイトの仕組みを学びましょう。' },
    { name: 'React', category: 'フロントエンド', certainty: '可能性が高い技術', confidence: 84, what: '操作に応じて変わる画面を部品で作るライブラリです。', where: '管理画面やインタラクティブな部品に使われます。', evidence: 'JavaScriptファイル内のReact特有の情報を探す想定です。', learn: 'まずJavaScriptの配列・関数・DOM操作を学ぶのがおすすめです。' },
    { name: 'Google Analytics', category: 'アクセス解析', certainty: '推定された技術', confidence: 56, what: 'サイトの訪問状況を調べるサービスです。', where: 'ページ閲覧や購入までの行動の計測に使われます。', evidence: '計測用URLやIDの形式を手がかりにする想定です。', learn: 'Cookie、プライバシー、イベント計測を学びましょう。' },
  ]},
};

const categories = ['フロントエンド', 'フレームワーク', 'CMS', 'サーバー・ホスティング', 'アクセス解析', '広告', '決済', 'その他の外部サービス'];

function hostOf(value: string) {
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(normalized);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  return url.hostname.replace(/^www\./, '').toLowerCase();
}

export default function Home() {
  const [value, setValue] = useState('https://vercel.com');
  const [status, setStatus] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');
  const [result, setResult] = useState(samples['vercel.com']);
  const [error, setError] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const tool = {
      name: 'analyze_website',
      title: 'Webサイトを分析',
      description: '指定した公開WebサイトをTechLensで分析し、検出した技術を画面に表示します。',
      inputSchema: { type: 'object', properties: { url: { type: 'string', description: '分析する公開WebサイトのHTTPまたはHTTPS URL' } }, required: ['url'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const url = typeof input === 'object' && input !== null && 'url' in input ? String((input as { url: unknown }).url) : '';
        hostOf(url);
        setValue(url); setError(''); setStatus('loading');
        const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
        const data = await response.json() as { label?: string; techs?: Tech[]; error?: string };
        if (!response.ok || !data.label || !data.techs) { setStatus('error'); setError(data.error || '分析できませんでした。'); throw new Error(data.error || '分析できませんでした。'); }
        setResult({ label: data.label, techs: data.techs }); setError(''); setIsLive(true); setStatus('success');
        return { status: 'success', mode: 'live', site: data.label, technologies: data.techs.length };
      },
    };
    void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => undefined);
    return () => controller.abort();
  }, []);

  const analyze = async (event?: FormEvent) => {
    event?.preventDefault();
    setError(''); setStatus('loading');
    try {
      hostOf(value.trim());
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: value.trim() }) });
      const data = await response.json() as { label?: string; techs?: Tech[]; error?: string };
      if (!response.ok || !data.label || !data.techs) throw new Error(data.error || '分析できませんでした。');
      setResult({ label: data.label, techs: data.techs }); setIsLive(true); setStatus('success');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'URLの形式を確認してください。例：https://vercel.com'); setStatus('error');
    }
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/8 bg-[#07101f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-[#06111f]"><Code2 size={19}/></span><span className="text-lg font-semibold tracking-tight">TechLens</span><span className="rounded-full border border-cyan-400/25 bg-cyan-400/8 px-2.5 py-1 text-xs font-medium text-cyan-300">PROTOTYPE</span></div>
          <span className="hidden items-center gap-2 text-sm text-slate-400 sm:flex"><ShieldCheck size={16}/> 安全な分析モード</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-11">
        <section className="mb-7"><p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[.18em] text-cyan-400">Website technology explorer</p><h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">このサイト、何でできてる？</h1><p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-400">URLから見つけられる手がかりを、初心者向けの言葉で読み解きます。</p></section>
        <section className="rounded-2xl border border-white/10 bg-[#0c1728] p-4 shadow-2xl shadow-black/20 md:p-6">
          <form onSubmit={analyze} className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="site-url">調べたいサイトのURL</label><div className="relative flex-1"><Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><Input id="site-url" value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://example.com" className="h-12 border-white/10 bg-[#07111f] pl-11 text-base text-white placeholder:text-slate-600 focus-visible:ring-cyan-400" autoCapitalize="none" autoCorrect="off"/></div><Button type="submit" disabled={status === 'loading'} className="h-12 bg-cyan-400 px-6 font-semibold text-[#04101c] hover:bg-cyan-300 disabled:opacity-70">{status === 'loading' ? <><LoaderCircle className="animate-spin"/>分析中...</> : <>サイトを調べる<ArrowRight/></>}</Button></form>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-slate-500">すぐ試す：</span>{Object.keys(samples).map((domain) => <button key={domain} type="button" onClick={() => { setValue(`https://${domain}`); setResult(samples[domain]); setIsLive(false); setStatus('ready'); setError(''); }} className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-1.5 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300">{domain}</button>)}</div>
        </section>
        <div className="mt-5 flex gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] px-4 py-3 text-sm leading-6 text-cyan-100/80"><Sparkles className="mt-0.5 shrink-0 text-cyan-300" size={17}/><p><strong className="text-cyan-200">実サイト分析に対応しました。</strong> 公開HTMLとHTTPヘッダーを取得して判定します。ログインが必要なページや取得を拒否するサイトは分析できません。</p></div>
        {status === 'error' && <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-400/[.07] p-4 text-rose-100"><TriangleAlert className="mt-0.5 shrink-0" size={19}/><div><p className="font-semibold">分析を始められませんでした</p><p className="mt-1 text-sm leading-6 text-rose-200/75">{error}</p></div></div>}
        {status === 'loading' && <section aria-live="polite" className="mt-8"><div className="mb-4 flex items-center gap-3 text-slate-300"><LoaderCircle className="animate-spin text-cyan-400" size={20}/><span>サンプルの判定情報を読み込んでいます…</span></div><div className="grid gap-4 md:grid-cols-2"><div className="h-64 animate-pulse rounded-2xl bg-white/[.05]"/><div className="h-64 animate-pulse rounded-2xl bg-white/[.05]"/></div></section>}
        {(status === 'success' || status === 'ready') && <section className="mt-9" aria-live="polite">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={17}/> {isLive ? '実サイトの分析が完了しました' : '入力例（デモ結果）'}</div><h2 className="text-xl font-semibold text-white">{result.label} で見つかった技術 <span className="ml-1 font-mono text-sm font-normal text-slate-500">{result.techs.length}件</span></h2></div><div className="flex flex-wrap gap-2">{categories.map((category) => { const count = result.techs.filter(t => t.category === category).length; return count ? <span key={category} className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400">{category} <b className="ml-1 text-slate-200">{count}</b></span> : null })}</div></div>
          <div className="grid gap-4 md:grid-cols-2">{result.techs.map((tech) => <article key={tech.name} className="group rounded-2xl border border-white/10 bg-[#0c1728] p-5 transition hover:border-cyan-400/25 md:p-6"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">{tech.category === 'サーバー・ホスティング' ? <Server size={19}/> : tech.category === 'アクセス解析' ? <BarChart3 size={19}/> : <Code2 size={19}/>}</span><div><p className="text-xs text-slate-500">{tech.category}</p><h3 className="mt-0.5 text-lg font-semibold text-white">{tech.name}</h3></div></div><div className="text-right"><p className="font-mono text-xl font-semibold text-cyan-300">{tech.confidence}%</p><p className="text-xs text-slate-500">信頼度</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{width: `${tech.confidence}%`}}/></div><span className="mt-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/[.06] px-2.5 py-1 text-xs font-medium text-cyan-300">{tech.certainty}</span><dl className="mt-5 space-y-4 text-sm leading-6"><div><dt className="font-semibold text-slate-200">これは何？</dt><dd className="mt-1 text-slate-400">{tech.what}</dd></div><div><dt className="font-semibold text-slate-200">どこで使われる？</dt><dd className="mt-1 text-slate-400">{tech.where}</dd></div><div className="rounded-xl bg-[#07111f] p-3.5"><dt className="flex items-center gap-2 font-semibold text-slate-200"><CircleHelp size={15} className="text-cyan-400"/>判定の根拠</dt><dd className="mt-1 text-slate-400">{tech.evidence}</dd></div><div><dt className="font-semibold text-slate-200">作るなら何を学ぶ？</dt><dd className="mt-1 text-slate-400">{tech.learn}</dd></div></dl>
            <Accordion className="mt-5 rounded-xl border border-white/10 bg-[#07111f] px-3"><AccordionItem value="code" className="border-none"><AccordionTrigger className="text-cyan-200 hover:no-underline">コードと確認方法を見る</AccordionTrigger><AccordionContent className="space-y-4 pb-4">
              {tech.actual && <div><p className="mb-2 font-semibold text-slate-300">実際に取得した公開情報</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/8 bg-black/25 p-3 font-mono text-xs leading-5 text-emerald-200">{tech.actual}</pre><p className="mt-2 text-xs text-slate-500">取得した文字列を表示しています。ページ内で実行はされません。</p></div>}
              {tech.command && <div><p className="mb-2 font-semibold text-slate-300">自分で確認するコマンド</p><pre className="overflow-auto whitespace-pre rounded-lg border border-white/8 bg-black/25 p-3 font-mono text-xs leading-5 text-cyan-200">{tech.command}</pre></div>}
              {tech.sample && <div><p className="mb-2 font-semibold text-slate-300">似た機能を作るサンプル</p><pre className="overflow-auto whitespace-pre rounded-lg border border-white/8 bg-black/25 p-3 font-mono text-xs leading-5 text-amber-100">{tech.sample}</pre><p className="mt-2 text-xs text-slate-500">これは取得したコードではなく、学習用に簡単にした再現例です。</p></div>}
            </AccordionContent></AccordionItem></Accordion>
          </article>)}</div>
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400"><div className="flex items-start gap-3"><CircleHelp className="mt-0.5 shrink-0 text-slate-500" size={18}/><p><strong className="text-slate-300">判定できないもの：</strong> サーバー内部の言語やデータベースは、外から見える情報だけでは確実に分かりません。TechLensは、根拠がない技術を断定しない方針です。</p></div></div>
        </section>}
        <footer className="mt-10 flex items-center justify-between border-t border-white/8 py-6 text-xs text-slate-600"><span>TechLens prototype</span><span className="flex items-center gap-1">Public signals only <ExternalLink size={12}/></span></footer>
      </div>
    </main>
  );
}
