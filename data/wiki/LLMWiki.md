---
title: LLMWiki
date: 2026-04-05T12:31:30.825Z
tags: [知识库, MCP, AI代理, Next.js, Markdown]
summary: LLMWiki 是一个结合 Web 界面和 MCP 服务器的个人知识库工具，支持 AI 代理管理 Markdown 文件。
---

# LLMWiki

LLMWiki 是一个基于 KISS 原则的简约个人知识库 Web 应用程序和 Model Context Protocol (MCP) 服务器。它结合了基于 Next.js 的 Web 界面和强大的代理能力，允许兼容 IDE 中的 AI 助手原生管理基于 Markdown 的知识库。

## 核心功能

核心功能围绕三个主要操作设计：

- **Drop（摄取）：** 智能创建和存储干净的 Markdown 页面。AI 代理可以使用 `wiki_drop` 工具将结晶化的知识直接保存到本地文件系统。
- **Look（管理）：** 浏览和阅读知识库。代理可以通过 `wiki_list` 列出所有概念，并使用 `wiki_read` 检索完整内容。
- **Ask（搜索与问答）：** 具备 RAG 就绪的搜索能力。代理可以使用 `wiki_search` 对本地 Markdown 文件执行全文搜索，确保答案正确接地和可追溯。

### 内置 MCP 服务器与权限

LLMWiki 原生充当 MCP 服务器（`mcp-server.js`），使用标准输入/输出（stdio）与 AI 代理通信。它包括一个细粒度的、用户可配置的权限模型（`config/mcp-permissions.json`），用于控制代理对以下操作的访问：

- `read`（`wiki_list`、`wiki_read`、`wiki_search`）
- `write`（`wiki_drop`）
- `delete`（`wiki_delete`）

## 技术栈

- **框架：** Next.js 15（App Router）
- **前端：** React 19、`react-markdown`
- **MCP：** `@modelcontextprotocol/sdk`
- **存储：** 本地 Markdown 文件（无需数据库）

## 项目结构

```text
llmwiki/
├── mcp-server.js          # AI 代理的 MCP 服务器入口点
├── SKILL.md               # AI 代理的标准操作程序和指令
├── src/
│   └── app/               # Next.js Web 应用程序页面和布局
├── data/
│   └── wiki/              # 您的 Markdown 知识库文件
├── config/
│   └── mcp-permissions.json # 代理权限设置（读/写/删除）
└── package.json           # 项目元数据和依赖项
```

## 快速开始

### 先决条件

- Node.js（推荐 v18 或更高版本）
- npm、pnpm 或 yarn

### 安装

1. 克隆仓库并安装依赖项：
   ```bash
   npm install
   ```

2. 本地启动 Next.js Web 应用程序：
   ```bash
   npm run dev
   ```
   在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### 将 MCP 服务器连接到 IDE / AI 代理

要允许您的 AI 助手管理您的维基，您需要配置 IDE 的 MCP 客户端（如 Cursor、Windsurf 或 Claude Desktop）以使用 Node 启动 `mcp-server.js` 文件。

示例 MCP 客户端配置：
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

## 代理指南

如果您是阅读此文的 AI 代理，请在操作用户的知识库之前，请阅读 `SKILL.md` 中定义的规则。始终在回答前进行搜索，引用您的来源，并主动提供 `wiki_drop` 有价值的见解，以构建用户的个人维基。
