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

Note the starter commit (`git ls-remote https://github.com/recranet/hono-site-starter.git master`) in the site's first commit message. Fill in the placeholders in `package.json` and `cloudflare.config.ts`, the pages in `src/index.tsx`, the editable texts and navbar in `src/blocks.ts` (and its languages in `src/languages.ts`), the brand colours and fonts in `src/styles/app.css` and the logo in `public/img/logo.svg`. Put the reCAPTCHA score key's secret in `.dev.vars` as `RECAPTCHA_SECRET`.

`pnpm check` must pass without warnings. `pnpm dev` serves the site locally.

## More languages (optional)

A site is Dutch, with its pages at the root. To add English:

1. Set `languages` in `src/languages.ts` to `["nl", "en"]`. Every page moves under its language (`/nl/over-ons/`, `/en/`), and `/` redirects to `/nl/`. The old root paths of a live site stop working.
2. Add the English pages to `src/blocks.ts`, each with `lang: "en"`, a key of its own and `translates` naming the Dutch page. The navbar shows the pages of the current language and a switch to the same page in the other one (or its home); the head gets `hreflang` links.

   ```ts
   "en-contact": {
   	title: "Contact",
   	lang: "en",
   	translates: "contact",
   	path: "/contact/",
   	blocks: { body: { label: "Pagina", text: "Get in touch." } },
   },
   ```

3. Add a route per page in `src/index.tsx` with `app.get(href("en-contact"), …)`, like the Dutch ones. A contact page passes its language: `<ContactForm lang="en" />`.

The form, its errors, the thank-you page (`/en/sent/`) and the 404 take their texts from `messages` in `src/languages.ts`; another language needs an entry there first. The admin stays Dutch and lists the pages by language ("Contact (EN)").

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

For images and galleries in the texts, create an R2 bucket and put its name in `MEDIA` in `cloudflare.config.ts`; the editor then shows "Afbeelding" and "Galerij". Uncomment `IMAGES` too to serve them scaled to the screen (Cloudflare Images, billed per transformation; without it pages load the originals):

```bash
cf r2 buckets create --name example-nl-media
```

## Text styles

Besides bold, italic, headings, quotes, lists and links, the editor offers the site's own text styles: paragraph styles (a lead paragraph), styles for selected words (a highlight) and link styles (a button). They are all in `src/text-styles.ts`, one entry each with its toolbar label and the element and classes it renders as. The starter ships one example of each, shown under "Over deze site" on home.

A site adds or removes entries there and puts their CSS in `src/styles/app.css` (or uses Tailwind classes). The admin loads the site's stylesheet, so the editor shows them as the page does. Removing a style that saved texts use is safe: those parts show as normal text, and the next save drops the style.

## Page parts

The customer builds each page in the editor. A page is one `body` text (`src/blocks.ts`); besides paragraphs, headings and images it holds page parts, which the editor's "Onderdeel" button inserts: Hero (cover or split), Feature (text beside an image), Cards (grid or bento), Features (grid or list), Stats, CTA, Marquee and Google Maps render full width; Accordion, Quote, Checklist and Labels sit in the text column with the paragraphs around them. Each part opens a form for its fields: plain texts (a blank line starts a paragraph), links, images from R2, choices and lists of items.

- `src/parts.ts` defines the parts and their fields. The admin builds its forms from it, and saving checks a part against it.
- `src/components.tsx` renders them, from the Elloro emdash-boilerplate's sections, as Hono JSX without JS libraries. Page code can use the components directly too, and the layout shows its Footer.
- A route renders a page with `text.page("body")`: each full-width part as its own section, everything between them in a text column.

The Onderdelen page (`/onderdelen/`) shows each part once. A site deletes it (its route in `src/index.tsx`, its entry in `src/blocks.ts`) and `public/img/placeholder.svg`. To drop a part, remove it from `src/parts.ts` and its case in `renderPart`; saved texts that use it leave it out.

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
