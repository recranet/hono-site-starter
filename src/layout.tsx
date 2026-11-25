import { env } from "cloudflare:workers";
import { raw } from "hono/html";
import type { Child } from "hono/jsx";
import { pages } from "./blocks.ts";

// The shared page shell: fonts, the Tailwind stylesheet (src/styles/app.css),
// and the navbar with the pages from blocks.ts, the current one marked active.
// `form` loads reCAPTCHA and form.js, only on pages that show the contact form.
export function Layout(props: { title?: string; path?: string; form?: boolean; children: Child }) {
	const title = props.title ? `${props.title} - ${env.SITE_NAME}` : env.SITE_NAME;
	return (
		<>
			{raw("<!doctype html>")}
			<html lang="nl">
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<title>{title}</title>
					<link rel="preconnect" href="https://fonts.googleapis.com" />
					<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
					<link
						href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Stack+Sans+Notch:wght@200..700&display=swap"
						rel="stylesheet"
					/>
					<link rel="stylesheet" href="/style.css" />
					<script src="/navbar.js" defer></script>
					<script src="/gallery.js" defer></script>
					<script
						src="https://cdn.jsdelivr.net/npm/@alpinejs/focus@3.17.5/dist/cdn.min.js"
						defer
					></script>
					<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.17.5/dist/cdn.min.js" defer></script>
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
					<a class="sr-only bg-white p-2 focus:not-sr-only focus:absolute focus:z-50" href="#main">
						Naar de inhoud
					</a>
					<Navbar path={props.path} />
					<main id="main">{props.children}</main>
					<Lightbox />
				</body>
			</html>
		</>
	);
}

// Alpine attributes that aren't valid JSX names.
const drawer = {
	"x-trap.inert.noscroll": "menu && !$store.screen.xl",
	"x-transition:enter": "transition-transform duration-300",
	"x-transition:enter-start": "translate-x-full",
	"x-transition:enter-end": "translate-x-0",
	"x-transition:leave": "transition-transform duration-300",
	"x-transition:leave-start": "translate-x-0",
	"x-transition:leave-end": "translate-x-full",
};

// The navbar of the Elloro emdash-boilerplate: Alpine opens the menu as a
// drawer below the xl breakpoint (navbar.js), and shows it inline from xl up.
function Navbar(props: { path?: string }) {
	const links = Object.values(pages);
	return (
		<nav
			id="navbar"
			x-data="{ menu: false }"
			{...{ "@keydown.escape": "menu = false" }}
			class="sticky top-0 z-30 w-full bg-white py-2 shadow-sm"
		>
			<div class="container flex items-center gap-1">
				<a class="mr-auto block py-[0.4375rem]" href="/">
					<span class="logo"></span>
					<span class="sr-only">{env.SITE_NAME}</span>
				</a>
				<button
					class="btn btn-navbar btn-square xl:hidden"
					type="button"
					{...{ "@click": "menu = true", ":aria-expanded": "menu" }}
					aria-controls="navbarMenu"
					aria-label="Menu"
				>
					<svg class="size-[1em] fill-current" aria-hidden="true" viewBox="0 0 448 512">
						<path d="M0 88C0 74.7 10.7 64 24 64l400 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 112C10.7 112 0 101.3 0 88zM0 248c0-13.3 10.7-24 24-24l400 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 272c-13.3 0-24-10.7-24-24zM448 408c0 13.3-10.7 24-24 24L24 432c-13.3 0-24-10.7-24-24s10.7-24 24-24l400 0c13.3 0 24 10.7 24 24z" />
					</svg>
				</button>
				<div
					x-cloak=""
					x-show="menu && !$store.screen.xl"
					{...{ "x-transition.opacity": "", "@click": "menu = false" }}
					class="fixed inset-0 z-40 bg-black/50 cloak:hidden"
				></div>
				<div
					id="navbarMenu"
					x-cloak=""
					x-show="menu || $store.screen.xl"
					{...drawer}
					class="fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-full flex-col bg-white shadow-sm max-xl:cloak:hidden xl:static xl:z-auto xl:w-auto xl:max-w-none xl:flex-1 xl:flex-row xl:bg-transparent xl:shadow-none"
				>
					<div class="flex items-center justify-end px-8 py-4 xl:hidden">
						<button
							type="button"
							class="btn btn-navbar btn-square"
							{...{ "@click": "menu = false" }}
							aria-label="Sluiten"
						>
							<svg class="size-[1em] fill-current" aria-hidden="true" viewBox="0 0 384 512">
								<path d="M7.5 105c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l151 151 151-151c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-151 151 151 151c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-151-151-151 151c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l151-151-151-151z" />
							</svg>
						</button>
					</div>
					<div class="flex-1 overflow-y-auto px-8 pb-4 xl:flex xl:items-center xl:justify-end xl:overflow-visible xl:p-0">
						<ul class="flex flex-col xl:flex-row xl:flex-wrap xl:items-center xl:justify-end">
							{links.map((page, i) => (
								<li class={i < links.length - 1 ? "xl:mr-8" : undefined}>
									<a
										class={page.path === props.path ? "nav-link active" : "nav-link"}
										href={page.path}
										aria-current={page.path === props.path ? "page" : undefined}
									>
										{page.title}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</nav>
	);
}

// The large view of a gallery image (public/gallery.js). Arrow keys and the
// buttons step through the gallery; Escape or a click outside closes it.
function Lightbox() {
	const button =
		"btn btn-square absolute top-1/2 -translate-y-1/2 bg-white/90 text-body hover:bg-white";
	return (
		<dialog
			id="lightbox"
			aria-label="Afbeelding"
			class="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/85"
		>
			<img class="max-h-[90dvh] max-w-[92vw] rounded-md object-contain" alt="" />
			<button type="button" data-step="-1" class={`${button} left-2`} aria-label="Vorige">
				‹
			</button>
			<button type="button" data-step="1" class={`${button} right-2`} aria-label="Volgende">
				›
			</button>
			<form method="dialog">
				<button
					class="btn btn-square absolute top-2 right-2 bg-white/90 text-body hover:bg-white"
					aria-label="Sluiten"
				>
					×
				</button>
			</form>
		</dialog>
	);
}

// Keep the field names: handleContact in contact.ts reads them.
export function ContactForm() {
	return (
		<form method="post" action="/api/contact" class="grid gap-4">
			<div>
				<label class="form-label" for="name">
					Naam
				</label>
				<input
					class="form-input"
					id="name"
					name="name"
					required
					maxlength={200}
					autocomplete="name"
				/>
			</div>
			<div>
				<label class="form-label" for="email">
					E-mail
				</label>
				<input
					class="form-input"
					id="email"
					name="email"
					type="email"
					required
					maxlength={254}
					autocomplete="email"
				/>
			</div>
			<div>
				<label class="form-label" for="message">
					Bericht
				</label>
				<textarea
					class="form-input"
					id="message"
					name="message"
					required
					maxlength={5000}
					rows={6}
				></textarea>
			</div>
			<label class="hp" aria-hidden="true">
				Website <input name="website" tabindex={-1} autocomplete="off" />
			</label>
			<input type="hidden" name="recaptcha_token" />
			<div>
				<button class="btn btn-primary" type="submit">
					Versturen
				</button>
			</div>
		</form>
	);
}
