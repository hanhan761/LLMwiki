import { NextResponse } from 'next/server';
import { searchWiki } from '@/lib/search';
import { getWikiPage, getAllWikiPages } from '@/lib/wiki';

export async function POST(req) {
  try {
    const payload = await req.json();
    let messages = payload.messages;
    
    // Fallback for single-turn legacy
    if (!messages && payload.question) {
      messages = [{ role: 'user', content: payload.question }];
    }
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const DEEPSEEK_API_KEY = process.env.WIKI_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
    if(!DEEPSEEK_API_KEY) throw new Error("未配置 WIKI_DEEPSEEK_API_KEY");

    // 取最后一条 User 消息做检索
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || "";

    const keywords = lastUserMessage.split(/[\s,，?？。！!]+/);
    const mainKw = keywords.find(k => k.length >= 2) || lastUserMessage;
    
    let matchedPages = await searchWiki(mainKw);
    if(matchedPages.length === 0) matchedPages = await searchWiki(lastUserMessage); // fallback
    
    // 截取前 5 个页面注入上下文
    const contextPages = matchedPages.slice(0, 5);
    
    let contextString = '';
    for(const p of contextPages) {
       const content = await getWikiPage(p.slug);
       contextString += `\n\n--- 页面: ${p.title} (${p.slug}) ---\n${content}`;
    }

    // 获取维基全量目录
    const allPages = await getAllWikiPages();
    const catalogString = allPages.map(p => `- [${p.title}](/look/${p.slug}): ${p.summary}`).join('\n');

    const systemPrompt = `你是一个基于本地维基知识库的智能问答助手。
你的任务是结合用户的多轮历史记录，顺畅地与用户对话。

核心要求：
1. 当用户询问某个具体知识点或概念时，请优先使用“本地参考资料（全文）”来回答。每当你使用参考资料中的事实总结结论时，必须在句子末尾添加引用：格式为 [来源:页面名](/look/页面文件名Slug)。
2. 当用户宏观地询问“你都知道什么”、“你记得什么”、“你的知识库里有什么”时，请参考下方的“全局维基目录”向用户介绍你目前拥有的知识。
3. 如果相关资料为空，但你可以根据“历史对话上下文”（例如用户刚才跟你说了什么）来回答，请直接基于历史记录做出正常回复。
4. 绝对禁止自己编造本地维基中不存在的虚构记录或事件。即使外部知识库知道该问题，也要声明本地维基并无相关研究。

=== 本地参考资料（全文检索命中项） ===
${contextString || "（本次精确检索未命中全文资料）"}

=== 全局维基目录（仅作概览参考） ===
目前本地维基中存放的所有文件及摘要如下：
${catalogString || "（目前维基库似乎是空的）"}`;

    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: llmMessages,
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
