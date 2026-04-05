export async function extractWikiContent(content) {
  const DEEPSEEK_API_KEY = process.env.WIKI_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Missing WIKI_DEEPSEEK_API_KEY environment variable. Please set it in .env.local');
  }

  const systemPrompt = `你是一个知识库管理员。你的任务是从用户给定的原始文本中提取核心概念、实体、关键信息，并生成一篇结构良好、可作为维基概念页的 Markdown 文稿。
核心要求：
1. 请提供适合用作文件名的英文或中文短标题作为 \`title\` 字段（不能包含特殊符号）。
2. 请直接输出符合要求的 JSON，结构如下：
{
  "title": "短标题",
  "markdown": "# 标题\\n\\n...正文（请包括合理的段落划分、列表和加粗等）",
  "tags": ["标签1", "标签2"],
  "summary": "一句简短的描述"
}
注意：只输出合法的 JSON，不要输出 \`\`\`json 的代码块，也不要输出多余字符。`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API Error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content;
  try {
    return JSON.parse(rawText);
  } catch (e) {
    // try to fix json block
    const cleaned = rawText.replace(/^```json\s*/, '').replace(/```$/, '');
    return JSON.parse(cleaned);
  }
}
