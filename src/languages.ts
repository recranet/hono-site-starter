// The texts the layout, the contact form, the thank-you page and the 404 show,
// per language. A language needs an entry here before it goes in `languages`.
const nl = {
	skip: "Naar de inhoud",
	menu: "Menu",
	close: "Sluiten",
	image: "Afbeelding",
	previous: "Vorige",
	next: "Volgende",
	form: {
		name: "Naam",
		email: "E-mail",
		message: "Bericht",
		send: "Versturen",
		invalid: "Vul je naam, een geldig e-mailadres en een bericht in.",
		recaptcha: "De reCAPTCHA-controle is mislukt. Probeer het opnieuw.",
		failed: "Je bericht is niet verstuurd. Probeer het later opnieuw.",
	},
	sent: {
		path: "/verzonden/",
		title: "Bericht verzonden",
		heading: "Bedankt",
		text: "Je bericht is verzonden. We nemen zo snel mogelijk contact met je op.",
	},
	notFound: "Pagina niet gevonden",
	back: "Terug naar de homepage",
};

export const messages = {
	nl,
	en: {
		skip: "Skip to content",
		menu: "Menu",
		close: "Close",
		image: "Image",
		previous: "Previous",
		next: "Next",
		form: {
			name: "Name",
			email: "Email",
			message: "Message",
			send: "Send",
			invalid: "Fill in your name, a valid email address and a message.",
			recaptcha: "The reCAPTCHA check failed. Please try again.",
			failed: "Your message was not sent. Please try again later.",
		},
		sent: {
			path: "/sent/",
			title: "Message sent",
			heading: "Thank you",
			text: "Your message has been sent. We will get back to you as soon as possible.",
		},
		notFound: "Page not found",
		back: "Back to the homepage",
	},
} satisfies Record<string, typeof nl>;

export type Lang = keyof typeof messages;

// The site's languages; the first is the default. With one, the pages live at
// the root (/over-ons/). With more, each page lives under its language
// (/nl/over-ons/, /en/about/) and / redirects to the first language's home.
// Each page in blocks.ts has a `lang` (default: the first language).
export const languages: Lang[] = ["nl"];

// The path prefix of a language: "" on a site with one language, else "/en".
export function prefix(lang: Lang) {
	return languages.length > 1 ? `/${lang}` : "";
}

// The language of a path, from its prefix; the default without one.
export function langAt(path: string): Lang {
	const first = path.split("/")[1];
	return (languages.length > 1 && languages.find((lang) => lang === first)) || languages[0];
}
