# 🤖 AI Agent Patterns & Skills Demo

A comprehensive React application demonstrating advanced AI agent capabilities, including project-specific skills (`SKILL.md`), project onboarding (`AGENTS.md`), Retrieval-Augmented Generation (RAG) for codebases, Tool Calling, Model Context Protocol (MCP), and Multi-Agent Platforms.

This project serves as an interactive curriculum, playground, and educational tool for understanding how to ground Large Language Models (LLMs) in specific project contexts, utilize tools, and orchestrate multiple agents to produce more accurate, secure, and idiomatic code.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Curriculum & Core Features

### 1. Basic Capabilities (`/src/components/ModelComparison.tsx`)
Compare raw model outputs across different open and closed-weight models.
- **Model Comparison:** Test prompts against various leading models (GPT-4o, Claude 3.5 Sonnet, Llama 3.3, Gemini 2.5 Pro, DeepSeek V3.2, etc.).

### 2. Scaffolds & Harnesses (`/src/components/Scaffolds.tsx`)
Shows how Retrieval-Augmented Generation (RAG) can dramatically improve AI code generation by providing existing codebase context, similar to how IDEs like Cursor and Windsurf integrate AI.
- **Simulated Codebase:** A mock file system containing standard project files.
- **Contextual Generation:** The AI uses retrieved snippets to generate code that matches the existing project architecture.

### 3. Tool Calling & Search (`/src/components/ToolCalling.tsx`)
Explore how models interact with the outside world using tools and web search.
- **Function Calling:** Demonstrates how LLMs can execute predefined functions to fetch real-time data or perform actions.

### 4. Model Context Protocol (MCP) (`/src/components/MCP.tsx`)
Learn about standardizing how models access context and local resources.
- **Resource Integration:** Shows how MCP provides a unified way for AI models to securely interact with local files, databases, and APIs.

### 5. Skills (`/src/components/Agents.tsx`)
Demonstrates the concept of injecting domain-specific expertise into AI agents.
- **Reusable `SKILL.md` Files:** Teach agents specific conventions (e.g., `react-component`, `api-service`).
- **Skill Matching:** Automatically detects required skills based on the user's prompt.

### 6. Agents & `AGENTS.md` (`/src/components/AgentsMD.tsx`)
The open standard for briefing AI coding agents on your project.
- **Interactive `AGENTS.md` Editor:** Edit the project's AI onboarding guide (build commands, conventions, boundaries) in real-time.
- **Side-by-Side Comparison:** Compare the output of a "Vanilla" AI agent against a "Context-Aware" agent loaded with your specific project rules.

### 7. The CLI Renaissance (`/src/components/CLI.tsx`)
An experimental natural language terminal interface.
- **Command Planning:** The agent receives a natural language request and plans a sequence of bash commands.
- **Simulated Execution:** Executes the planned commands in a mock terminal environment, providing realistic feedback.

### 8. Multi-Agent Platforms (`/src/components/MultiAgent.tsx`)
Orchestrating multiple specialized agents to solve complex problems.
- **Agent Collaboration:** Demonstrates how different agents (e.g., Planner, Coder, Reviewer) can work together in a pipeline to accomplish a larger goal.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Configuration
This application uses the **OpenRouter API** to interact with LLMs. 
- You will need an OpenRouter API key.
- The application expects the key to be stored in your browser's `localStorage` under the key `openrouter_api_key`. The UI typically prompts for this in the Setup section when you attempt to run an AI task.

## 🧠 Concepts Explained

### What is `AGENTS.md` vs `SKILL.md`?
- **`AGENTS.md`**: Just as `README.md` is for human developers, `AGENTS.md` is an onboarding file specifically designed for AI coding assistants. It defines project architecture, coding conventions, and boundaries (what the AI should *never* do).
- **`SKILL.md`**: Modular, reusable files that teach an agent a specific skill (e.g., how to write a React component using Tailwind, or how to interact with a specific database).

### Why RAG for Code?
Standard LLMs are trained on public data up to a certain cutoff date. They don't know about *your* specific internal utility functions, custom React hooks, or database schemas. By using RAG, we search your codebase for relevant files and inject them into the LLM's prompt, ensuring the generated code uses your existing tools rather than hallucinating new ones.

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Markdown Rendering:** React Markdown
- **AI Integration:** OpenRouter API (supports models like Claude 3.5 Sonnet, GPT-4o, DeepSeek, etc.)

## 📝 License
This project is open-source and available under the MIT License.
