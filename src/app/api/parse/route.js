import { NextResponse } from 'next/server';

// 禁用 Next.js 默认的 body parser，因为我们需要处理 multipart
export const config = { api: { bodyParser: false } };

// 解析 PDF
async function parsePdf(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text;
}

// 解析 DOCX
async function parseDocx(buffer) {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// 解析图片 (Base64 -> 调用 Qwen VL)
async function parseImage(buffer, mimeType) {
  const QWEN_API_KEY = process.env.QWEN_API_KEY;
  if (!QWEN_API_KEY) throw new Error('Missing QWEN_API_KEY');

  const base64 = buffer.toString('base64');
  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: '请详细描述这张图片中的所有可见信息，包括文字、图表、表格、图像内容，并以清晰的结构化文本形式输出，不要遗漏任何信息。',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Qwen VL API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = file.type;
    const name = file.name || '';

    let text = '';

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      text = await parsePdf(buffer);
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      text = await parseDocx(buffer);
    } else if (mime.startsWith('image/')) {
      text = await parseImage(buffer, mime);
    } else if (
      mime.startsWith('text/') ||
      name.endsWith('.md') ||
      name.endsWith('.txt') ||
      name.endsWith('.csv') ||
      name.endsWith('.json')
    ) {
      // 纯文本直接读取
      text = buffer.toString('utf-8');
    } else {
      // 未知格式：尝试用 utf-8 读取
      text = buffer.toString('utf-8');
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error('Parse error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
