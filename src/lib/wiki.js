import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const WIKI_DIR = path.join(DATA_DIR, 'wiki');
const INDEX_FILE = path.join(DATA_DIR, 'index.md');
const LOG_FILE = path.join(DATA_DIR, 'log.md');

export async function saveWikiPage(title, markdown, tags, summary) {
  // Ensure title is safe
  const filename = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_') + '.md';
  const filePath = path.join(WIKI_DIR, filename);
  
  // Format with frontmatter
  const content = `---
title: ${title}
date: ${new Date().toISOString()}
tags: [${(tags || []).join(', ')}]
summary: ${summary}
---

${markdown}
`;

  await fs.writeFile(filePath, content, 'utf-8');

  // Update Log
  const today = new Date().toISOString().split('T')[0];
  const logEntry = `- [${today}] Created/Updated \`${filename}\` - ${summary}\n`;
  await fs.appendFile(LOG_FILE, logEntry, 'utf-8');

  // Update index
  const idxEntry = `- [${title}](/look/${filename.replace('.md', '')}): ${summary}\n`;
  await fs.appendFile(INDEX_FILE, idxEntry, 'utf-8');

  return filename;
}

export async function getAllWikiPages() {
  const files = await fs.readdir(WIKI_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  const pages = [];
  for(const file of mdFiles) {
    const raw = await fs.readFile(path.join(WIKI_DIR, file), 'utf-8');
    const titleMatch = raw.match(/title:\s*(.*)/);
    const summaryMatch = raw.match(/summary:\s*(.*)/);
    pages.push({
      slug: file.replace('.md', ''),
      filename: file,
      title: titleMatch ? titleMatch[1] : file.replace('.md',''),
      summary: summaryMatch ? summaryMatch[1] : ''
    });
  }
  return pages;
}

export async function getWikiPage(slug) {
    try {
        const filePath = path.join(WIKI_DIR, `${slug}.md`);
        const raw = await fs.readFile(filePath, 'utf-8');
        return raw;
    } catch {
        return null;
    }
}

export async function deleteWikiPage(slug) {
    const filePath = path.join(WIKI_DIR, `${slug}.md`);
    await fs.unlink(filePath);
}
