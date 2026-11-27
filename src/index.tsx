import type { ImageValue } from "@recranet/worker-site-editor";
import { Hono } from "hono";
import { raw } from "hono/html";
import { appendTrailingSlash } from "hono/trailing-slash";
import { href } from "./blocks.ts";
import { handleContact } from "./contact.ts";
import { editor } from "./editor.ts";
import { langAt, languages, messages, prefix } from "./languages.ts";
import { ContactForm, Layout } from "./layout.tsx";

// Pages render here with Hono JSX. Files in public/ (CSS, JS, images) are
// served before the Worker runs.
const app = new Hono({ strict: true });

// /over-ons -> /over-ons/, so every page has one URL.
app.use(appendTrailingSlash());

// More than one language: / goes to the first language's home (languages.ts).
if (languages.length > 1) app.get("/", (c) => c.redirect(`${prefix(languages[0])}/`));

// A page loads its texts first (editor.ts) and renders its `body` as sections:
// the blocks the customer inserted and the text between them. href() gives
// its path, with the language prefix on a site with more than one.
app.get(href("home"), async (c) => {
	const text = await editor.texts("home");
	return c.html(<Layout url={c.req.url}>{text.page("body")}</Layout>);
});

app.get(href("over-ons"), async (c) => {
	const text = await editor.texts("over-ons");
	return c.html(
		<Layout title="Over ons" url={c.req.url}>
			{text.page("body")}
		</Layout>,
	);
});

// The news overview: the page's fields (heading, banner) and text, then the
// Nieuws collection's shown items in the customer's order (collections.ts).
app.get(href("nieuws"), async (c) => {
	const [text, items] = await Promise.all([editor.texts("nieuws"), editor.items("nieuws")]);
	const { heading, banner } = text.fields;
	return c.html(
		<Layout title="Nieuws" url={c.req.url}>
			<section class="relative overflow-hidden bg-dark text-white">
				{banner && <Cover image={banner} />}
				<div class="relative container">
					<h1 class="heading-1 mb-0">{heading}</h1>
				</div>
			</section>
			{text.page("body")}
			<section>
				<div class="container grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{items.map((n) => (
						<article class="group relative flex flex-col overflow-hidden rounded-lg border border-border">
							{raw(
								editor.image(n.fields.image, {
									sizes: "(min-width: 64rem) 33vw, 100vw",
									class: "aspect-[3/2] w-full object-cover",
								}),
							)}
							<div class="p-6">
								<time class="text-sm text-muted" datetime={n.fields.date}>
									{longDate(n.fields.date)}
								</time>
								<h2 class="heading-4 mt-1 mb-0">
									<a class="stretched-link no-underline" href={n.path}>
										{n.title}
									</a>
								</h2>
							</div>
						</article>
					))}
				</div>
			</section>
		</Layout>,
	);
});

// One news item, at the collection's `path`; a slug that isn't there (or a
// hidden item) is a 404.
app.get(`${href("nieuws")}:slug/`, async (c) => {
	const n = await editor.item("nieuws", c.req.param("slug") ?? "");
	if (!n) return c.notFound();
	return c.html(
		<Layout title={n.title} url={c.req.url}>
			<section>
				<div class="container">
					<div class="article mx-auto">
						<a href={href("nieuws")}>← Nieuws</a>
						<h1 class="mt-4 mb-2">{n.title}</h1>
						<time class="text-muted" datetime={n.fields.date}>
							{longDate(n.fields.date)}
						</time>
						{raw(
							editor.image(n.fields.image, {
								sizes: "(min-width: 48rem) 48rem, 100vw",
								class: "my-6 w-full rounded-lg",
								eager: true,
							}),
						)}
					</div>
				</div>
			</section>
			{n.text.page("body")}
		</Layout>,
	);
});

// "2026-11-27" as "27 november 2026"; anything else as it was typed.
function longDate(date: string) {
	const d = new Date(`${date}T12:00:00Z`);
	return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("nl-NL", { dateStyle: "long" });
}

// A banner image behind a section's heading.
function Cover(props: { image: ImageValue }) {
	return raw(
		editor.image(props.image, {
			sizes: "100vw",
			class: "absolute inset-0 size-full object-cover opacity-50",
			eager: true,
		}),
	);
}

// Every block once (blocks.ts). A site deletes this route and the page.
app.get(href("onderdelen"), async (c) => {
	const text = await editor.texts("onderdelen");
	return c.html(
		<Layout title="Onderdelen" url={c.req.url}>
			{text.page("body")}
		</Layout>,
	);
});

// The form stays below the customer's text.
app.get(href("contact"), async (c) => {
	const text = await editor.texts("contact");
	return c.html(
		<Layout title="Contact" url={c.req.url} form>
			{text.page("body")}
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<ContactForm lang="nl" />
					</div>
				</div>
			</section>
		</Layout>,
	);
});

// The thank-you page, in each language (languages.ts).
for (const lang of languages) {
	const t = messages[lang];
	app.get(prefix(lang) + t.sent.path, (c) =>
		c.html(
			<Layout title={t.sent.title} url={c.req.url}>
				<section>
					<div class="container">
						<h1>{t.sent.heading}</h1>
						<p>{t.sent.text}</p>
						<a class="btn btn-primary" href={`${prefix(lang)}/`}>
							{t.back}
						</a>
					</div>
				</section>
			</Layout>,
		),
	);
}

app.post("/api/contact", (c) => handleContact(c.req.raw));

// /admin/*, /api/auth/* and /media/* (editor.ts). Without the editing
// bindings the admin is a 404.
app.route("/", editor.routes);

// In the language of the path's prefix.
app.notFound((c) => {
	const lang = langAt(c.req.path);
	const t = messages[lang];
	return c.html(
		<Layout title={t.notFound} url={c.req.url}>
			<section>
				<div class="container">
					<h1>{t.notFound}</h1>
					<a class="btn btn-primary" href={`${prefix(lang)}/`}>
						{t.back}
					</a>
				</div>
			</section>
		</Layout>,
		404,
	);
});

export default app satisfies ExportedHandler;
