import { env } from "cloudflare:workers";
import { createEditor, type PageDefinition } from "@recranet/worker-site-editor";
import {
	accordion,
	cards,
	checklist,
	cta,
	feature,
	features,
	hero,
	labels,
	map,
	marquee,
	quote,
	stats,
} from "@recranet/worker-site-editor/extensions";
import { href, langOf, pages, type PageName } from "./blocks.ts";
import { nieuws } from "./collections.ts";
import { languages } from "./languages.ts";
import { textStyles } from "./text-styles.ts";

// The editing bindings (README, "Editing"). Left out of cloudflare.config.ts,
// the site has no admin and the pages show the default texts.
const site = env as Partial<{
	DB: D1Database;
	AUTH_ISSUER: string;
	CUSTOMER_ID: string;
	OIDC_CLIENT_ID: string;
	OIDC_CLIENT_SECRET: string;
	BETTER_AUTH_SECRET: string;
	MEDIA: R2Bucket;
	IMAGES: ImagesBinding;
}>;

// The admin's switcher lists the pages by language: "Contact (EN)".
const editable = Object.fromEntries(
	(Object.keys(pages) as PageName[]).map((page) => {
		const lang = langOf(page);
		const title =
			lang === languages[0] ? pages[page].title : `${pages[page].title} (${lang.toUpperCase()})`;
		return [page, { ...pages[page], title, path: href(page) }];
	}),
) as { [P in PageName]: PageDefinition & (typeof pages)[P] };

// Texts and page fields in D1, collections (collections.ts), sign-in through
// the console, images in R2 (@recranet/worker-site-editor). The blocks are the
// package's extensions: the editor's "Onderdeel" menu. A site drops the ones it
// doesn't use, or adds its own with defineBlock (and defineBlockEditor in
// src/admin.ts).
export const editor = createEditor({
	db: site.DB,
	auth: site.AUTH_ISSUER
		? {
				issuer: site.AUTH_ISSUER,
				customerId: site.CUSTOMER_ID ?? "",
				clientId: site.OIDC_CLIENT_ID ?? "",
				clientSecret: site.OIDC_CLIENT_SECRET ?? "",
				secret: site.BETTER_AUTH_SECRET ?? "",
			}
		: undefined,
	media: site.MEDIA,
	images: site.IMAGES,
	blocks: [
		hero,
		feature,
		cards,
		features,
		stats,
		cta,
		marquee,
		map,
		accordion,
		quote,
		checklist,
		labels,
	],
	textStyles,
	pages: editable,
	collections: { nieuws },
	// Under `cf dev` Vite serves the admin entry's source.
	admin: import.meta.env.DEV ? { script: "/src/admin.ts" } : undefined,
});
