import { Hono } from "hono";
import { appendTrailingSlash } from "hono/trailing-slash";
import { admin } from "./admin/index.tsx";
import { blocks } from "./blocks.ts";
import { handleContact } from "./contact.ts";
import { ContactForm, Layout } from "./layout.tsx";

// Pages render here with Hono JSX. Files in public/ (CSS, JS, images) are
// served before the Worker runs.
const app = new Hono({ strict: true });

// /over-ons -> /over-ons/, so every page has one URL.
app.use(appendTrailingSlash());

// A page with editable text loads its blocks first (blocks.ts).
app.get("/", async (c) => {
	const text = await blocks("home");
	return c.html(
		<Layout path="/">
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Welkom</h1>
						<div class="text-lg">{text("intro")}</div>
						<a class="btn btn-primary" href="/contact/">
							Neem contact op
						</a>
					</div>
				</div>
			</section>
			<section>
				<div class="container">
					<h2>Over deze site</h2>
					{text("about")}
					<a class="btn btn-outline-primary" href="/over-ons/">
						Lees meer
					</a>
				</div>
			</section>
		</Layout>,
	);
});

app.get("/over-ons/", async (c) => {
	const text = await blocks("over-ons");
	return c.html(
		<Layout title="Over ons" path="/over-ons/">
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

app.get("/contact/", async (c) => {
	const text = await blocks("contact");
	return c.html(
		<Layout title="Contact" path="/contact/" form>
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Contact</h1>
						<div class="mb-8">{text("intro")}</div>
						<ContactForm />
					</div>
				</div>
			</section>
		</Layout>,
	);
});

app.get("/verzonden/", (c) =>
	c.html(
		<Layout title="Bericht verzonden">
			<section>
				<div class="container">
					<h1>Bedankt</h1>
					<p>Je bericht is verzonden. We nemen zo snel mogelijk contact met je op.</p>
					<a class="btn btn-primary" href="/">
						Terug naar de homepage
					</a>
				</div>
			</section>
		</Layout>,
	),
);

app.post("/api/contact", (c) => handleContact(c.req.raw));

// /admin/ and /api/auth/*, only when editing is on (admin/auth.ts).
app.route("/", admin);

app.notFound((c) =>
	c.html(
		<Layout title="Pagina niet gevonden">
			<section>
				<div class="container">
					<h1>Pagina niet gevonden</h1>
					<a class="btn btn-primary" href="/">
						Terug naar de homepage
					</a>
				</div>
			</section>
		</Layout>,
		404,
	),
);

export default app satisfies ExportedHandler;
