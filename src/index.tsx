import { Hono } from "hono";
import { appendTrailingSlash } from "hono/trailing-slash";
import { admin } from "./admin/index.tsx";
import { blocks, href } from "./blocks.ts";
import { handleContact } from "./contact.ts";
import { langAt, languages, messages, prefix } from "./languages.ts";
import { ContactForm, Layout } from "./layout.tsx";
import { serveMedia } from "./media.ts";

// Pages render here with Hono JSX. Files in public/ (CSS, JS, images) are
// served before the Worker runs.
const app = new Hono({ strict: true });

// /over-ons -> /over-ons/, so every page has one URL.
app.use(appendTrailingSlash());

// More than one language: / goes to the first language's home (languages.ts).
if (languages.length > 1) app.get("/", (c) => c.redirect(`${prefix(languages[0])}/`));

// A page loads its texts first (blocks.ts) and renders its `body` as sections:
// the parts the customer inserted and the text between them. href() gives
// its path, with the language prefix on a site with more than one.
app.get(href("home"), async (c) => {
	const text = await blocks("home");
	return c.html(<Layout url={c.req.url}>{text.page("body")}</Layout>);
});

app.get(href("over-ons"), async (c) => {
	const text = await blocks("over-ons");
	return c.html(
		<Layout title="Over ons" url={c.req.url}>
			{text.page("body")}
		</Layout>,
	);
});

// Every part once (blocks.ts). A site deletes this route and the page.
app.get(href("onderdelen"), async (c) => {
	const text = await blocks("onderdelen");
	return c.html(
		<Layout title="Onderdelen" url={c.req.url}>
			{text.page("body")}
		</Layout>,
	);
});

// The form stays below the customer's text.
app.get(href("contact"), async (c) => {
	const text = await blocks("contact");
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

// Images in the texts, from R2 (media.ts).
app.get("/media/:name", (c) =>
	serveMedia(c.req.param("name"), c.req.raw, c.executionCtx as ExecutionContext),
);

// /admin/ and /api/auth/*, only when editing is on (admin/auth.ts).
app.route("/", admin);

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
