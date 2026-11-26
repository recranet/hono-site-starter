// The page parts the customer inserts in the editor, each a Portable Text
// block object with the fields below. One definition serves three places:
// the admin (a form per part, admin/admin.tsx), saving (blocks.ts checks a
// posted part against its fields) and the page (components.tsx renders it).
//
// `section` parts render full width; the others sit in the text column with
// the paragraphs around them. Labels are Dutch: the customer sees them.
// Keys and field names are stored in the texts. Removing a part is safe: a
// saved text that has one leaves it out.

export type Field =
	| { name: string; label: string; kind: "text" | "textarea" | "url" | "image"; required?: boolean }
	| { name: string; label: string; kind: "select"; options: Record<string, string> }
	| { name: string; label: string; kind: "items"; item: string; fields: ItemField[] };

// The fields of one item in a list: no lists inside lists.
export type ItemField = Exclude<Field, { kind: "items" }>;

export type Part = { label: string; section: boolean; fields: Field[] };

const buttons: Field = {
	name: "buttons",
	label: "Knoppen",
	item: "Knop",
	kind: "items",
	fields: [
		{ name: "label", label: "Tekst", kind: "text", required: true },
		{ name: "href", label: "Link", kind: "url", required: true },
		{
			name: "style",
			label: "Stijl",
			kind: "select",
			options: { default: "Gevuld", outline: "Omlijnd" },
		},
	],
};
const title: Field = { name: "title", label: "Titel", kind: "text" };
const intro: Field = { name: "intro", label: "Introductie", kind: "textarea" };

export const parts: Record<string, Part> = {
	hero: {
		label: "Hero",
		section: true,
		fields: [
			{ name: "title", label: "Titel", kind: "text", required: true },
			intro,
			{ name: "image", label: "Afbeelding", kind: "image" },
			{
				name: "variant",
				label: "Weergave",
				kind: "select",
				options: { cover: "Tekst over de afbeelding", split: "Tekst naast de afbeelding" },
			},
			buttons,
		],
	},
	feature: {
		label: "Tekst naast afbeelding",
		section: true,
		fields: [
			{ name: "headline", label: "Bovenregel", kind: "text" },
			title,
			{ name: "text", label: "Tekst", kind: "textarea" },
			{ name: "image", label: "Afbeelding", kind: "image", required: true },
			{ name: "caption", label: "Onderschrift", kind: "text" },
			{
				name: "align",
				label: "Afbeelding",
				kind: "select",
				options: { left: "Links", right: "Rechts" },
			},
			buttons,
		],
	},
	cards: {
		label: "Kaarten",
		section: true,
		fields: [
			title,
			intro,
			{
				name: "layout",
				label: "Indeling",
				kind: "select",
				options: { grid: "Raster", bento: "Bento" },
			},
			{
				name: "cards",
				label: "Kaarten",
				item: "Kaart",
				kind: "items",
				fields: [
					{ name: "title", label: "Titel", kind: "text", required: true },
					{ name: "text", label: "Tekst", kind: "textarea" },
					{ name: "href", label: "Link", kind: "url" },
					{ name: "image", label: "Afbeelding", kind: "image" },
					{
						name: "style",
						label: "Stijl",
						kind: "select",
						options: {
							default: "Afbeelding boven de tekst",
							overlay: "Tekst over de afbeelding",
							text: "Alleen tekst",
						},
					},
				],
			},
		],
	},
	features: {
		label: "Kenmerken",
		section: true,
		fields: [
			title,
			intro,
			{
				name: "layout",
				label: "Indeling",
				kind: "select",
				options: { grid: "Raster", list: "Lijst" },
			},
			{
				name: "items",
				label: "Kenmerken",
				item: "Kenmerk",
				kind: "items",
				fields: [
					{ name: "title", label: "Titel", kind: "text", required: true },
					{ name: "text", label: "Tekst", kind: "textarea" },
					{ name: "image", label: "Icoon", kind: "image" },
				],
			},
		],
	},
	stats: {
		label: "Kerncijfers",
		section: true,
		fields: [
			title,
			intro,
			{
				name: "items",
				label: "Cijfers",
				item: "Cijfer",
				kind: "items",
				fields: [
					{ name: "value", label: "Waarde", kind: "text", required: true },
					{ name: "label", label: "Omschrijving", kind: "text", required: true },
				],
			},
		],
	},
	cta: {
		label: "Oproep",
		section: true,
		fields: [
			title,
			{ name: "text", label: "Tekst", kind: "textarea" },
			{ name: "image", label: "Achtergrond", kind: "image" },
			buttons,
		],
	},
	marquee: {
		label: "Lopende tekst",
		section: true,
		fields: [
			{
				name: "speed",
				label: "Snelheid",
				kind: "select",
				options: { normal: "Normaal", slow: "Langzaam", fast: "Snel" },
			},
			{
				name: "items",
				label: "Teksten",
				item: "Tekst",
				kind: "items",
				fields: [{ name: "text", label: "Tekst", kind: "text", required: true }],
			},
		],
	},
	map: {
		label: "Kaart (Google Maps)",
		section: true,
		fields: [
			title,
			intro,
			{ name: "query", label: "Adres of plaats", kind: "text", required: true },
		],
	},
	accordion: {
		label: "Uitklapvragen",
		section: false,
		fields: [
			{
				name: "items",
				label: "Vragen",
				item: "Vraag",
				kind: "items",
				fields: [
					{ name: "title", label: "Vraag", kind: "text", required: true },
					{ name: "text", label: "Antwoord", kind: "textarea", required: true },
				],
			},
		],
	},
	quote: {
		label: "Citaat met bron",
		section: false,
		fields: [
			{ name: "text", label: "Citaat", kind: "textarea", required: true },
			{ name: "source", label: "Bron", kind: "text" },
		],
	},
	checklist: {
		label: "Vinkjeslijst",
		section: false,
		fields: [
			{
				name: "items",
				label: "Punten",
				item: "Punt",
				kind: "items",
				fields: [
					{ name: "label", label: "Punt", kind: "text", required: true },
					{ name: "text", label: "Uitleg", kind: "text" },
				],
			},
		],
	},
	labels: {
		label: "Labels",
		section: false,
		fields: [
			{
				name: "items",
				label: "Labels",
				item: "Label",
				kind: "items",
				fields: [{ name: "text", label: "Tekst", kind: "text", required: true }],
			},
		],
	},
};

// An image in a part: { src, alt, width, height } as in an image block, but
// `src` may also be a file shipped in public/img/ (the defaults use those).
export const IMAGE_SRC =
	/^\/(media\/[0-9a-f-]{36}\.(jpg|png|webp|avif)|img\/[\w-]+(\/[\w-]+)*\.(svg|png|jpg|webp|avif))$/;
