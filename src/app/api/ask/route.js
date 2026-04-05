import { NextResponse } from 'next/server';
import { searchWiki } from '@/lib/search';
import { getWikiPage } from '@/lib/wiki';

export async function POST(req) {
  try {
    const { question } = await req.json();
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if(!DEEPSEEK_API_KEY) throw new Error("未配置 DEEPSEEK_API_KEY");

    // 取前几个字粗糙检索
    const keywords = question.split(/[\s,，?？。！!]+/);
    const mainKw = keywords.find(k => k.length >= 2) || question;
    
    let matchedPages = await searchWiki(mainKw);
    if(matchedPages.length === 0) matchedPages = await searchWiki(question); // fallback
    
    // 截取前 5 个页面注入上下文
    const contextPages = matchedPages.slice(0, 5);
    
    let contextString = '';
    for(const p of contextPages) {
       const content = await getWikiPage(p.slug);
       contextString += `\n\n--- 页面: ${p.title} (${p.slug}) ---\n${content}`;
    }

    const systemPrompt = `你是一个基于本地维基知识库的智能问答助手。
请仅基于以下提供的参考资料来回答用户的问题。解答时不要长篇大论，尽量保持精简准确。
核心要求：
1. 每当你使用参考资料中的某个事实总结结论时，必须在对应句子末尾添加引用：格式为 [来源:页面名](/look/页面文件名Slug)。
2. 绝对禁止自己编造信息。如果参考资料无法回答该问题，请直接回答“由于本地知识库目前缺乏相关信息，我无法回答”。

以下是你能够检索到的参考资料变体：
${contextString || "没有任何相关参考资料。"}`;

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
          { role: 'user', content: question }
        ],
        temperature: 0.1
      })
    });

    if(!response.ok) throw new Error("LLM API 失败: " + await response.text());
    
    const data = await response.json();
    return NextResponse.json({ answer: data.choices[0].message.content });
    
  } catch(err) {
      console.error(err);
      return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
