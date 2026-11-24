import { env } from "cloudflare:workers";
import { toHTML } from "@portabletext/to-html";
import { raw } from "hono/html";

// The site's pages and the text blocks the customer can edit on each. The
// navbar lists the pages in this order. `text` shows until the
// customer saves the block; a blank line starts a new paragraph. The admin
// lists them in this order. Names are part of the stored row: renaming one
// loses its saved text.
export const pages = {
	home: {
		title: "Home",
		path: "/",
		blocks: {
			intro: {
				label: "Introductie",
				text: "Een site op Cloudflare Workers. De teksten zijn te bewerken via /admin/.",
			},
			about: {
				label: "Over deze site",
				text: "De pagina's worden op de Worker gerenderd. De klant logt in en past de teksten aan.",
			},
		},
	},
	"over-ons": {
		title: "Over ons",
		path: "/over-ons/",
		blocks: {
			intro: { label: "Introductie", text: "Dit is een voorbeeldpagina met tekst." },
			body: { label: "Tekst", text: "Vertel hier wie je bent en wat je doet." },
		},
	},
	contact: {
		title: "Contact",
		path: "/contact/",
		blocks: {
			intro: { label: "Introductie", text: "Neem contact met ons op." },
		},
	},
} satisfies Record<string, Page>;

type Page = {
	title: string;
	path: string;
	blocks: Record<string, { label: string; text: string }>;
};
export type PageName = keyof typeof pages;
export type PortableTextBlock = Exclude<Parameters<typeof toHTML>[0], unknown[]>;

// D1 when editing is on (admin/auth.ts); a site without it shows the defaults.
function db(): D1Database | undefined {
	return (env as { DB?: D1Database }).DB;
}

// Loads a page's saved blocks in one query and returns a function that
// renders one block as HTML: the saved Portable Text, or the default text.
export async function blocks<P extends PageName>(page: P) {
	const saved = new Map<string, PortableTextBlock[]>();
	const rows = await db()
		?.prepare("SELECT name, value FROM block WHERE page = ?")
		.bind(page)
		.all<{ name: string; value: string }>();
	for (const row of rows?.results ?? []) saved.set(row.name, JSON.parse(row.value));
	const defined: Page["blocks"] = pages[page].blocks;
	return (name: keyof (typeof pages)[P]["blocks"] & string) =>
		raw(toHTML(saved.get(name) ?? textToBlocks(defined[name].text)));
}

// One block's stored value, or its default as Portable Text, for the editor.
export async function readBlock(page: PageName, name: string) {
	const row = await db()
		?.prepare("SELECT value FROM block WHERE page = ? AND name = ?")
		.bind(page, name)
		.first<{ value: string }>();
	const defined: Page["blocks"] = pages[page].blocks;
	return row ? (JSON.parse(row.value) as PortableTextBlock[]) : textToBlocks(defined[name].text);
}

export async function saveBlock(
	page: PageName,
	name: string,
	value: PortableTextBlock[],
	by: string,
) {
	await db()
		?.prepare(
			`INSERT INTO block (page, name, value, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT (page, name) DO UPDATE SET value = excluded.value,
			 updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
		)
		.bind(page, name, JSON.stringify(value), new Date().toISOString(), by)
		.run();
}

// The editor's JSON as posted. Only text blocks, and not too large; to-html
// escapes the text and drops unsafe link URLs when it renders.
export function parseBlocks(json: string): PortableTextBlock[] | undefined {
	if (json.length > 100_000) return undefined;
	try {
		const value: unknown = JSON.parse(json);
		if (!Array.isArray(value)) return undefined;
		return value.every((b) => b?._type === "block" && Array.isArray(b.children))
			? value
			: undefined;
	} catch {
		return undefined;
	}
}

function textToBlocks(text: string): PortableTextBlock[] {
	return text.split(/\n\s*\n/).map((paragraph, i) => ({
		_type: "block",
		_key: `default${i}`,
		style: "normal",
		markDefs: [],
		children: [{ _type: "span", _key: `default${i}s`, text: paragraph.trim(), marks: [] }],
	}));
}
