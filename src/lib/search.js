import { getAllWikiPages, getWikiPage } from './wiki';

export async function searchWiki(query) {
  const pages = await getAllWikiPages();
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  for(const p of pages) {
    const raw = await getWikiPage(p.slug);
    if(raw) {
      if(p.title.toLowerCase().includes(lowerQuery) || p.summary.toLowerCase().includes(lowerQuery) || raw.toLowerCase().includes(lowerQuery)) {
        results.push(p);
      }
    }
  }
  return results;
}
