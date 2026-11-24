# Changelog

Each change names the files it touches, so a site can diff just those (README, "Taking over fixes").

## 2026-11-24

- The public pages follow worker-contact-form-example: Tailwind (src/styles/app.css, compiled by `pnpm run css`), the Alpine navbar from the pages in blocks.ts, Home, Over ons, Contact, Verzonden and 404, a placeholder logo, the form at `POST /api/contact`, Node 26. `src/index.tsx`, `src/layout.tsx`, `src/blocks.ts`, `src/contact.ts`, `src/styles/app.css`, `public/` (no `style.css`), `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.node-version`, `cloudflare.config.ts`.
- The starter, from the `hono-site` skill's template. All files.
- The admin is one full-width screen built with Base UI and plain CSS. `/admin/` redirects to the first text; a Select switches texts. The toolbar sticks to the top with Save at its end, and has bold, italic, underline, strike-through, H2, H3, quote, bullet and numbered lists, link, undo and redo. `src/admin/index.tsx`, `src/admin/admin.tsx` (was `src/admin/editor.tsx`), `src/admin/admin.css`, `src/blocks.ts` (exports `PortableTextBlock`), `vite.config.ts` (builds `/admin/admin.js` and `/admin/style.css`), `package.json` (`@base-ui/react`).
