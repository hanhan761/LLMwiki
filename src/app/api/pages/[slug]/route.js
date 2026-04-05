import { NextResponse } from 'next/server';
import { getWikiPage, saveWikiPage, deleteWikiPage } from '@/lib/wiki';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const content = await getWikiPage(slug);
    if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { slug } = await params;
    const { markdown, title, summary, tags } = await req.json();
    await saveWikiPage(title || slug, markdown, tags || [], summary || '');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { slug } = await params;
    await deleteWikiPage(slug);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
