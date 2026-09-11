import { kindNames, type SiteKind, type SiteProfile } from './prototype.ts';

export const DRAFT_KEY = 'techlens.prototype-draft.v1';
export type PrototypeDraft = {
  version: 1; profile: SiteProfile; kind: SiteKind; brief: string; siteName: string;
  theme: 'dark' | 'light'; items: string; columns: 2 | 3; search: boolean; filters: boolean;
  html: string; previousHtml: string; dirty: boolean; savedAt: string;
};

export function parseDraft(raw: string | null): PrototypeDraft | null {
  if (!raw || raw.length > 600_000) return null;
  try {
    const d = JSON.parse(raw);
    if (d?.version !== 1 || !Object.hasOwn(kindNames, d.kind) || !d.profile || !['http:', 'https:'].includes(new URL(d.profile.url).protocol)) return null;
    for (const key of ['title', 'description']) if (typeof d.profile[key] !== 'string') return null;
    for (const key of ['headings', 'navigation']) if (!Array.isArray(d.profile[key]) || !d.profile[key].every((v: unknown) => typeof v === 'string')) return null;
    for (const key of ['inspected', 'hasSearch', 'hasVideo', 'hasProducts', 'hasArticles']) if (typeof d.profile[key] !== 'boolean') return null;
    for (const key of ['brief', 'siteName', 'items', 'html', 'previousHtml', 'savedAt']) if (typeof d[key] !== 'string') return null;
    if (!['dark', 'light'].includes(d.theme) || ![2, 3].includes(d.columns) || typeof d.search !== 'boolean' || typeof d.filters !== 'boolean' || typeof d.dirty !== 'boolean') return null;
    return d as PrototypeDraft;
  } catch { return null; }
}
