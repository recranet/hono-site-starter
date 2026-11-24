# Changelog

Each change names the files it touches, so a site can diff just those (README, "Taking over fixes").

## 2026-11-24

- The starter, from the `hono-site` skill's template. All files.
- The admin is one full-width screen built with Base UI and plain CSS. `/admin/` redirects to the first text; a Select switches texts. The toolbar sticks to the top with Save at its end, and has bold, italic, underline, strike-through, H2, H3, quote, bullet and numbered lists, link, undo and redo. `src/admin/index.tsx`, `src/admin/admin.tsx` (was `src/admin/editor.tsx`), `src/admin/admin.css`, `src/blocks.ts` (exports `PortableTextBlock`), `vite.config.ts` (builds `/admin/admin.js` and `/admin/style.css`), `package.json` (`@base-ui/react`).
