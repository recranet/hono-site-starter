# Hono site starter

A small website as a Hono app on Cloudflare Workers: pages in Hono JSX with a shared layout, and `POST /contact`, which checks a reCAPTCHA score and mails the form with the `send_email` binding. Optionally the site's owner edits the page texts at `/admin/`, signed in through an OpenID provider. CSS, JS and images are static files in `public/`. It builds with the `cf` CLI (`cloudflare.config.ts`), so no Wrangler config.

A site gets its own copy of this repo. Fixes land here first, and sites take them over by diffing (see [Taking over fixes](#taking-over-fixes)).

## Start a site

Copy the starter without its history and start the site's own:

```bash
git clone --depth 1 https://github.com/recranet/hono-site-starter.git example-nl
```

```bash
rm -rf example-nl/.git
```

```bash
git -C example-nl init -b master
```

Note the starter commit you started from in the site's first commit message (`git ls-remote https://github.com/recranet/hono-site-starter.git master`); [Taking over fixes](#taking-over-fixes) diffs from there.

```bash
pnpm --dir example-nl install
```

```bash
cp example-nl/.dev.vars.example example-nl/.dev.vars
```

Then fill in:

- `package.json`: `name`.
- `cloudflare.config.ts`: `accountId`, the Worker `name` (the domain with dashes, `example-nl`), `MAIL_FROM` (an address on a zone with Cloudflare Email Sending enabled), `MAIL_TO` (the inbox that gets the form), `SITE_NAME` and `RECAPTCHA_SITE_KEY` (a reCAPTCHA score key's site key).
- `.dev.vars`: `RECAPTCHA_SECRET`, the score key's secret. It is gitignored; never commit it.
- `src/index.tsx`: one route per page, each wrapped in `Layout` from `src/layout.tsx`. A page with the form passes `form` to `Layout` (it loads reCAPTCHA and `form.js`) and renders `ContactForm`.
- `src/blocks.ts`: the texts the owner may edit, per page, each with a label and its default text. A page loads them with `const text = await blocks("home")` and renders `{text("intro")}`. Without editing the default text shows.
- `public/`: `style.css`, `form.js` and the site's images.

How the Worker behaves:

- Files in `public/` are served before the Worker runs. Every other path is a Hono route; an unknown one gets the 404 page from `app.notFound`. Paths end in a slash (`appendTrailingSlash`).
- `src/contact.ts` holds the form, mounted as `POST /contact`. Keep the field names (`name`, `email`, `message`, the `website` honeypot, the hidden `recaptcha_token` that `public/form.js` fills) or change them in both `ContactForm` and `contact.ts`.
- `to` is always `MAIL_TO`, never from the form, and the binding only sends from `MAIL_FROM`. The visitor's address goes in `replyTo`.
- The reCAPTCHA check passes when the token is valid, made for the `contact` action on the request's host, and scores at least `MIN_SCORE` (0.5). Raise it if spam gets through.

`pnpm check` runs `cf workers types` and `vp check`; it must pass without warnings (`pnpm format` fixes formatting). `pnpm dev` serves the site locally. The form fails reCAPTCHA there when the key only allows the live hostnames.

## Editing (optional)

Without these bindings the site has no `/admin/` and nobody signs in.

- Texts are Portable Text JSON in the D1 table `block` (`migrations/`). Public pages render them with `@portabletext/to-html`.
- `/admin/` is one screen per text (`/admin/teksten/<page>/<name>/`): a Select to switch texts, a toolbar (bold, italic, heading, list, link) over the Portable Text editor, and Save. The server (`src/admin/index.tsx`, Hono JSX) puts the screen's data in the page as JSON; `src/admin/admin.tsx` renders it with React and [Base UI](https://base-ui.com), styled by `src/admin/admin.css`. Base UI's docs are in `node_modules/@base-ui/react/docs/`.
- Sign-in is Better Auth without a database, through `genericOAuth` against an OpenID provider (`src/admin/auth.ts`). `/admin/` sends the visitor straight to the provider; the site keeps no users and lets in only accounts whose `<issuer>/customer_id` claim is `CUSTOMER_ID`. A refused sign-in shows "Geen toegang" with a retry.

To turn it on:

1. Create a D1 database, put its ID in `DB` in `cloudflare.config.ts`, and apply `migrations/` with `cf d1 migrations apply <database-id>`.
2. Register the site as a client at the provider with redirect URI `https://<host>/api/auth/callback/console`.
3. Uncomment the editing bindings in `cloudflare.config.ts`: `AUTH_ISSUER`, `CUSTOMER_ID` and `OIDC_CLIENT_ID`.
4. Fill `OIDC_CLIENT_SECRET` in `.dev.vars`, and generate `BETTER_AUTH_SECRET` next to it with `openssl rand -base64 32`.

## Deploy

```bash
pnpm run deploy --secrets-file .dev.vars
```

The Worker is then live on its `workers.dev` address (kept by `workersDev: true`), with Workers Logs on. A hostname goes in `cloudflare.config.ts` as a Custom Domain (`domains`) or a route (`triggers`); both are commented there. The OIDC client's redirect URI must be that hostname: the `workers.dev` address can't sign in.

## Taking over fixes

[CHANGELOG.md](CHANGELOG.md) names the files each change touches. Compare those files between the starter commit the site started from (or last took over) and the starter's `master`, and apply what fits the site:

```bash
git clone https://github.com/recranet/hono-site-starter.git /tmp/hono-site-starter
```

```bash
git -C /tmp/hono-site-starter diff <from-commit> master -- src/admin
```

The admin (`src/admin/`), `src/blocks.ts` and `src/contact.ts` usually come over as they are; pages, layout and styling are the site's own. Note the starter commit you took over in the commit message.
