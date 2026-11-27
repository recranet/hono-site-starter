import { defineCollection } from "@recranet/worker-site-editor";
import { href } from "./blocks.ts";

// Collections: lists of items the customer adds, orders, hides and edits in
// /admin/ ("Collecties"), each with fields and texts. Items live in D1 only;
// a site moving fixed pages here seeds them once (README, "Collections and
// page fields"). The key in editor.ts (`nieuws`) is stored with the items:
// renaming it loses them. Keep this file free of cloudflare:workers imports,
// so a seed script can run it in Node.
export const nieuws = defineCollection({
	label: "Nieuws",
	item: "Bericht",
	// Every item has a title and a slug; these come on top.
	fields: [
		{ name: "date", label: "Datum (jjjj-mm-dd)", kind: "text", required: true },
		{ name: "image", label: "Foto", kind: "image", required: true },
	],
	texts: { body: { label: "Bericht" } },
	// Under the overview page (blocks.ts), so it follows its language prefix.
	path: (item) => `${href("nieuws")}${item.slug}/`,
});
