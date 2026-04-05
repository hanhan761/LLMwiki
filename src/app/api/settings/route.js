import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'mcp-permissions.json');

export async function GET() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch(e) {
        return NextResponse.json({ permissions: { read: true, write: true, delete: false } });
    }
}

export async function PUT(req) {
    try {
        const { permissions } = await req.json();
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify({ permissions }, null, 2));
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
