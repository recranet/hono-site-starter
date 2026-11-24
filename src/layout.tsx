import { env } from "cloudflare:workers";
import { raw } from "hono/html";
import type { Child } from "hono/jsx";

// The shared page shell. `form` loads reCAPTCHA and form.js, only on pages
// that show the contact form.
export function Layout(props: { title?: string; form?: boolean; children: Child }) {
	const title = props.title ? `${props.title} - ${env.SITE_NAME}` : env.SITE_NAME;
	return (
		<>
			{raw("<!doctype html>")}
			<html lang="nl">
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<title>{title}</title>
					<link rel="stylesheet" href="/style.css" />
					{props.form && (
						<>
							<script
								src={`https://www.google.com/recaptcha/enterprise.js?render=${env.RECAPTCHA_SITE_KEY}`}
								defer
							></script>
							<script src="/form.js" defer></script>
						</>
					)}
				</head>
				<body>
					<main>{props.children}</main>
				</body>
			</html>
		</>
	);
}

// Keep the field names: handleContact in contact.ts reads them.
export function ContactForm() {
	return (
		<form method="post" action="/contact">
			<label>
				Naam <input name="name" required maxlength={200} autocomplete="name" />
			</label>
			<label>
				E-mail <input name="email" type="email" required maxlength={254} autocomplete="email" />
			</label>
			<label>
				Bericht <textarea name="message" required maxlength={5000} rows={6}></textarea>
			</label>
			<label class="hp" aria-hidden="true">
				Website <input name="website" tabindex={-1} autocomplete="off" />
			</label>
			<input type="hidden" name="recaptcha_token" />
			<button type="submit">Versturen</button>
		</form>
	);
}
