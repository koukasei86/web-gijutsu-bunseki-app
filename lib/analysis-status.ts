export type AnalysisMeta = { finalUrl: string; checked: string[]; scripts: string[]; truncated: boolean };
export type AnalysisIssue = { kind: string; title: string; message: string; next: string };

export function classifyError(message: string): AnalysisIssue {
  if (/timeout|timed out|abort|時間内/i.test(message)) return { kind: 'timeout', title: '応答に時間がかかっています', message: '制限時間内にページを取得できませんでした。', next: '時間をおいて再試行するか、作りたい内容から試作を始められます。' };
  if (/HTTP (401|403|429)|アクセス確認|取得拒否/i.test(message)) return { kind: 'blocked', title: 'サイト側で取得が制限されています', message: 'アクセス制限や混雑のため、ページの内容を確認できませんでした。', next: 'ログインやアクセス制限のない公開ページを試すか、説明から試作できます。' };
  if (/HTML|Webページでは/i.test(message)) return { kind: 'not_html', title: 'WebページのURLが必要です', message, next: '画像やPDFのURLではなく、それを掲載しているページのURLを入力してください。' };
  if (/Invalid URL|Unexpected token|JSON|URLを|HTTPまたはHTTPS|ポート/i.test(message)) return { kind: 'invalid_url', title: 'URLを確認してください', message: '公開されている通常のHTTPまたはHTTPSのURLを入力してください。', next: '例：https://example.com（example.comだけでも入力できます）' };
  return { kind: 'unavailable', title: 'ページを取得できませんでした', message: /HTTP \d+/.test(message) ? message : 'URLの誤りや一時的な通信の問題が考えられます。', next: 'URLを確認して再試行するか、説明から試作できます。' };
}

export function summarizeTechnologies(techs: { name: string; category: string }[]) {
  if (!techs.length) return 'ページは取得できましたが、対応する技術の手がかりは見つかりませんでした。技術を使っていないという意味ではありません。';
  const groups = [ ['画面づくり', ['フロントエンド', 'フレームワーク', 'CMS']], ['配信', ['サーバー・ホスティング']], ['外部サービス', ['アクセス解析', '広告', '決済', 'その他の外部サービス']] ] as const;
  return groups.map(([label, categories]) => {
    const names = techs.filter(t => (categories as readonly string[]).includes(t.category)).map(t => t.name);
    return names.length ? `${label}には ${names.join('・')} の手がかりがあります。` : '';
  }).filter(Boolean).join(' ');
}
