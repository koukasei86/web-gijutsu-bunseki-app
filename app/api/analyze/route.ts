import { NextRequest, NextResponse } from 'next/server';
import { safeUrl, fetchSafely } from '@/lib/fetch-site';
import { inspectHtml } from '@/lib/prototype';

import { detect } from '@/lib/detect';
import { classifyError } from '@/lib/analysis-status';

export async function POST(request: NextRequest) {
  let validatedUrl: URL | undefined;
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== 'string' || body.url.length > 2048) return NextResponse.json({ error: 'URLを正しく入力してください。' }, { status: 400 });
    validatedUrl = safeUrl(body.url.trim());
    const { response, html, finalUrl, truncated } = await fetchSafely(validatedUrl);
    const pageTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
    if (/just a moment|attention required|access denied|robot check|verify you are human/i.test(pageTitle)) throw new Error('サイト側のアクセス確認画面が表示され、元ページを読み取れませんでした。');
    const techs = detect(html, response.headers);
    techs.forEach(tech => { tech.command = `# Windows PowerShell 用\ncurl.exe -L -I '${finalUrl.replaceAll("'", "''")}'\ncurl.exe -L '${finalUrl.replaceAll("'", "''")}'`; });
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => { try { return new URL(m[1], finalUrl).toString(); } catch { return m[1]; } }).slice(0, 8);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 120);
    return NextResponse.json({ label: title || new URL(finalUrl).hostname, techs, profile: inspectHtml(html, finalUrl), meta: { finalUrl, checked: ['HTML', 'HTTPヘッダー', 'メタ情報', 'スクリプトURL'], scripts, truncated } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '分析中に問題が発生しました。';
    const friendly = /timed out|abort/i.test(message) ? 'サイトから時間内に応答がありませんでした。' : /internal error|fetch failed|network|dns|ENOTFOUND/i.test(message) ? 'サイトに接続できませんでした。URLを確認するか、下の説明欄から試作できます。' : /Invalid URL|Unexpected token|JSON/i.test(message) ? 'URLを正しく入力してください。' : message;
    return NextResponse.json({ error: friendly, issue: classifyError(friendly), fallback: validatedUrl ? { url: validatedUrl.toString(), title: validatedUrl.hostname, description: '', headings: [], navigation: [], hasSearch: false, hasVideo: false, hasProducts: false, hasArticles: false, inspected: false } : undefined }, { status: 422 });
  }
}

