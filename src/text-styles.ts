import type { TextStyles } from "@recranet/worker-site-editor";
import { button, highlight, lead } from "@recranet/worker-site-editor/extensions";

// The site's own text styles, on top of the built-in ones (bold, italic,
// headings, quote, lists, link, images). Each entry is a toolbar button in the
// editor (`label`, Dutch) and the HTML it renders as on the page and in the
// editor: `tag` with `class`. Classes are Tailwind utilities or classes from
// src/styles/app.css; the admin loads that stylesheet too, so the editor shows
// them as the page does.
//
// The starter picks three of the package's examples; a site adds its own
// ({ label, tag, class }) or picks others (footnote). Keys are stored in the
// texts. Removing one is safe: a saved text that uses it shows that part as
// normal text.
export const textStyles: TextStyles = {
	// Paragraph styles, like a lead paragraph.
	blockStyles: { lead },
	// Styles for selected words, like a highlight.
	decorators: { highlight },
	// Links that look different, like a button. The editor asks for the address.
	linkStyles: { button },
};
