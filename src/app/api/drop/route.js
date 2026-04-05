import { NextResponse } from 'next/server';
import { extractWikiContent } from '@/lib/llm';
import { saveWikiPage } from '@/lib/wiki';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const { title, markdown, tags, summary } = await extractWikiContent(body.content);
    const filename = await saveWikiPage(title, markdown, tags, summary);

    return NextResponse.json({ success: true, filename, title, summary });
  } catch (err) {
    console.error('Drop error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
