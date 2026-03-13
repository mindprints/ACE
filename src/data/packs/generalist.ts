import type { ContentPack } from '../contentPack'

export const generalistPack: ContentPack = {
  id: 'generalist',
  label: 'Generalist',
  description: 'Everyday examples for non-technical users exploring AI capabilities.',

  // ─── Model Comparison ────────────────────────────────────────────────────────
  modelComparison: {
    defaultPrompt: 'Explain the difference between a debit card and a credit card in simple, everyday terms.',
  },

  // ─── Scaffolds (RAG over knowledge base) ────────────────────────────────────
  scaffolds: {
    domainLabel: 'Knowledge Base',
    exampleQueries: [
      'How do I cancel my subscription?',
      "What's the refund policy?",
      'Why is my payment failing?',
      'How do I upgrade my plan?',
      'What features come with the Pro plan?',
    ],
    codebase: [
      {
        filename: 'help/getting-started.md',
        language: 'markdown',
        content: `# Getting Started

Welcome! This guide walks you through setting up your account in minutes.

## Creating Your Account
1. Go to the sign-up page and enter your email address.
2. Check your inbox for a verification email and click the link inside.
3. Choose a password (at least 8 characters, one number, one symbol).
4. Fill in your profile: name, timezone, and preferred language.

## Your First Login
After verifying your email, return to the login page and sign in with your credentials.
If you forget your password, click "Forgot password?" on the login screen — you'll receive a reset link within 2 minutes.

## Setting Up Notifications
Go to Settings → Notifications to choose how you'd like to hear from us:
- Email digests (daily or weekly)
- In-app alerts
- SMS for critical updates (Pro plan only)

## Getting Help
If you run into trouble, use the chat widget in the bottom-right corner or email support@example.com.
Our support team responds within 24 hours on weekdays.`,
      },
      {
        filename: 'help/billing-faq.md',
        language: 'markdown',
        content: `# Billing FAQ

## What payment methods do you accept?
We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and bank transfer for annual plans.

## When am I charged?
You're billed on the same date each month (or year for annual plans) starting from the day you first subscribed.

## How do I update my payment details?
Go to Settings → Billing → Payment Method and click "Update card". Changes take effect on your next billing cycle.

## Can I switch between monthly and annual billing?
Yes. Switching to annual saves you 20% and takes effect at your next renewal. Go to Settings → Billing → Change Plan.

## What happens if my payment fails?
We'll retry your card three times over 7 days. You'll receive an email notification each time. If all retries fail, your account is downgraded to the Free plan until payment is resolved. No data is deleted.

## Do you offer refunds?
Yes — see our Refund Policy article for full details. Generally, we offer a pro-rated refund if you cancel within 14 days of a billing cycle.`,
      },
      {
        filename: 'help/troubleshooting.md',
        language: 'markdown',
        content: `# Troubleshooting Common Issues

## I can't log in
1. Double-check your email address — look for typos.
2. Try "Forgot password?" to reset your credentials.
3. Clear your browser cache and cookies, then try again.
4. If you signed up with Google or Apple, use that button — not your email/password.
5. Check if your account is on a company Single Sign-On (SSO) — ask your IT admin.

## The page won't load
- Disable browser extensions (especially ad blockers) and refresh.
- Try a different browser or incognito/private mode.
- Check our status page at status.example.com for any ongoing outages.

## My payment keeps getting declined
- Confirm your card's billing address matches what your bank has on file.
- Check that your card hasn't expired.
- Some banks block online subscriptions — call your bank to authorise the charge.
- Try a different card or PayPal.

## I'm not receiving emails
- Check your spam/junk folder and mark us as safe.
- Add noreply@example.com to your contacts.
- Check Settings → Notifications to ensure email alerts are turned on.

## I accidentally deleted something
Deleted items are held in the Trash for 30 days. Go to Settings → Trash to restore them.`,
      },
      {
        filename: 'products/features.md',
        language: 'markdown',
        content: `# Product Features

## All Plans Include
- Unlimited projects (up to 3 active at once on Free)
- Real-time collaboration with team members
- 5 GB cloud storage
- Mobile app (iOS and Android)
- 30-day activity history
- CSV export of all your data

## Pro Plan Extras
- Unlimited active projects
- 100 GB cloud storage
- Priority support (4-hour response SLA)
- Advanced analytics dashboard
- Custom branding (remove our logo)
- API access for integrations
- SMS notifications
- Version history (unlimited)
- SSO / SAML login for teams

## Enterprise Plan Extras
Everything in Pro, plus:
- Dedicated account manager
- Custom data retention policies
- SLA with 99.9% uptime guarantee
- On-premise deployment option
- Audit logs and compliance exports (SOC 2, GDPR)
- Volume pricing for 50+ seats`,
      },
      {
        filename: 'products/pricing.md',
        language: 'markdown',
        content: `# Pricing Plans

## Free — $0/month
- 3 active projects
- 5 GB storage
- Up to 3 team members
- Community support
- Basic analytics

## Pro — $12/month (or $9.60/month billed annually)
- Unlimited projects
- 100 GB storage
- Up to 20 team members
- Priority support (4-hour SLA)
- Advanced analytics
- API access
- Custom branding

## Enterprise — Custom pricing
- Unlimited everything
- Dedicated account manager
- Custom SLA
- On-premise option
- Contact sales@example.com

## Frequently Asked Pricing Questions
**Can I try Pro free?** Yes — a 14-day free trial, no card required.
**Do you offer discounts for non-profits or education?** Yes, 50% off. Email billing@example.com with proof of eligibility.
**Can I add extra storage?** Pro users can add storage in 50 GB blocks at $2/month each.`,
      },
      {
        filename: 'policies/refund-policy.md',
        language: 'markdown',
        content: `# Refund Policy

## 14-Day Money-Back Guarantee
If you're not satisfied within the first 14 days of a paid plan, contact us for a full refund — no questions asked. This applies to new subscriptions only, not renewals.

## Cancellations After 14 Days
After the 14-day window, we do not offer refunds for the current billing period. Your plan remains active until the end of the period, then reverts to Free.

## Annual Plan Refunds
If you cancel an annual plan within 30 days of purchase, we refund the unused months (pro-rated). After 30 days, no refund is issued for annual plans.

## How to Request a Refund
1. Go to Settings → Billing → Cancel Subscription.
2. Select "Request a refund" during the cancellation flow.
3. Alternatively, email billing@example.com with your account email and reason.
4. Refunds are processed within 5–10 business days to your original payment method.

## Exceptions
Refunds are not available for:
- Add-on purchases (extra storage, premium integrations)
- Accounts suspended for Terms of Service violations
- Charges older than 60 days`,
      },
    ],
  },

  // ─── Agents (Skills demo) ────────────────────────────────────────────────────
  agents: {
    exampleTasks: [
      'Draft a professional email declining a meeting invitation politely',
      'Plan a 3-day weekend trip to Paris with hotel and activity suggestions',
      'Find me a quick weeknight dinner recipe using chicken and pasta',
      'Write a thank-you note to a colleague who helped me on a project',
    ],
    skills: {
      email_writer: {
        name: 'email-writer',
        description: 'Drafts clear, professional emails in the right tone — formal, friendly, or assertive — tailored to the recipient and context.',
        triggerKeywords: ['email', 'write', 'draft', 'compose', 'message', 'reply', 'respond', 'send', 'letter', 'note', 'decline', 'thank'],
        content: `---
name: email-writer
description: Draft professional, clear emails adapted to tone and recipient.
triggers: [email, write, draft, compose, message, reply, respond, letter, note]
---

# Email Writer Skill

## Purpose
Write emails that are clear, appropriately toned, and get the right response. Whether it's a formal business request, a friendly follow-up, or a polite decline — this skill matches the register to the situation.

## Tone Guide
- **Formal**: Senior stakeholders, external clients, first contact. Avoid contractions. Use "I would be happy to..." not "I'd be happy to..."
- **Professional-friendly**: Colleagues, regular contacts. Contractions OK. Warm but concise.
- **Direct**: Pushing back, declining, setting limits. Still polite but unambiguous.

## Structure
\`\`\`
Subject: [Clear, specific subject line — no vague titles like "Quick question"]

Hi [Name],

[Opening: context sentence if needed]

[Main point: one clear ask or statement per paragraph]

[Next step or closing: what happens next]

[Sign-off],
[Name]
\`\`\`

## Rules
- Lead with the point — don't bury the ask.
- Keep it under 150 words unless complexity demands more.
- One clear call to action per email.
- Never use "Hope this email finds you well" or "Per my last email".

## Output
Write the complete email including subject line. No commentary outside the email itself.`,
      },

      travel_planner: {
        name: 'travel-planner',
        description: 'Creates practical, day-by-day travel itineraries with accommodation, transport, and activity suggestions tailored to the destination and duration.',
        triggerKeywords: ['travel', 'trip', 'vacation', 'holiday', 'visit', 'flight', 'hotel', 'itinerary', 'weekend', 'Paris', 'city', 'plan', 'getaway'],
        content: `---
name: travel-planner
description: Plan day-by-day itineraries with accommodation and activity suggestions.
triggers: [travel, trip, vacation, holiday, visit, flight, hotel, itinerary, weekend, city]
---

# Travel Planner Skill

## Purpose
Create practical, enjoyable travel plans. Prioritise realistic timing, mix popular and off-the-beaten-path experiences, and include actionable logistics.

## Itinerary Structure
For each day:
\`\`\`
**Day [N] — [Theme, e.g. "Arrival & Old Town"]**
- Morning: [Activity + estimated time + travel tip]
- Afternoon: [Activity + lunch suggestion]
- Evening: [Dinner recommendation + neighbourhood vibe]
- Sleep: [Hotel area suggestion + why it's well-located]
\`\`\`

## Accommodation Guidance
- Budget: hostels, guesthouses, Airbnb
- Mid-range: 3–4 star hotels near key attractions
- Premium: boutique or 5-star with character
Always mention the neighbourhood and why it's a good base.

## Practical Tips to Include
- Best time to visit each attraction (opening hours, crowd patterns)
- Transport between locations (walk / metro / taxi / cost estimate)
- One "local secret" per destination
- What to book in advance vs. just showing up

## Output
Day-by-day plan as formatted markdown. Include a brief 2-sentence intro about the destination.`,
      },

      recipe_finder: {
        name: 'recipe-finder',
        description: 'Suggests recipes based on available ingredients, dietary needs, and time constraints — with clear, step-by-step cooking instructions.',
        triggerKeywords: ['recipe', 'cook', 'make', 'ingredients', 'dinner', 'food', 'meal', 'eat', 'lunch', 'breakfast', 'vegetarian', 'chicken', 'pasta', 'bake'],
        content: `---
name: recipe-finder
description: Suggest recipes based on ingredients, diet, and available cooking time.
triggers: [recipe, cook, make, ingredients, dinner, food, meal, eat, lunch, breakfast, chicken, pasta, bake]
---

# Recipe Finder Skill

## Purpose
Suggest practical recipes that match what the user has available — ingredients, time, and dietary needs. Clear instructions, no faff.

## Recipe Format
\`\`\`
## [Recipe Name]
**Time:** [Prep time] prep + [Cook time] cook
**Serves:** [Number]
**Difficulty:** Easy / Medium / Hard

### Ingredients
- [Quantity] [Ingredient]
...

### Instructions
1. [Step]
2. [Step]
...

### Tips
- [One practical tip, e.g. "works well with leftover chicken"]
- [One substitution, e.g. "swap pasta for rice if needed"]
\`\`\`

## Suggestion Rules
- Lead with the simplest option that uses what they have.
- Offer a second recipe if ingredients allow two paths.
- Always note which ingredients can be substituted.
- Flag if a step requires special equipment.
- Keep weeknight recipes under 30 minutes total.

## Output
One or two complete recipes in the format above. No lengthy preamble.`,
      },
    },
  },

  // ─── AgentsMD ────────────────────────────────────────────────────────────────
  agentsMD: {
    exampleTasks: [
      'Write a birthday message for a colleague I work with but don\'t know well',
      'Summarise this article in 3 bullet points suitable for a Twitter post',
      'Draft a polite complaint letter to a hotel about a poor experience',
      'Create a meeting agenda for a 30-minute project kick-off call',
    ],
    defaultTemplate: `# Assistant Instructions — Writing Helper

## My Role
I help with everyday writing tasks: emails, messages, summaries, and short documents. I keep things clear, human, and appropriately toned.

## Communication Style
- Keep responses concise — no waffle or filler phrases
- Match the tone to the context (formal for business, warm for personal)
- Always write in first person unless told otherwise
- Prefer plain language; avoid jargon

## Formatting Preferences
- Use bullet points for lists, not numbered lists unless sequence matters
- Keep paragraphs short (3–4 sentences max)
- Subject lines should be specific, not vague
- Use bold sparingly — only for truly critical information

## What I Should Always Do
- Lead with the most important point
- Include a clear call to action when relevant
- Ask a clarifying question if the request is ambiguous before producing a draft
- Offer one short variation at the end if the tone might need adjusting

## Boundaries
- Do not produce content that could be misleading or harmful
- Do not write formal legal or medical documents — suggest a professional instead
- If a request is unclear, ask one focused clarifying question rather than guessing
`,
  },

  // ─── CLI ─────────────────────────────────────────────────────────────────────
  cli: {
    envLabel: 'personal productivity workspace',
    simulatedEnv: `You are a helpful personal productivity assistant with access to the user's workspace.
The workspace contains:
  Documents/
    work/
      project-proposal-q3.docx    (draft, last edited 2 days ago)
      meeting-notes-2024-03.txt   (weekly team meetings)
      budget-2024.xlsx            (annual budget spreadsheet)
    personal/
      dentist-appointment.txt     (notes: Dr. Smith, 14 March 2pm)
      holiday-ideas.md            (list of potential summer destinations)
      reading-list.md             (books to read this year)
  Calendar/
    today: Team standup 9am, Lunch with Sarah 12:30pm, Client call 3pm
    this week: Performance review Thursday 2pm, Team social Friday 6pm
  Notes/
    scratch-pad.txt               (quick notes, last updated today)
    ideas.md                      (ongoing ideas log)
    grocery-list.txt              (milk, eggs, bread, coffee, apples)

Current date: Friday, 14 March 2025
User timezone: Europe/London`,
    examples: [
      'Find notes about my dentist appointment',
      "What's on my calendar today?",
      'Show me my reading list',
      'List everything I have this week',
      "What's on the grocery list?",
      'Find files I edited in the last 2 days',
      "Search for anything about the project proposal",
      'Summarise my holiday ideas',
    ],
  },

  // ─── BrowserUse ──────────────────────────────────────────────────────────────
  browserUse: {
    exampleTasks: [
      'Find today\'s top headlines on BBC News and summarise the three biggest stories',
      'Search for the best-rated Italian restaurants in London with their opening hours',
      'Look up the current exchange rate for USD to EUR and GBP',
      'Find recent reviews for the iPhone 16 Pro and give me the pros and cons',
    ],
  },

  // ─── MultiAgent ──────────────────────────────────────────────────────────────
  multiAgent: {
    defaultTask: 'Write a short blog post about the health benefits of morning exercise.',
    agentALabel: 'Writer',
    agentBLabel: 'Editor',
    agentAPrompt: `You are an engaging content writer.
Your task is to write the content the user has requested.
Provide a well-structured draft with a compelling introduction and clear takeaways. Keep it concise and readable.`,
    agentBPrompt: `You are a sharp, constructive editor.
Review the draft provided by the Writer.
1. Point out exactly ONE key improvement (clarity, structure, tone, or engagement).
2. Provide the revised, polished version incorporating your improvement.`,
  },

  // ─── MCP ─────────────────────────────────────────────────────────────────────
  mcp: {
    servers: [
      {
        id: 'documents',
        name: 'Documents',
        color: 'amber',
        description: 'Access and search your personal and work documents.',
        version: '1.0.0',
        resources: [
          { uri: 'docs:///work/project-proposal-q3.docx', name: 'project-proposal-q3.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { uri: 'docs:///personal/holiday-ideas.md', name: 'holiday-ideas.md', mimeType: 'text/markdown' },
          { uri: 'docs:///personal/reading-list.md', name: 'reading-list.md', mimeType: 'text/markdown' },
        ],
        tools: [
          {
            name: 'read_document',
            description: 'Read the full contents of a document.',
            inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Document path' } }, required: ['path'] },
            exampleArgs: { path: 'personal/reading-list.md' },
            mockResult: '# Reading List 2025\n\n## To Read\n- Atomic Habits — James Clear\n- The Psychology of Money — Morgan Housel\n- Deep Work — Cal Newport\n\n## Currently Reading\n- Thinking, Fast and Slow — Daniel Kahneman\n\n## Finished\n- The Lean Startup — Eric Ries',
          },
          {
            name: 'list_documents',
            description: 'List all documents in a folder.',
            inputSchema: { type: 'object', properties: { folder: { type: 'string', description: 'Folder name (work or personal)' } }, required: ['folder'] },
            exampleArgs: { folder: 'work' },
            mockResult: '["project-proposal-q3.docx", "meeting-notes-2024-03.txt", "budget-2024.xlsx"]',
          },
          {
            name: 'search_documents',
            description: 'Search across all documents for a keyword or phrase.',
            inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search term' } }, required: ['query'] },
            exampleArgs: { query: 'dentist' },
            mockResult: '{"results": [{"file": "personal/dentist-appointment.txt", "excerpt": "Dr. Smith, 14 March 2pm — bring insurance card"}]}',
          },
        ],
      },
      {
        id: 'calendar',
        name: 'Calendar',
        color: 'blue',
        description: 'View and manage your schedule, events, and reminders.',
        version: '1.2.0',
        resources: [
          { uri: 'calendar://today', name: "Today's Events", mimeType: 'application/json' },
          { uri: 'calendar://this-week', name: 'This Week', mimeType: 'application/json' },
        ],
        tools: [
          {
            name: 'list_events',
            description: 'List upcoming calendar events for a given date range.',
            inputSchema: { type: 'object', properties: { range: { type: 'string', description: '"today", "this_week", or "this_month"' } }, required: ['range'] },
            exampleArgs: { range: 'today' },
            mockResult: '[{"time":"09:00","title":"Team standup","duration":"30 min"},{"time":"12:30","title":"Lunch with Sarah","location":"The Italian Place, Soho"},{"time":"15:00","title":"Client call","duration":"1 hour","notes":"Prepare Q3 review deck"}]',
          },
          {
            name: 'create_event',
            description: 'Add a new event to the calendar.',
            inputSchema: { type: 'object', properties: { title: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, notes: { type: 'string' } }, required: ['title', 'date', 'time'] },
            exampleArgs: { title: 'Dentist check-up', date: '2025-03-14', time: '14:00', notes: 'Bring insurance card' },
            mockResult: '{"success": true, "event_id": "cal_8821", "title": "Dentist check-up", "datetime": "2025-03-14T14:00:00"}',
          },
          {
            name: 'get_today',
            description: 'Get a summary of everything scheduled for today.',
            inputSchema: { type: 'object', properties: {}, required: [] },
            exampleArgs: {},
            mockResult: '{"date": "Friday 14 March 2025", "events": 3, "first_event": "09:00 Team standup", "last_event": "15:00 Client call", "free_slots": ["10:00–12:30", "16:00–18:00"]}',
          },
        ],
      },
      {
        id: 'email',
        name: 'Email',
        color: 'emerald',
        description: 'Read, search, and manage your email inbox.',
        version: '0.8.1',
        resources: [
          { uri: 'email://inbox', name: 'Inbox', mimeType: 'application/json' },
          { uri: 'email://inbox/unread', name: 'Unread', mimeType: 'application/json' },
        ],
        tools: [
          {
            name: 'list_emails',
            description: 'List recent emails from the inbox.',
            inputSchema: { type: 'object', properties: { folder: { type: 'string' }, limit: { type: 'number' } }, required: [] },
            exampleArgs: { folder: 'inbox', limit: 5 },
            mockResult: '[{"from":"sarah@company.com","subject":"Re: Q3 Project Plan","received":"10 mins ago","read":false},{"from":"billing@provider.com","subject":"Your invoice is ready","received":"2 hours ago","read":true},{"from":"james@company.com","subject":"Team social this Friday","received":"yesterday","read":true}]',
          },
          {
            name: 'search_inbox',
            description: 'Search emails by sender, subject, or keyword.',
            inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search term' } }, required: ['query'] },
            exampleArgs: { query: 'invoice' },
            mockResult: '{"count": 3, "results": [{"from":"billing@provider.com","subject":"Your invoice is ready","date":"today"},{"from":"accounts@supplier.com","subject":"Invoice #4821","date":"last week"},{"from":"billing@provider.com","subject":"Invoice #4750","date":"last month"}]}',
          },
          {
            name: 'get_email',
            description: 'Read the full content of a specific email.',
            inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Email ID' } }, required: ['id'] },
            exampleArgs: { id: 'msg_1042' },
            mockResult: '{"from":"sarah@company.com","to":"me@company.com","subject":"Re: Q3 Project Plan","date":"14 Mar 2025 09:47","body":"Hi! Quick update — the client approved the revised timeline. Can we meet briefly this week to align on next steps? Thursday works best for me."}',
          },
        ],
      },
    ],
  },

  // ─── Tool Calling ─────────────────────────────────────────────────────────────
  toolCalling: {
    examplePrompts: [
      "What's the weather like in London this weekend?",
      "What's Apple's stock price right now?",
      "What's a 20% tip on a $64.50 restaurant bill?",
      'Search for what causes jet lag and how to avoid it',
      'Compare the weather in New York and Los Angeles today',
    ],
    initialMessage: "Hi there! I have access to real-time tools — I can check the weather, look up stock prices, do quick calculations, and search the web. What can I help you with?",
  },
}
