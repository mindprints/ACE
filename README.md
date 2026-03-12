# 🚀 AI Coding Evolution Course

An interactive, chronological web application designed to teach developers how AI-assisted coding has evolved—from basic chat interfaces to autonomous multi-agent systems. 

This project serves as both an educational curriculum and a live playground. By connecting your own OpenRouter API key, you can interact with live AI models directly within the course modules to see these concepts in action.

## ✨ Features & Curriculum

The course is divided into 7 chronological modules:

### 1. Setup & Configuration
A secure, local-only configuration module. Your OpenRouter API key is stored exclusively in your browser's `localStorage` to power the live demos without routing through a backend server.

### 2. Basic Capabilities (Interactive)
A side-by-side chat interface allowing you to compare raw model outputs (e.g., GPT-4o vs. Claude 3.5 Sonnet vs. Llama 3). Understand baseline reasoning, coding styles, and speed differences between top-tier LLMs.

### 3. Scaffolds & Harnesses (Informational)
Learn how modern AI IDEs (like Cursor and Windsurf) bridge the context gap. This module explains Codebase Indexing (RAG), Editor Context injection, and Fast Apply/Diffing mechanisms that turn chatbots into pair programmers.

### 4. Tool Calling & Search (Interactive)
Watch models break out of their frozen training data. This interactive chat demonstrates how models formulate JSON requests to execute external functions (mocked as `get_weather` and `get_stock_price`) to gather real-time data before answering.

### 5. Model Context Protocol / MCP (Informational)
Understand the "USB-C for AI." This module breaks down Anthropic's open standard (MCP) that solves the N-to-N integration nightmare, standardizing how AI models (Clients) request information from local data sources (Servers) using Resources, Tools, and Prompts.

### 6. The CLI Renaissance (Interactive)
A terminal-native AI experience. Type natural language commands (e.g., *"Find all TODOs in the src folder"*) and watch the AI translate your intent into a sequence of bash commands, simulating execution in a mock terminal UI.

### 7. Multi-Agent Platforms (Interactive)
Step into the future of AI orchestration. Give a complex goal to the system and watch a **Coder Agent** write the initial implementation, followed immediately by a **Reviewer Agent** that critiques the code for security/performance and provides a refactored final version.

## 🛠️ Tech Stack

* **Frontend Framework:** React 18 with TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Markdown Rendering:** `react-markdown`
* **AI Integration:** OpenRouter API (OpenAI-compatible endpoints)

## 🚀 Getting Started

### Prerequisites
To use the interactive features, you will need an API key from [OpenRouter](https://openrouter.ai/). OpenRouter acts as a unified router, allowing you to access models from OpenAI, Anthropic, Meta, Google, and more through a single API.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-coding-evolution.git
   cd ai-coding-evolution
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port provided by Vite).

5. Navigate to the **Setup** tab in the application and paste your OpenRouter API key to activate the interactive modules.

## 📁 Project Structure

```text
src/
├── components/
│   ├── Agents.tsx          # Module 5: Autonomous Agent Loop
│   ├── CLI.tsx             # Module 6: Terminal Emulator & NL-to-Bash
│   ├── Layout.tsx          # Main application shell and sidebar
│   ├── MCP.tsx             # Module 4: Model Context Protocol info
│   ├── ModelComparison.tsx # Module 2: Side-by-side LLM chat
│   ├── MultiAgent.tsx      # Module 7: Coder/Reviewer orchestration
│   ├── Scaffolds.tsx       # Module 3: IDE context info
│   ├── Setup.tsx           # Module 1: API Key configuration
│   └── ToolCalling.tsx     # Module 4: Interactive tool execution
├── services/
│   └── openRouter.ts       # API client for OpenRouter communication
├── App.tsx                 # Root component and routing logic
├── constants.ts            # Curriculum data and model lists
├── index.css               # Global Tailwind styles
└── main.tsx                # React entry point
```

## 🔒 Security & Privacy

This application is designed to be completely client-side. 
* Your API key is **never** sent to our servers. It is stored in your browser's `localStorage`.
* All API requests are made directly from your browser to OpenRouter's API.
* You can clear your API key at any time by clicking "Clear Saved Key" in the Setup module or clearing your browser data.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
