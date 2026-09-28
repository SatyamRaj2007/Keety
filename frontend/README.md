# KEETY Frontend

React, TypeScript, Vite, and Tailwind-powered design tokens for the KEETY business workspace.

## Run locally

Requirements: Node.js 20.19+ and the KEETY backend running on port 5000.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The Vite server is available at `http://localhost:5173`. `VITE_API_URL` defaults to `http://localhost:5000/api`; set it in `.env.local` only when the backend uses a different URL. The browser receives no database or Gemini secrets.

## Checks

```powershell
npm run lint
npm run build
```

## Backend coverage

The frontend currently connects to authentication, business profile, product, sales, analytics, and AI routes. The current backend does not expose customer, expense, inventory-management, or report routes; those screens explain the limitation and do not use mock records. The AI endpoints require `GEMINI_API_KEY` to be configured on the backend.
