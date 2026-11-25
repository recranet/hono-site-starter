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

// A page with editable text loads its blocks first (blocks.ts). href() gives
// its path, with the language prefix on a site with more than one.
app.get(href("home"), async (c) => {
	const text = await blocks("home");
	return c.html(
		<Layout url={c.req.url}>
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Welkom</h1>
						<div class="text-lg">{text("intro")}</div>
						<a class="btn btn-primary" href={href("contact")}>
							Neem contact op
						</a>
					</div>
				</div>
			</section>
			<section>
				<div class="container">
					<h2>Over deze site</h2>
					{text("about")}
					<a class="btn btn-outline-primary" href={href("over-ons")}>
						Lees meer
					</a>
				</div>
			</section>
		</Layout>,
	);
});

app.get(href("over-ons"), async (c) => {
	const text = await blocks("over-ons");
	return c.html(
		<Layout title="Over ons" url={c.req.url}>
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Over ons</h1>
						<div class="text-lg">{text("intro")}</div>
						{text("body")}
					</div>
				</div>
			</section>
		</Layout>,
	);
});

app.get(href("contact"), async (c) => {
	const text = await blocks("contact");
	return c.html(
		<Layout title="Contact" url={c.req.url} form>
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Contact</h1>
						<div class="mb-8">{text("intro")}</div>
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
