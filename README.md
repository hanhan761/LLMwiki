[English](./README.md) | [简体中文](./README_zh.md)

# LLMWiki

LLMWiki is a minimalist, KISS-principled personal knowledge base web application and [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server. It combines a Next.js-based web interface with powerful agentic capabilities, allowing AI assistants in compatible IDEs to natively manage your Markdown-based knowledge base.

## 🌟 Key Features

The core functionalities are designed around three primary actions:

- **Drop (Ingestion):** Create and store clean Markdown pages intelligently. AI agents can use the `wiki_drop` tool to save crystallized knowledge directly to your local file system.
- **Look (Management):** Browse and read your knowledge base. Agents can list all concepts via `wiki_list` and retrieve full contents using `wiki_read`.
- **Ask (Search & Q&A):** RAG-ready search capabilities. Agents can use `wiki_search` to perform full-text searches over your local Markdown files, ensuring that answers are properly grounded and traceable.

### 🛡️ Built-in MCP Server with Permissions
LLMWiki natively acts as an MCP Server (`mcp-server.js`) that uses standard input/output (stdio) to communicate with AI Agents.
It includes a granular, user-configurable permission model (`config/mcp-permissions.json`) to control an Agent's access to:
- `read` (`wiki_list`, `wiki_read`, `wiki_search`)
- `write` (`wiki_drop`)
- `delete` (`wiki_delete`)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 19, `react-markdown`
- **MCP:** `@modelcontextprotocol/sdk`
- **Storage:** Local Markdown files (no database required)

## 📁 Project Structure

```text
llmwiki/
├── mcp-server.js          # The MCP Server entry point for AI Agents
├── SKILL.md               # Standard operating procedures & instructions for AI Agents
├── src/
│   └── app/               # Next.js web application pages and layouts
├── data/
│   └── wiki/              # Your Markdown knowledge base files
├── config/
│   └── mcp-permissions.json # Agent permission settings (read/write/delete)
└── package.json           # Project metadata and dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm or yarn

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the Next.js Web App locally:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Connecting the MCP Server to an IDE / AI Agent

To allow your AI Assistant to manage your wiki, you need to configure your IDE's MCP client (like Cursor, Windsurf, or Claude Desktop) to spawn the `mcp-server.js` file using Node. 

Example MCP Client Configuration:
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

## 📜 Agent Guidelines
If you are an AI agent reading this, please read the rules defined in `SKILL.md` before operating on the user's knowledge base. Always search before answering, cite your sources, and proactively offer to `wiki_drop` valuable insights to build up the user's personal wiki.