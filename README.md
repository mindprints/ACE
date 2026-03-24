# AI Evolution — Interactive Curriculum (ACE)

A mobile-responsive, teacher-facing React application that delivers two parallel AI curriculum tracks — **Developer** and **Generalist** — and provides live classroom tools for posting assignments and sharing resource links backed by Google Sheets.

**Live:** [https://ace-umber-eight.vercel.app](https://ace-umber-eight.vercel.app)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

---

## Curriculum Tracks

### Developer Track
| Module | Component | Description |
|--------|-----------|-------------|
| Timeline | `Timeline.tsx` | Visual history of AI milestones |
| Setup | `Setup.tsx` | Environment configuration & OpenRouter key |
| Basic Capabilities | `ModelComparison.tsx` | Compare raw output across GPT-4o, Claude, Llama, Gemini, DeepSeek |
| Scaffolds & RAG | `Scaffolds.tsx` | Retrieval-Augmented Generation against a simulated codebase |
| Tool Calling | `ToolCalling.tsx` | Function-calling & real-time data fetching |
| MCP | `MCP.tsx` | Model Context Protocol — local files, DBs, and APIs |
| Skills | `Agents.tsx` | Injecting domain expertise via `SKILL.md` files |
| Agents & AGENTS.md | `AgentsMD.tsx` | Onboarding AI agents with project-specific rules |
| CLI Renaissance | `CLI.tsx` | Natural-language terminal interface with command planning |
| Multi-Agent | `MultiAgent.tsx` | Orchestrating Planner → Coder → Reviewer pipelines |
| Browser Use | `Browseruse.tsx` | AI-driven browser automation |
| IDE Evolution | `Ideevolution.tsx` | How IDEs have evolved around AI assistance |

### Generalist Track
| Module | Component | Description |
|--------|-----------|-------------|
| Setup | `GeneralistBasics.tsx` | Getting started without coding |
| Basic AI Use | `GeneralistBasics.tsx` | Core prompting and model selection |
| Tools | `GeneralistTools.tsx` | Consumer AI tools landscape |
| Connectors | `GeneralistConnectors.tsx` | Integrating AI into existing workflows |
| Teaching AI | `GeneralistTeach.tsx` | Using AI in education contexts |
| Briefing | `GeneralistBrief.tsx` | Writing effective briefs for AI |
| Delegation | `GeneralistDelegate.tsx` | Delegating tasks to AI agents |
| Research | `GeneralistResearch.tsx` | AI-assisted research techniques |
| Teams | `GeneralistTeams.tsx` | Running AI-augmented teams |
| AI Evolution | `GeneralistEvolution.tsx` | Where AI is heading |

---

## Classroom Tools — Assignments & Links

`src/components/Assignments.tsx` — a live teacher dashboard with two tabs:

### Assignments tab
- Add assignments with a **title**, **description**, and **points value** (10 / 20 / 30 / 40)
- Assignments display in a responsive grid (1 → 2 → 3 columns)
- Points badge colour-coded by band (amber = 40, blue = 30, green = 20, slate = 10)
- Delete any assignment with a single click

### Links & Resources tab
- Add resource links with a label, URL, and optional notes
- Auto-prefixes `https://` if omitted
- Opens in a new tab with an external-link icon

### Backend — Google Sheets via Apps Script
All assignments and links are persisted in a Google Sheet through a published Apps Script web app. The Vercel API route `/api/sheets` proxies requests (add / delete / list) with `localStorage` caching for instant offline-first display.

> To reconfigure the backing sheet, update `APPS_SCRIPT_URL` in `api/sheets.ts`.

---

## Mobile Layout

The sidebar is a **collapsible drawer** on mobile (< 768 px):
- A hamburger `☰` button appears in the top bar on small screens
- Tapping it slides the sidebar in as a fixed overlay with a dimmed backdrop
- Selecting any item auto-closes the drawer
- Desktop layout is unchanged — the sidebar is always visible

---

## PDF Handout Generator

`ace_assignments.py` (Python, root of repo) generates a printable A4 PDF:
- QR code linking to the live app (top-right of page)
- Student fill-in fields: Name / Class / Date
- All 21 assignments grouped by points band with colour-coded headers
- Each row has a **☐ checkbox** on the left and a **tick underline** on the right

```bash
pip install qrcode[pil] reportlab pillow
python ace_assignments.py
# Output: Desktop/ACE_Assignments.pdf
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### Install & run locally
```bash
git clone https://github.com/mindprints/ACE.git
cd ACE
npm install
npm run dev
```

### API key
The app uses the **OpenRouter API**. On first run, go to **Setup** and enter your key — it is saved to `localStorage` under `openrouter_api_key`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Markdown | React Markdown |
| AI Gateway | OpenRouter API |
| Persistence | Google Sheets via Apps Script |
| Hosting | Vercel (auto-deploy on merge to `main`) |
| PDF generation | ReportLab + qrcode (Python) |

---

## Project Structure

```
ACE/
├── api/
│   └── sheets.ts           # Vercel serverless proxy to Apps Script
├── src/
│   ├── App.tsx             # Root — routing between threads & chapters
│   ├── constants.ts        # Curriculum chapter definitions
│   ├── components/
│   │   ├── Layout.tsx      # Sidebar + mobile hamburger drawer
│   │   ├── Assignments.tsx # Live assignments & links dashboard
│   │   ├── Timeline.tsx
│   │   ├── ModelComparison.tsx
│   │   └── generalist/     # Generalist track modules
│   └── context/
│       └── ContentPackContext.tsx
├── ace_assignments.py      # PDF handout generator
└── README.md
```

---

## License

MIT — open source and free to use.
