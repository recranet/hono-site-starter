# Hono site starter

A small website as a Hono app on Cloudflare Workers: Hono JSX pages, a contact form that mails through the `send_email` binding behind a reCAPTCHA score, and optional text editing at `/admin/` with sign-in through an OpenID provider. The code comments explain the rest.

A site gets its own copy. Fixes land here first; sites take them over by diffing (see the end).

## Start a site

```bash
git clone --depth 1 https://github.com/recranet/hono-site-starter.git example-nl
```

```bash
rm -rf example-nl/.git
```

```bash
git -C example-nl init -b master
```

```bash
pnpm --dir example-nl install
```

```bash
cp example-nl/.dev.vars.example example-nl/.dev.vars
```

Note the starter commit (`git ls-remote https://github.com/recranet/hono-site-starter.git master`) in the site's first commit message. Fill in the placeholders in `package.json` and `cloudflare.config.ts`, the pages in `src/index.tsx`, the editable texts and navbar in `src/blocks.ts`, the brand colours and fonts in `src/styles/app.css` and the logo in `public/img/logo.svg`. Put the reCAPTCHA score key's secret in `.dev.vars` as `RECAPTCHA_SECRET`.

`pnpm check` must pass without warnings. `pnpm dev` serves the site locally.

## Editing (optional)

Create the database, put its ID in `DB` in `cloudflare.config.ts`, and apply the migrations:

```bash
cf d1 create --name example-nl
```

```bash
cf d1 migrations apply <database-id>
```

Register the site at the OpenID provider with redirect URI `https://<host>/api/auth/callback/console`. Uncomment the editing bindings in `cloudflare.config.ts`, put the client secret in `.dev.vars` as `OIDC_CLIENT_SECRET`, and generate `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32 | sed 's/^/BETTER_AUTH_SECRET=/' >> .dev.vars
```

For images in the texts, create an R2 bucket and put its name in `MEDIA` in `cloudflare.config.ts`; the editor then shows "Afbeelding":

```bash
cf r2 buckets create --name example-nl-media
```

## Deploy

```bash
pnpm run deploy --secrets-file .dev.vars
```

## Taking over fixes

[CHANGELOG.md](CHANGELOG.md) names the files each change touches. Diff those between the starter commit the site started from (or last took over) and `master`, and apply what fits:

```bash
git clone https://github.com/recranet/hono-site-starter.git /tmp/hono-site-starter
```

```bash
git -C /tmp/hono-site-starter diff <from-commit> master -- src/admin
```

Note the starter commit you took over in the commit message.
