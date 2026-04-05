import { NextResponse } from 'next/server';
import { getAllWikiPages } from '@/lib/wiki';

export async function GET() {
  try {
    const pages = await getAllWikiPages();
    return NextResponse.json({ pages });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
