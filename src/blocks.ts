import { env } from "cloudflare:workers";
import {
	escapeHTML,
	toHTML,
	uriLooksSafe,
	type PortableTextComponents,
} from "@portabletext/to-html";
import { raw } from "hono/html";
import { renderPart } from "./components.tsx";
import { languages, prefix, type Lang } from "./languages.ts";
import { srcset } from "./media.ts";
import { IMAGE_SRC, parts, type Field } from "./parts.ts";
import { blockStyles, decorators, linkStyles } from "./text-styles.ts";

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

// A page part (parts.ts) as stored: its type and its fields.
type PartBlock = { _type: string; _key: string; [field: string]: unknown };

// Builders for the default texts below. Keys only need to be unique within
// one text; the editor keeps them when the customer saves.
let next = 0;
const key = () => `d${next++}`;
function p(text: string, style = "normal"): TextBlock {
	return {
		_type: "block",
		_key: key(),
		style,
		markDefs: [],
		children: [{ _type: "span", _key: key(), text, marks: [] }],
	};
}
function part(type: string, fields: Record<string, unknown>): PartBlock {
	return { _type: type, _key: key(), ...fields };
}
// A list field's items, each with a _key.
function items(list: Record<string, unknown>[]) {
	return list.map((item) => ({ _key: key(), ...item }));
}

const placeholder = {
	src: "/img/placeholder.svg",
	alt: "Voorbeeldafbeelding: bergen en een zon",
	width: 1600,
	height: 1200,
};

// The site's pages, each with the texts the customer can edit. The navbar
// lists the pages of the current language in this order. `lang` is one of
// `languages` (languages.ts); on a site with more than one, a page in another
// language names the page it translates in `translates`, and the language
// switch links the two. Keys are unique across languages (home, "en-home").
//
// A page is one `body` text: the page parts (parts.ts) the customer inserts
// render full width, the paragraphs between them in a text column. `text`
// shows until the customer saves it: a string (a blank line starts a new
// paragraph) or Portable Text with parts. Names are part of the stored row:
// renaming one loses its saved text.
export const pages = {
	home: {
		title: "Home",
		lang: "nl",
		path: "/",
		blocks: {
			body: {
				label: "Pagina",
				text: [
					part("hero", {
						title: "Welkom",
						intro:
							"Een site op Cloudflare Workers. De klant bouwt de pagina's zelf op via /admin/.",
						buttons: items([{ label: "Neem contact op", href: "/contact/" }]),
					}),
					p("Over deze site", "h2"),
					p("De pagina's worden op de Worker gerenderd. De klant logt in en past ze aan.", "lead"),
					// The site's own text styles (text-styles.ts): a highlight and a button link.
					{
						_type: "block",
						_key: key(),
						style: "normal",
						markDefs: [],
						children: [
							{
								_type: "span",
								_key: key(),
								text: "Naast vet en cursief heeft de editor de ",
								marks: [],
							},
							{ _type: "span", _key: key(), text: "eigen tekststijlen", marks: ["highlight"] },
							{ _type: "span", _key: key(), text: " van de site, zoals een knop:", marks: [] },
						],
					},
					{
						_type: "block",
						_key: "home-button",
						style: "normal",
						markDefs: [{ _type: "button", _key: "home-button-link", href: "/onderdelen/" }],
						children: [
							{
								_type: "span",
								_key: key(),
								text: "Bekijk de onderdelen",
								marks: ["home-button-link"],
							},
						],
					},
				],
			},
		},
	},
	"over-ons": {
		title: "Over ons",
		lang: "nl",
		path: "/over-ons/",
		blocks: {
			body: {
				label: "Pagina",
				text: [
					part("hero", { title: "Over ons", intro: "Dit is een voorbeeldpagina met tekst." }),
					p("Vertel hier wie je bent en wat je doet."),
				],
			},
		},
	},
	// Every part once, with placeholder content. A site deletes this page.
	onderdelen: {
		title: "Onderdelen",
		lang: "nl",
		path: "/onderdelen/",
		blocks: {
			body: {
				label: "Pagina",
				text: [
					part("hero", {
						title: "Onderdelen",
						intro:
							"Deze pagina is één tekst. Elk vlak is een onderdeel dat de klant in de editor invoegt en invult.",
						image: placeholder,
						variant: "cover",
						buttons: items([{ label: "Neem contact op", href: "/contact/" }]),
					}),
					part("feature", {
						headline: "Tekst naast afbeelding",
						title: "Afbeelding links of rechts",
						text: "Met een tekst, knoppen en een onderschrift bij de afbeelding.\n\nEen lege regel begint een nieuwe alinea.",
						image: placeholder,
						caption: "Een onderschrift",
						align: "left",
						buttons: items([{ label: "Lees meer", href: "/over-ons/", style: "outline" }]),
					}),
					part("cards", {
						title: "Kaarten",
						intro: "Drie stijlen: met afbeelding, tekst over de afbeelding en alleen tekst.",
						layout: "grid",
						cards: items([
							{
								title: "Kaart",
								text: "Afbeelding boven de tekst",
								href: "/over-ons/",
								image: placeholder,
							},
							{
								title: "Overlay",
								text: "Tekst over de afbeelding",
								href: "/over-ons/",
								image: placeholder,
								style: "overlay",
							},
							{
								title: "Tekst",
								text: "Alleen tekst, in de merkkleur",
								href: "/over-ons/",
								style: "text",
							},
						]),
					}),
					part("cards", {
						title: "Bento",
						layout: "bento",
						cards: items([
							{ title: "Breed", image: placeholder, style: "overlay" },
							{ title: "Smal", image: placeholder, style: "overlay" },
							{ title: "Smal", style: "text" },
							{ title: "Breed", image: placeholder, style: "overlay" },
						]),
					}),
					part("features", {
						title: "Kenmerken",
						layout: "grid",
						items: items([
							{ title: "Snel", text: "Pagina's komen van de Worker, dicht bij de bezoeker." },
							{ title: "Bewerkbaar", text: "De klant bouwt de pagina op via /admin/." },
							{ title: "Licht", text: "Geen JavaScript-bibliotheken nodig.", image: placeholder },
						]),
					}),
					part("stats", {
						title: "Kerncijfers",
						items: items([
							{ value: "25+", label: "jaar ervaring" },
							{ value: "1.200", label: "klanten" },
							{ value: "98%", label: "tevreden" },
							{ value: "24/7", label: "bereikbaar" },
						]),
					}),
					p("In de tekstkolom", "h2"),
					p(
						"Tussen de vlakken staat gewone tekst. Uitklapvragen, een citaat, een vinkjeslijst en labels staan in die kolom.",
					),
					part("accordion", {
						items: items([
							{ title: "Opent één vraag tegelijk?", text: "Ja, zonder script." },
							{
								title: "Kan een antwoord lang zijn?",
								text: "Ja.\n\nEen lege regel begint een nieuwe alinea.",
							},
						]),
					}),
					part("checklist", {
						items: items([
							{ label: "Vinkjeslijst", text: "Met een regel uitleg" },
							{ label: "Alleen een punt" },
						]),
					}),
					part("quote", { text: "Een citaat met de bron eronder.", source: "Een klant" }),
					part("labels", {
						items: items([{ text: "Label" }, { text: "Nog een label" }, { text: "Derde" }]),
					}),
					part("cta", {
						title: "Oproep",
						text: "Een vlak in de merkkleur met knoppen.",
						buttons: items([
							{ label: "Neem contact op", href: "/contact/" },
							{ label: "Over ons", href: "/over-ons/", style: "outline" },
						]),
					}),
					part("marquee", {
						speed: "normal",
						items: items([
							{ text: "Lopende tekst" },
							{ text: "Pauzeert bij hover" },
							{ text: "Staat stil bij reduced motion" },
						]),
					}),
					part("map", { title: "Kaart", query: "Middelburg" }),
					part("hero", {
						title: "Hero naast afbeelding",
						intro: "De andere weergave: tekst naast de afbeelding.",
						image: placeholder,
						variant: "split",
					}),
				],
			},
		},
	},
	contact: {
		title: "Contact",
		lang: "nl",
		path: "/contact/",
		blocks: {
			// The form shows below this text (index.tsx).
			body: {
				label: "Pagina",
				text: [part("hero", { title: "Contact", intro: "Neem contact met ons op." })],
			},
		},
	},
} satisfies Record<string, Page>;

type Page = {
	title: string;
	lang?: Lang;
	translates?: string;
	// Without the language prefix: "/about/", not "/en/about/".
	path: string;
	blocks: Record<string, { label: string; text: string | (TextBlock | PartBlock)[] }>;
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
// `text.page(name)` renders it as the page's sections instead: each section
// part on its own, the blocks between them in a text column.
export async function blocks<P extends PageName>(page: P) {
	const saved = new Map<string, PortableTextBlock[]>();
	const rows = await db()
		?.prepare("SELECT name, value FROM block WHERE page = ?")
		.bind(page)
		.all<{ name: string; value: string }>();
	for (const row of rows?.results ?? []) saved.set(row.name, JSON.parse(row.value));
	const defined: Page["blocks"] = pages[page].blocks;
	type Name = keyof (typeof pages)[P]["blocks"] & string;
	const value = (name: Name) => clean(saved.get(name) ?? textToBlocks(defined[name].text));
	const text = (name: Name) => raw(toHTML(value(name), { components }));
	return Object.assign(text, { page: (name: Name) => raw(sections(value(name))) });
}

function sections(value: PortableTextBlock[]) {
	const html: string[] = [];
	let run: PortableTextBlock[] = [];
	const flush = () => {
		if (run.length === 0) return;
		html.push(
			`<section><div class="container"><div class="article max-w-3xl">${toHTML(run, { components })}</div></div></section>`,
		);
		run = [];
	};
	for (const block of value) {
		if (parts[block._type]?.section) {
			flush();
			html.push(toHTML(block, { components }));
		} else run.push(block);
	}
	flush();
	return html.join("");
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
		// The page parts (parts.ts), rendered by components.tsx.
		...Object.fromEntries(
			Object.keys(parts).map((name) => [
				name,
				({ value }: { value: Record<string, unknown> }) => renderPart(value),
			]),
		),
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

// Drops what the site no longer has, so removing a text style or a part never
// breaks a saved text: its blocks show as normal paragraphs, its marks as
// plain text, and a removed part is left out.
const OBJECTS = new Set(["image", "gallery", ...Object.keys(parts)]);
function clean(value: PortableTextBlock[]): PortableTextBlock[] {
	return value.flatMap((b) => {
		if (b._type !== "block") return OBJECTS.has(b._type) ? [b] : [];
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

// The editor's JSON as posted. Only text, image, gallery and part blocks with
// known styles, marks and fields, and not too large; to-html and JSX escape
// the text when it renders.
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
	const part = typeof block._type === "string" ? parts[block._type] : undefined;
	return part !== undefined && hasFields(block, part.fields);
}

// A part or one item of its lists: only its own fields (and _type, _key),
// each of the right kind.
function hasFields(value: Record<string, unknown>, fields: Field[]): boolean {
	const names = new Set(["_type", "_key", ...fields.map((f) => f.name)]);
	if (Object.keys(value).some((name) => !names.has(name))) return false;
	return fields.every((f) => isField(value[f.name], f));
}

function isField(value: unknown, field: Field): boolean {
	if (value === undefined || value === "") return !("required" in field && field.required);
	switch (field.kind) {
		case "text":
			return typeof value === "string" && value.length <= 300;
		case "textarea":
			return typeof value === "string" && value.length <= 5000;
		case "url":
			return typeof value === "string" && value.length <= 2000 && uriLooksSafe(value);
		case "select":
			return typeof value === "string" && Object.hasOwn(field.options, value);
		case "image":
			return isPartImage(value);
		case "items":
			return (
				Array.isArray(value) &&
				value.length <= 50 &&
				value.every(
					(item) => typeof item === "object" && item !== null && hasFields(item, field.fields),
				)
			);
	}
}

function isPartImage(i: unknown): boolean {
	if (typeof i !== "object" || i === null) return false;
	const image = i as Record<string, unknown>;
	const size = (n: unknown) => n === undefined || (Number.isInteger(n) && (n as number) > 0);
	return (
		typeof image.src === "string" &&
		IMAGE_SRC.test(image.src) &&
		typeof image.alt === "string" &&
		image.alt.length <= 300 &&
		size(image.width) &&
		size(image.height)
	);
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

function textToBlocks(text: string | (TextBlock | PartBlock)[]): PortableTextBlock[] {
	if (typeof text !== "string") return text as PortableTextBlock[];
	return text.split(/\n\s*\n/).map((paragraph, i) => ({
		_type: "block",
		_key: `default${i}`,
		style: "normal",
		markDefs: [],
		children: [{ _type: "span", _key: `default${i}s`, text: paragraph.trim(), marks: [] }],
	}));
}
