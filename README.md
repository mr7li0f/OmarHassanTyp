# Omar Hassan Type - Frontend + Optional Backend

This project supports two runtime modes:

1. Server mode (Node.js + API, admin fully enabled)
2. Static mode (GitHub Pages-ready, read-only)

In server mode, storage works in two ways:

- Local JSON storage (default when DATABASE_URL is not set)
- PostgreSQL storage (when DATABASE_URL is provided)

## 1) Local Server Mode

Use this mode when you want admin login, editing, uploads, and stats.

- Install dependencies:
  - npm install
- Run server:
  - npm start

The frontend reads content from API endpoints under /api.

### Storage behavior in server mode

- If DATABASE_URL is missing: all admin edits, uploads, and stats are saved to:
  - data/cms-store.json
- If DATABASE_URL is present: PostgreSQL is used.

This means you can deploy on any Node.js hosting without needing a database service.

## 2) Static Mode (GitHub Pages)

Use this mode for public portfolio hosting without backend.

- Static content file:
  - public/content.json
- Asset folders used by static mode:
  - data/
  - public/fonts

In static mode:

- Public browsing works
- Admin panel actions are disabled (read-only)
- Tracking endpoints are skipped

## GitHub Pages Deployment

A workflow is included at:

- .github/workflows/deploy-pages.yml

It deploys the public folder on pushes to main.

### Required GitHub setting

In your repository:

- Settings -> Pages -> Build and deployment -> Source: GitHub Actions

After pushing to main, GitHub will build and publish the site automatically.

## Updating Portfolio Content for Static Hosting

Edit this file and commit changes:

- public/content.json

If you add new images/fonts, place them in:

- data/<Font Name>/photos
- data/<Font Name>/fonts
- data/All-Fonts (for all fonts ZIP)

Then update corresponding paths in public/content.json.
