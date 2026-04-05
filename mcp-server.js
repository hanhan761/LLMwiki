import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const WIKI_DIR = path.join(DATA_DIR, 'wiki');
const LOG_FILE = path.join(DATA_DIR, 'log.md');
const CONFIG_PATH = path.join(process.cwd(), 'config', 'mcp-permissions.json');

async function getPerms() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(data).permissions;
    } catch {
        return { read: true, write: true, delete: false };
    }
}

const server = new Server(
  { name: "llmwiki-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const perms = await getPerms();
  const tools = [];
  
  if (perms.read) {
    tools.push({
      name: "wiki_list",
      description: "列出知识库所有页面的索引",
      inputSchema: { type: "object", properties: {} }
    });
    tools.push({
      name: "wiki_read",
      description: "读取指定 Wiki 页面的完整内容",
      inputSchema: { 
        type: "object", 
        properties: { slug: { type: "string", description: "页面文件名(不含.md)" } },
        required: ["slug"]
      }
    });
    tools.push({
      name: "wiki_search",
      description: "按关键词搜索知识库文本",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "搜索关键词" } },
        required: ["query"]
      }
    });
  }

  if (perms.write) {
    tools.push({
      name: "wiki_drop",
      description: "写入纯净Markdown页面到知识库",
      inputSchema: {
        type: "object",
        properties: {
            title: { type: "string", description: "页面短标题(无特殊字符)" },
            markdown: { type: "string", description: "页面正文Markdown" },
            summary: { type: "string", description: "一句简短的总结" }
        },
        required: ["title", "markdown", "summary"]
      }
    });
  }
  
  if (perms.delete) {
    tools.push({
        name: "wiki_delete",
        description: "删除某个知识库页面",
        inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] }
    });
  }

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const perms = await getPerms();
  
  try {
    if (request.params.name === "wiki_list" && perms.read) {
      const files = await fs.readdir(WIKI_DIR);
      return { toolResult: files.filter(f => f.endsWith('.md')).join('\n') };
    }

    if (request.params.name === "wiki_read" && perms.read) {
      const slug = request.params.arguments.slug;
      const content = await fs.readFile(path.join(WIKI_DIR, `${slug}.md`), 'utf-8');
      return { toolResult: content };
    }
    
    if (request.params.name === "wiki_drop" && perms.write) {
      const { title, markdown, summary } = request.params.arguments;
      const filename = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_') + '.md';
      
      const content = \`---
title: \${title}
date: \${new Date().toISOString()}
summary: \${summary}
---

\${markdown}
\`;
      await fs.writeFile(path.join(WIKI_DIR, filename), content, 'utf-8');
      await fs.appendFile(LOG_FILE, \`- [\${new Date().toISOString()}] Agent created \${filename}\\n\`, 'utf-8');
      
      return { toolResult: \`成功写入页面: \${filename}\` };
    }
    
    if (request.params.name === "wiki_search" && perms.read) {
        const query = request.params.arguments.query.toLowerCase();
        const files = await fs.readdir(WIKI_DIR);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        
        let out = [];
        for(let file of mdFiles) {
            const raw = await fs.readFile(path.join(WIKI_DIR, file), 'utf-8');
            if(raw.toLowerCase().includes(query)) {
                out.push(file);
            }
        }
        return { toolResult: "包含匹配内容的页面: " + out.join(', ') };
    }

    if (request.params.name === "wiki_delete" && perms.delete) {
        const slug = request.params.arguments.slug;
        await fs.unlink(path.join(WIKI_DIR, \`\${slug}.md\`));
        return { toolResult: \`已删除 \${slug}.md\` };
    }

    throw new Error(\`Tool not found or permission denied: \${request.params.name}\`);
  } catch (error) {
    return { error: error.message };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("LLM Wiki MCP server running on stdio");
