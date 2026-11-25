// The site's own text styles, on top of the built-in ones (bold, italic,
// headings, quote, lists, link, images). Each entry is a toolbar button in the
// editor (`label`, Dutch) and the HTML it renders as on the page and in the
// editor: `tag` with `class`. Classes are Tailwind utilities or classes from
// src/styles/app.css; the admin loads that stylesheet too, so the editor shows
// them as the page does.
//
// The examples below are this starter's; a site replaces them with its own.
// Keys are stored in the texts. Removing one is safe: a saved text that uses
// it shows that part as normal text.

// Paragraph styles, like a lead paragraph.
export const blockStyles: Record<string, { label: string; tag: string; class: string }> = {
	lead: { label: "Intro", tag: "p", class: "lead" },
};

// Styles for selected words, like a highlight.
export const decorators: Record<string, { label: string; tag: string; class: string }> = {
	highlight: { label: "Markeren", tag: "mark", class: "highlight" },
};

// Links that look different, like a button. The editor asks for the address
// as it does for a plain link.
export const linkStyles: Record<string, { label: string; class: string }> = {
	button: { label: "Knop", class: "btn btn-primary" },
};
