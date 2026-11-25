import { Hono, type Context } from "hono";
import { csrf } from "hono/csrf";
import { raw } from "hono/html";
import type { Child } from "hono/jsx";
import {
	pages,
	parseBlocks,
	readBlock,
	saveBlock,
	type PageName,
	type PortableTextBlock,
} from "../blocks.ts";
import { media, uploadMedia } from "../media.ts";
import { createAuth, editing } from "./auth.ts";

// The customer's admin: one screen per text at /admin/teksten/<page>/<name>/.
// The server renders the shell with the screen's data as JSON; admin.tsx
// (React with Base UI) renders the screen from it. Save and sign-out are plain
// form POSTs with a 303 back.
type Env = { Variables: { auth: ReturnType<typeof createAuth>; email: string } };
export const admin = new Hono<Env>();

// What admin.tsx gets: the texts by page for the switcher, and the open text.
export type AdminData = {
	email: string;
	pages: { title: string; texts: { value: string; label: string }[] }[];
	current: string;
	pagePath: string;
	value: PortableTextBlock[];
	saved: boolean;
	// Whether images can be added (the MEDIA binding).
	media: boolean;
};

for (const path of ["/admin/*", "/api/auth/*"]) {
	admin.use(path, async (c, next) => {
		const e = editing();
		if (!e) return c.notFound();
		c.set("auth", createAuth(e, new URL(c.req.url).origin));
		c.header("cache-control", "no-store");
		await next();
	});
	admin.use(path, csrf());
}

// Better Auth's own routes, of which the provider's callback is the one used.
admin.on(["GET", "POST"], "/api/auth/*", (c) => c.var.auth.handler(c.req.raw));

// Sends the visitor to the provider's sign-in page, with Better Auth's state
// cookie. The site has no sign-in page of its own.
async function signIn(c: Context<Env>) {
	const { headers, response } = await c.var.auth.api.signInSocial({
		body: {
			provider: "console",
			callbackURL: "/admin/",
			errorCallbackURL: "/admin/?fout=inloggen",
		},
		returnHeaders: true,
	});
	if (!response.url) throw new Error("no authorization URL from Better Auth");
	const res = c.redirect(response.url, 303);
	for (const cookie of headers.getSetCookie()) res.headers.append("set-cookie", cookie);
	return res;
}

// The retry button on the refused page.
admin.post("/admin/inloggen", signIn);

// Back to the site: /admin/ would send the visitor straight to the provider.
admin.post("/admin/uitloggen", async (c) => {
	const { headers } = await c.var.auth.api.signOut({
		headers: c.req.raw.headers,
		returnHeaders: true,
	});
	const res = c.redirect("/", 303);
	for (const cookie of headers.getSetCookie()) res.headers.append("set-cookie", cookie);
	return res;
});

// Signed in: the first text. Not signed in: the provider, or why it refused.
admin.get("/admin/", async (c) => {
	const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.req.query("fout") === "inloggen" ? c.html(<Refused />) : signIn(c);
	const [page, def] = Object.entries(pages)[0];
	return c.redirect(`/admin/teksten/${page}/${Object.keys(def.blocks)[0]}/`, 303);
});

// Everything below needs a session.
for (const path of ["/admin/teksten/*", "/admin/media"]) {
	admin.use(path, async (c, next) => {
		const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) return c.redirect("/admin/", 303);
		c.set("email", session.user.email);
		await next();
	});
}

// An image for a text (media.ts); the editor puts the returned path in the text.
admin.post("/admin/media", (c) => uploadMedia(c.req.raw));

admin.get("/admin/teksten/:page/:name/", async (c) => {
	const found = findBlock(c.req.param("page"), c.req.param("name"));
	if (!found) return c.notFound();
	const data: AdminData = {
		email: c.var.email,
		pages: Object.entries(pages).map(([page, def]) => ({
			title: def.title,
			texts: Object.entries(def.blocks).map(([name, block]) => ({
				value: `${page}/${name}`,
				label: block.label,
			})),
		})),
		current: `${found.page}/${found.name}`,
		pagePath: pages[found.page].path,
		value: await readBlock(found.page, found.name),
		saved: c.req.query("opgeslagen") !== undefined,
		media: media() !== undefined,
	};
	return c.html(
		<Shell title={found.def.label} script>
			<div id="admin"></div>
			{/* "<" escaped, so a text can't close the script tag. */}
			<script type="application/json" id="admin-data">
				{raw(JSON.stringify(data).replaceAll("<", "\\u003c"))}
			</script>
		</Shell>,
	);
});

admin.post("/admin/teksten/:page/:name/", async (c) => {
	const found = findBlock(c.req.param("page"), c.req.param("name"));
	if (!found) return c.notFound();
	const form = await c.req.formData();
	const posted = form.get("value");
	const value = typeof posted === "string" ? parseBlocks(posted) : undefined;
	if (!value) return c.text("Deze tekst kan niet worden opgeslagen.", 400);
	await saveBlock(found.page, found.name, value, c.var.email);
	return c.redirect(`/admin/teksten/${found.page}/${found.name}/?opgeslagen`, 303);
});

function findBlock(page: string, name: string) {
	if (!Object.hasOwn(pages, page)) return undefined;
	const blocks: Record<string, { label: string; text: string }> = pages[page as PageName].blocks;
	if (!Object.hasOwn(blocks, name)) return undefined;
	return { page: page as PageName, name, def: blocks[name] };
}

function Refused() {
	return (
		<Shell title="Geen toegang">
			<main class="refused">
				<h1>Geen toegang</h1>
				<p>Inloggen is niet gelukt. Dit adres heeft geen toegang tot deze site.</p>
				<form method="post" action="/admin/inloggen">
					<button type="submit" class="button primary">
						Opnieuw inloggen
					</button>
				</form>
			</main>
		</Shell>
	);
}

// The admin's page shell. In `cf dev` Vite serves the sources; a build has
// them as /admin/style.css and /admin/admin.js (vite.config.ts).
const asset = (dev: string, built: string) => (import.meta.env.DEV ? dev : built);

function Shell(props: { title: string; script?: boolean; children: Child }) {
	return (
		<>
			{raw("<!doctype html>")}
			<html lang="nl">
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta name="robots" content="noindex" />
					<title>{props.title} - Beheer</title>
					<link rel="stylesheet" href={asset("/src/admin/admin.css", "/admin/style.css")} />
					{props.script && (
						<script type="module" src={asset("/src/admin/admin.tsx", "/admin/admin.js")}></script>
					)}
				</head>
				<body>{props.children}</body>
			</html>
		</>
	);
}
