# 🤖 AI Agent Patterns & Skills Demo

A comprehensive React application demonstrating advanced AI agent capabilities, including project-specific skills (`AGENTS.md`), Retrieval-Augmented Generation (RAG) for codebases, and natural language CLI execution.

This project serves as a playground and educational tool for understanding how to ground Large Language Models (LLMs) in specific project contexts to produce more accurate, secure, and idiomatic code.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Core Features

### 1. AI Agent Skills & `AGENTS.md` (`/src/components/Agents.tsx`)
Demonstrates the concept of injecting project-specific conventions into AI agents.
- **Interactive `AGENTS.md` Editor:** Edit the project's AI onboarding guide in real-time and see how it alters the agent's behavior.
- **Skill Matching:** Automatically detects required skills (e.g., `react-component`, `api-service`) based on the user's prompt.
- **Side-by-Side Comparison:** Compare the output of a "Vanilla" AI agent against a "Context-Aware" agent loaded with your specific project rules.

### 2. Code Scaffolding & RAG (`/src/components/Scaffolds.tsx`)
Shows how Retrieval-Augmented Generation (RAG) can dramatically improve AI code generation by providing existing codebase context.
- **Simulated Codebase:** A mock file system containing standard project files (utils, hooks, API clients).
- **BM25 Semantic Search:** Implements a keyword-based retrieval algorithm to find the most relevant code snippets for a given prompt.
- **Contextual Generation:** The AI uses the retrieved snippets to generate code that perfectly matches the existing project architecture.

### 3. AI-Powered CLI (`/src/components/CLI.tsx`)
An experimental natural language terminal interface.
- **Command Planning:** The agent receives a natural language request, analyzes the simulated environment, and plans a sequence of bash commands.
- **Simulated Execution:** Executes the planned commands in a mock terminal environment, providing realistic stdout/stderr feedback.

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
- The application expects the key to be stored in your browser's `localStorage` under the key `openrouter_api_key`. The UI typically prompts for this when you attempt to run an AI task.

## 🧠 Concepts Explained

### What is `AGENTS.md`?
Just as `README.md` is for human developers, `AGENTS.md` is an onboarding file specifically designed for AI coding assistants (like GitHub Copilot, Cursor, or custom agents). It defines:
- **Project Architecture:** Where things live.
- **Coding Conventions:** Naming, styling, and state management rules.
- **Boundaries:** What the AI should *never* do (e.g., "Never modify the authentication flow without explicit permission").

### Why RAG for Code?
Standard LLMs are trained on public data up to a certain cutoff date. They don't know about *your* specific internal utility functions, custom React hooks, or database schemas. By using RAG, we search your codebase for relevant files and inject them into the LLM's prompt, ensuring the generated code uses your existing tools rather than hallucinating new ones.

## 🛠️ Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Markdown Rendering:** React Markdown
- **AI Integration:** OpenRouter API (supports models like Claude 3.5 Sonnet, GPT-4o, etc.)

## 📝 License
This project is open-source and available under the MIT License.
