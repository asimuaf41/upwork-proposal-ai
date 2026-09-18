# Proposal Studio — Asim Ali

Paste an Upwork job description. Get a short proposal that follows Asim Ali’s bid rules: mirror the client’s language, lead with the right live project, answer screening questions, stay under 300 words, and end with questions that force a reply.

No API key is required. The built-in rules engine writes the proposal on the spot. Optional Claude or OpenAI keys (browser-only, or `.env`) can polish a second pass.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm test
npm run build
```

## How to use it

1. Paste the full job post — including any “start your proposal with…” filter.
2. Click **Write proposal**.
3. Check the fit badge. **Do not apply** means the required stack is outside the offer (Laravel, Django, native mobile, and similar).
4. Copy the proposal into Upwork. Use the Boost tab for the 4-sentence boost message.

## Optional model keys

The rules engine is the default writer.

To use Claude or OpenAI, open **API keys** in the app and paste a key (stored in `localStorage` on this device), or set:

```bash
ANTHROPIC_API_KEY=sk-ant-…
OPENAI_API_KEY=sk-…
```

Then choose Auto / Claude / OpenAI in settings. Keys sent to `/api/generate` are not logged.

## What the writer enforces

- Never opens with “Hi, my name is Asim” or a first sentence starting with “I”
- Hidden filter words on line 1
- Em-dash evidence lines with the matching live link
- Honest gaps (Python, GraphQL, Shopify, React Native, advanced AWS)
- No free work, no discounts, no Upwork profile URL
- 2–3 job-specific closing questions
- Footer: Top Rated Plus · 100% JSS · $90K+ · GitHub · portfolio

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui.
