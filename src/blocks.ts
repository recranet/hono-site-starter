import type { Block, Field, TextBlock } from "@recranet/worker-site-editor";
import { languages, prefix, type Lang } from "./languages.ts";

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
function part(type: string, fields: Record<string, unknown>): Block {
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

// Page fields: values beside a page's texts, in a form ("Gegevens" in the
// admin). `as const` keeps the names, so `text.fields.heading` is typed.
// Every image needs an alt text, in defaults too (the site won't start
// without), except a `decorative` one like the banner, which stores alt "".
const headed = [
	{ name: "heading", label: "Kop", kind: "text", required: true },
	{ name: "banner", label: "Banner", kind: "image", decorative: true },
] as const satisfies readonly Field[];

// The site's pages, each with the texts the customer can edit. The navbar
// lists the pages of the current language in this order. `lang` is one of
// `languages` (languages.ts); on a site with more than one, a page in another
// language names the page it translates in `translates`, and the language
// switch links the two. Keys are unique across languages (home, "en-home").
//
// A page is one `body` text: the blocks the customer inserts (editor.ts)
// render full width, the paragraphs between them in a text column. `default`
// shows until the customer saves it: a string (a blank line starts a new
// paragraph) or Portable Text with blocks. The page key and the text's name
// are the stored row's key: renaming one loses its saved text.
export const pages = {
	home: {
		title: "Home",
		lang: "nl",
		path: "/",
		texts: {
			body: {
				label: "Pagina",
				default: [
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
		texts: {
			body: {
				label: "Pagina",
				default: [
					part("hero", { title: "Over ons", intro: "Dit is een voorbeeldpagina met tekst." }),
					p("Vertel hier wie je bent en wat je doet."),
				],
			},
		},
	},
	// The news overview (index.tsx): its heading and banner are page fields, a
	// form the customer fills in under "Gegevens", and the items below them
	// come from the Nieuws collection (collections.ts).
	nieuws: {
		title: "Nieuws",
		lang: "nl",
		path: "/nieuws/",
		fields: headed,
		defaults: { heading: "Nieuws", banner: { ...placeholder, alt: "" } },
		texts: {
			body: { label: "Tekst boven de berichten", default: "Het laatste nieuws." },
		},
	},
	// Every part once, with placeholder content. A site deletes this page.
	onderdelen: {
		title: "Onderdelen",
		lang: "nl",
		path: "/onderdelen/",
		texts: {
			body: {
				label: "Pagina",
				default: [
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
		texts: {
			// The form shows below this text (index.tsx).
			body: {
				label: "Pagina",
				default: [part("hero", { title: "Contact", intro: "Neem contact met ons op." })],
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
	texts: Record<string, { label: string; default: string | Block[] }>;
	// The form's fields and its values until the customer saves it.
	fields?: readonly Field[];
	defaults?: Record<string, unknown>;
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
