[English](./README.md) | [简体中文](./README_zh.md)

# LLMWiki

LLMWiki 是一个遵循 KISS 原则（保持简单）的极简个人知识库 Web 应用程序，同时也是一个 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务器。它将基于 Next.js 的 Web 界面与强大的 Agentic/AI 能力相结合，允许在兼容 IDE 中的 AI 助手原生管理你基于 Markdown 的知识库。

## 🌟 核心功能

核心功能围绕三个主要操作设计：

- **Drop（摄入知识）：** 智能创建和存储整洁的 Markdown 页面。AI 助手可以使用 `wiki_drop` 工具将提炼出的核心知识直接保存到本地文件系统中。
- **Look（查询管理）：** 浏览和阅读知识库。AI 助手可以通过 `wiki_list` 列出所有概念，并使用 `wiki_read` 获取文档完整内容。
- **Ask（搜索查询）：** 具备 RAG 极速搜索能力。AI 助手可以使用 `wiki_search` 对本地的 Markdown 文件执行全文检索，确保回答准确、接地气且来源可溯。

### 🛡️ 内置带权限控制的 MCP 服务器
LLMWiki 原生充当 MCP 服务器（`mcp-server.js`），利用标准输入/输出（stdio）与 AI 助手进行通信。
它包含了一个细粒度、用户可配置的权限模型（位于 `config/mcp-permissions.json`），用于控制 AI 助手的访问权限：
- `read` 读取（`wiki_list`, `wiki_read`, `wiki_search`）
- `write` 写入（`wiki_drop`）
- `delete` 删除（`wiki_delete`）

## 🛠️ 技术栈

- **框架：** Next.js 15 (App Router)
- **前端：** React 19, `react-markdown`
- **MCP 协议：** `@modelcontextprotocol/sdk`
- **存储介质：** 本地纯 Markdown 文件（无需任何数据库）

## 📁 项目结构

```text
llmwiki/
├── mcp-server.js          # 供 AI 助手调用的 MCP 服务器入口文件
├── SKILL.md               # 供 AI 助手阅读的指南及标准操作规范
├── src/
│   └── app/               # Next.js Web 应用页面和布局文件
├── data/
│   └── wiki/              # 用户的 Markdown 知识库存储目录
├── config/
│   └── mcp-permissions.json # Agent 权限设置 (read/write/delete)
└── package.json           # 项目元数据及依赖
```

## 🚀 快速开始

### 环境依赖

- Node.js (推荐 v18 或更高版本)
- npm 或 pnpm 或 yarn

### 安装步骤

1. 克隆本仓库并安装依赖：
   ```bash
   npm install
   ```

2. 启动本地 Next.js Web 应用程序：
   ```bash
   npm run dev
   ```
   使用浏览器打开 [http://localhost:3000](http://localhost:3000) 即可查看结果。

### 将 MCP 服务器连接至 IDE / AI 助手

要让 AI 助手管理你的个人 Wiki，你需要配置 IDE 的 MCP 客户端（如 Cursor、Windsurf 等），以便使用 Node 启动 `mcp-server.js` 文件。

MCP 客户端配置示例：
```json
{
  "mcpServers": {
    "llmwiki": {
      "command": "node",
      "args": ["/absolute/path/to/LLMwiki/mcp-server.js"]
    }
  }
}
```

## 📜 AI Agent 交互准则
如果你是正在阅读本文档的 AI Agent：请在对用户的知识库执行操作之前，务必仔细阅读 `SKILL.md` 中定义的规则。始终在解答前进行搜索查证、注明信息来源，并主动提出使用 `wiki_drop` 工具来保存有价值的见解和上下文，以帮助用户充实个人维基库！
