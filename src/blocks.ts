import { env } from "cloudflare:workers";
import {
	escapeHTML,
	toHTML,
	uriLooksSafe,
	type PortableTextComponents,
} from "@portabletext/to-html";
import { raw } from "hono/html";
import { languages, prefix, type Lang } from "./languages.ts";
import { srcset } from "./media.ts";
import { blockStyles, decorators, linkStyles } from "./text-styles.ts";

// The starter's text styles (text-styles.ts) in one text: a lead paragraph,
// a highlight and a button link.
const about: TextBlock[] = [
	{
		_type: "block",
		_key: "about0",
		style: "lead",
		markDefs: [],
		children: [
			{
				_type: "span",
				_key: "about0s",
				text: "De pagina's worden op de Worker gerenderd. De klant logt in en past de teksten aan.",
				marks: [],
			},
		],
	},
	{
		_type: "block",
		_key: "about1",
		style: "normal",
		markDefs: [],
		children: [
			{
				_type: "span",
				_key: "about1a",
				text: "Naast vet en cursief heeft de editor de ",
				marks: [],
			},
			{ _type: "span", _key: "about1b", text: "eigen tekststijlen", marks: ["highlight"] },
			{ _type: "span", _key: "about1c", text: " van de site, zoals een knop:", marks: [] },
		],
	},
	{
		_type: "block",
		_key: "about2",
		style: "normal",
		markDefs: [{ _type: "button", _key: "about2l", href: "/contact/" }],
		children: [{ _type: "span", _key: "about2s", text: "Neem contact op", marks: ["about2l"] }],
	},
];

// A paragraph, heading or list item, as stored. Marks name a decorator or the
// _key of one of the block's markDefs (a link and its href).
type TextBlock = {
	_type: "block";
	_key?: string;
	style?: string;
	listItem?: string;
	markDefs?: { _type: string; _key: string; href?: string }[];
	children: { _type: string; _key?: string; text?: string; marks?: string[] }[];
};

// The site's pages and the text blocks the customer can edit on each. The
// navbar lists the pages of the current language in this order. `lang` is
// one of `languages` (languages.ts); on a site with more than one, a page
// in another language names the page it translates in `translates`, and the
// language switch links the two. Keys are unique across languages (home,
// "en-home"). `text` shows until the
// customer saves the block; a blank line starts a new paragraph, and Portable
// Text gives it styles (home's `about` shows text-styles.ts). The admin
// lists them in this order. Names are part of the stored row: renaming one
// loses its saved text.
export const pages = {
	home: {
		title: "Home",
		lang: "nl",
		path: "/",
		blocks: {
			intro: {
				label: "Introductie",
				text: "Een site op Cloudflare Workers. De teksten zijn te bewerken via /admin/.",
			},
			about: { label: "Over deze site", text: about },
		},
	},
	"over-ons": {
		title: "Over ons",
		lang: "nl",
		path: "/over-ons/",
		blocks: {
			intro: { label: "Introductie", text: "Dit is een voorbeeldpagina met tekst." },
			body: { label: "Tekst", text: "Vertel hier wie je bent en wat je doet." },
		},
	},
	// The page parts in components.tsx, each once. A site deletes this page.
	onderdelen: {
		title: "Onderdelen",
		lang: "nl",
		path: "/onderdelen/",
		blocks: {
			intro: {
				label: "Introductie",
				text: "De onderdelen uit src/components.tsx. Gebruik op een pagina wat past en verwijder deze pagina.",
			},
			feature: {
				label: "Tekst naast afbeelding",
				text: "Een tekst naast een afbeelding, links of rechts. De klant past de tekst aan; de afbeelding staat in de code.\n\nDe kolom heeft de class article: alinea's, lijsten en citaten krijgen ruimte.",
			},
			cta: { label: "Oproep", text: "Een vlak in de merkkleur met knoppen." },
		},
	},
	contact: {
		title: "Contact",
		lang: "nl",
		path: "/contact/",
		blocks: {
			intro: { label: "Introductie", text: "Neem contact met ons op." },
		},
	},
} satisfies Record<string, Page>;

type Page = {
	title: string;
	lang?: Lang;
	translates?: string;
	// Without the language prefix: "/about/", not "/en/about/".
	path: string;
	blocks: Record<string, { label: string; text: string | TextBlock[] }>;
};
export type PageName = keyof typeof pages;
const all: Record<string, Page> = pages;

export function langOf(page: PageName): Lang {
	return all[page].lang ?? languages[0];
}

// A page's URL path, with its language prefix.
export function href(page: PageName) {
	return prefix(langOf(page)) + all[page].path;
}

// The pages in a language, in navbar order.
export function pagesIn(lang: Lang) {
	return (Object.keys(pages) as PageName[]).filter((page) => langOf(page) === lang);
}

export function pageAt(path: string) {
	return languages.flatMap(pagesIn).find((page) => href(page) === path);
}

// The same page in another language, if the site has it.
export function translation(page: PageName, lang: Lang) {
	const original = all[page].translates ?? page;
	return pagesIn(lang).find((p) => p === original || all[p].translates === original);
}

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
		raw(toHTML(clean(saved.get(name) ?? textToBlocks(defined[name].text)), { components }));
}

// One block's stored value, or its default as Portable Text, for the editor.
export async function readBlock(page: PageName, name: string) {
	const row = await db()
		?.prepare("SELECT value FROM block WHERE page = ? AND name = ?")
		.bind(page, name)
		.first<{ value: string }>();
	const defined: Page["blocks"] = pages[page].blocks;
	return clean(
		row ? (JSON.parse(row.value) as PortableTextBlock[]) : textToBlocks(defined[name].text),
	);
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

// An image (media.ts): `src` is /media/<id>.<ext>, the rest describes it. An
// image block is one on its own; a gallery block holds several.
type Image = { _key: string; src: string; alt: string; width?: number; height?: number };
type GalleryBlock = { _type: "gallery"; _key: string; images: Image[] };

const MEDIA_SRC = /^\/media\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

// One <img>. parseBlocks checked the stored value; src is checked again
// before it goes out. `sizes` says how wide it shows, for the srcset.
function img(image: Image, sizes: string, attrs = "") {
	if (!MEDIA_SRC.test(image.src)) return "";
	const w = Number(image.width) || undefined;
	const h = Number(image.height) || undefined;
	const set = srcset(image.src, w);
	return [
		`<img src="${image.src}" alt="${escapeHTML(image.alt ?? "")}"`,
		w && h ? ` width="${w}" height="${h}"` : "",
		set ? ` srcset="${set}" sizes="${sizes}"` : "",
		` loading="lazy" decoding="async"${attrs}>`,
	].join("");
}

const attr = (value: string) => escapeHTML(value).replaceAll('"', "&quot;");

const components: PortableTextComponents = {
	// The site's own paragraph styles; the built-in ones keep to-html's defaults.
	block: Object.fromEntries(
		Object.entries(blockStyles).map(([name, s]) => [
			name,
			({ children }) => `<${s.tag} class="${attr(s.class)}">${children ?? ""}</${s.tag}>`,
		]),
	),
	marks: {
		...Object.fromEntries(
			Object.entries(decorators).map(([name, d]) => [
				name,
				({ children }) => `<${d.tag} class="${attr(d.class)}">${children}</${d.tag}>`,
			]),
		),
		// A link with the style's classes. An unsafe URL leaves just the text, as with a plain link.
		...Object.fromEntries(
			Object.entries(linkStyles).map(([name, l]) => [
				name,
				({ children, value }) => {
					const href = typeof value?.href === "string" ? value.href : "";
					return uriLooksSafe(href)
						? `<a href="${attr(href)}" class="${attr(l.class)}">${children}</a>`
						: children;
				},
			]),
		),
	},
	types: {
		image: ({ value }: { value: Image }) =>
			`<figure class="my-6">${img(value, "(min-width: 48rem) 42rem, 100vw", ' class="h-auto max-w-full rounded-md"')}</figure>`,
		// A grid of square crops; each opens large in the lightbox (public/gallery.js).
		gallery: ({ value }: { value: GalleryBlock }) =>
			`<div class="gallery my-6 grid grid-cols-2 gap-3 md:grid-cols-3">${value.images
				.filter((image) => MEDIA_SRC.test(image.src))
				.map(
					(image) =>
						`<a href="${image.src}" class="block overflow-hidden rounded-md" data-gallery>${img(image, "(min-width: 48rem) 33vw, 50vw", ' class="aspect-square size-full object-cover transition-transform hover:scale-105"')}</a>`,
				)
				.join("")}</div>`,
	},
};

// What a text block may use: the built-in styles, marks and lists, and the
// site's own (text-styles.ts).
const STYLES = new Set(["normal", "h2", "h3", "blockquote", ...Object.keys(blockStyles)]);
const DECORATORS = new Set([
	"strong",
	"em",
	"underline",
	"strike-through",
	...Object.keys(decorators),
]);
const ANNOTATIONS = new Set(["link", ...Object.keys(linkStyles)]);
const LISTS = new Set(["bullet", "number"]);

// Drops what the site no longer has, so removing a text style never breaks a
// saved text: its blocks show as normal paragraphs, its marks as plain text.
function clean(value: PortableTextBlock[]): PortableTextBlock[] {
	return value.map((b) => {
		if (b._type !== "block") return b;
		const block = b as unknown as TextBlock;
		const markDefs = (block.markDefs ?? []).filter((def) => ANNOTATIONS.has(def._type));
		const keys = new Set(markDefs.map((def) => def._key));
		const known = (mark: string) => DECORATORS.has(mark) || keys.has(mark);
		return {
			...block,
			style: STYLES.has(block.style ?? "normal") ? block.style : "normal",
			markDefs,
			children: block.children.map((child) => ({
				...child,
				marks: child.marks?.filter(known),
			})),
		} as unknown as PortableTextBlock;
	});
}

// The editor's JSON as posted. Only text, image and gallery blocks with known
// styles and marks, and not too large; to-html escapes the text and drops
// unsafe link URLs when it renders.
export function parseBlocks(json: string): PortableTextBlock[] | undefined {
	if (json.length > 200_000) return undefined;
	try {
		const value: unknown = JSON.parse(json);
		if (!Array.isArray(value)) return undefined;
		return value.every(isBlock) ? value : undefined;
	} catch {
		return undefined;
	}
}

function isBlock(b: unknown): boolean {
	if (typeof b !== "object" || b === null) return false;
	const block = b as Record<string, unknown>;
	if (block._type === "block") return isTextBlock(block);
	if (block._type === "image") return isImage(block);
	if (block._type === "gallery") {
		const list = block.images;
		return Array.isArray(list) && list.length > 0 && list.length <= 60 && list.every(isImage);
	}
	return false;
}

function isTextBlock(block: Record<string, unknown>): boolean {
	const { style, listItem, markDefs = [], children } = block as Partial<TextBlock>;
	if (!Array.isArray(children) || !Array.isArray(markDefs)) return false;
	if (style !== undefined && !STYLES.has(style)) return false;
	if (listItem !== undefined && !LISTS.has(listItem)) return false;
	if (!markDefs.every((def) => ANNOTATIONS.has(def?._type))) return false;
	const keys = new Set(markDefs.map((def) => def._key));
	return children.every(
		(child) =>
			typeof child === "object" &&
			child !== null &&
			(child.marks ?? []).every((mark) => DECORATORS.has(mark) || keys.has(mark)),
	);
}

function isImage(i: unknown): boolean {
	if (typeof i !== "object" || i === null) return false;
	const image = i as Record<string, unknown>;
	const size = (n: unknown) => n === undefined || (Number.isInteger(n) && (n as number) > 0);
	return (
		typeof image.src === "string" &&
		MEDIA_SRC.test(image.src) &&
		typeof image.alt === "string" &&
		size(image.width) &&
		size(image.height)
	);
}

function textToBlocks(text: string | TextBlock[]): PortableTextBlock[] {
	if (typeof text !== "string") return text;
	return text.split(/\n\s*\n/).map((paragraph, i) => ({
		_type: "block",
		_key: `default${i}`,
		style: "normal",
		markDefs: [],
		children: [{ _type: "span", _key: `default${i}s`, text: paragraph.trim(), marks: [] }],
	}));
}
