import { Hono } from "hono";
import { appendTrailingSlash } from "hono/trailing-slash";
import { admin } from "./admin/index.tsx";
import { blocks } from "./blocks.ts";
import { handleContact } from "./contact.ts";
import { ContactForm, Layout } from "./layout.tsx";

// Pages render here with Hono JSX. Files in public/ (CSS, JS, images) are
// served before the Worker runs.
const app = new Hono({ strict: true });

// /verzonden -> /verzonden/, so every page has one URL.
app.use(appendTrailingSlash());

// A page with editable text loads its blocks first (blocks.ts).
app.get("/", async (c) => {
	const text = await blocks("home");
	return c.html(
		<Layout form>
			<h1>Example</h1>
			{text("intro")}
			<ContactForm />
		</Layout>,
	);
});

app.get("/verzonden/", (c) =>
	c.html(
		<Layout title="Bericht verzonden">
			<h1>Bedankt</h1>
			<p>Je bericht is verzonden. We nemen zo snel mogelijk contact met je op.</p>
			<p>
				<a href="/">Terug naar de homepage</a>
			</p>
		</Layout>,
	),
);

app.post("/contact", (c) => handleContact(c.req.raw));

// /admin/ and /api/auth/*, only when editing is on (admin/auth.ts).
app.route("/", admin);

app.notFound((c) =>
	c.html(
		<Layout title="Pagina niet gevonden">
			<h1>Pagina niet gevonden</h1>
			<p>
				<a href="/">Terug naar de homepage</a>
			</p>
		</Layout>,
		404,
	),
);

export default app satisfies ExportedHandler;
