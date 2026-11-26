import { env } from "cloudflare:workers";
import { uriLooksSafe } from "@portabletext/to-html";
import type { Child } from "hono/jsx";
import type { HtmlEscapedString } from "hono/utils/html";
import { srcset } from "./media.ts";
import { IMAGE_SRC } from "./parts.ts";

// Page parts from the Elloro emdash-boilerplate (src/components there), as Hono
// JSX. They need no JS library: no Swiper, Fancybox or GSAP. The customer
// inserts them in the editor (parts.ts); renderPart below turns a saved part
// into HTML. Page code can use them directly too.
// The "Onderdelen" page shows each one. Delete what a site doesn't use.

// An image from public/ (/img/…) or the editor's uploads (/media/…). Give
// width and height when known, so the page doesn't shift while it loads.
export type Img = { src: string; alt: string; width?: number; height?: number };

export type Button = { label: string; href: string; style?: "default" | "outline" };

function Image(props: Img & { class?: string; sizes?: string; eager?: boolean }) {
	const set = props.src.startsWith("/media/") ? srcset(props.src, props.width) : undefined;
	return (
		<img
			src={props.src}
			alt={props.alt}
			width={props.width}
			height={props.height}
			srcset={set}
			sizes={set ? (props.sizes ?? "100vw") : undefined}
			loading={props.eager ? "eager" : "lazy"}
			fetchpriority={props.eager ? "high" : undefined}
			decoding="async"
			class={props.class}
		/>
	);
}

// A row of buttons. `on="dark"` gives the white variants for coloured panels;
// `on="image"` keeps the filled button and makes the outline one white.
export function Buttons(props: { buttons?: Button[]; on?: "dark" | "image"; class?: string }) {
	if (!props.buttons?.length) return null;
	const style = (b: Button) => {
		if (b.style === "outline") return props.on ? "btn-outline-white" : "btn-outline-primary";
		return props.on === "dark" ? "btn-white" : "btn-primary";
	};
	return (
		<div class={props.class ?? "flex flex-wrap gap-2"}>
			{props.buttons.map((b) => (
				<a class={`btn ${style(b)}`} href={b.href}>
					{b.label}
				</a>
			))}
		</div>
	);
}

// A section's heading: an optional small line above, the title (h1 or h2) and
// an intro.
export function SectionHeader(props: {
	title?: string;
	headline?: string;
	h1?: boolean;
	intro?: Child;
	class?: string;
}) {
	return (
		<header class={`mb-section-half ${props.class ?? ""}`}>
			{props.headline && <div>{props.headline}</div>}
			{props.title &&
				(props.h1 ? (
					<h1 class="not-last:mb-5">{props.title}</h1>
				) : (
					<h2 class="not-last:mb-5">{props.title}</h2>
				))}
			{props.intro && <div class="[&_p:last-child]:mb-0">{props.intro}</div>}
		</header>
	);
}

// The page's opening (emdash Hero). `cover`: white text over the image,
// darkened; `split`: text beside it. Without an image it is plain text.
// One image, no slider.
export function Hero(props: {
	title: string;
	intro?: Child;
	image?: Img;
	variant?: "cover" | "split";
	buttons?: Button[];
}) {
	const body = (onImage: boolean) => (
		<div class="relative z-1 py-[min(60px,calc(24px+3vw))]">
			<h1 class="text-pretty hyphens-auto xl:text-display">{props.title}</h1>
			{props.intro && (
				<div class="text-xl [&_a]:text-inherit [&_p:last-child]:mb-0">{props.intro}</div>
			)}
			<Buttons
				buttons={props.buttons}
				on={onImage ? "image" : undefined}
				class="mt-4 flex flex-wrap gap-2"
			/>
		</div>
	);
	if (props.image && props.variant === "split") {
		return (
			<section>
				<div class="container">
					<div class="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
						{body(false)}
						<Image
							{...props.image}
							class="h-auto w-full rounded-md"
							sizes="(min-width: 62rem) 50vw, 100vw"
							eager
						/>
					</div>
				</div>
			</section>
		);
	}
	if (!props.image) {
		return (
			<section>
				<div class="container">{body(false)}</div>
			</section>
		);
	}
	return (
		<section class="relative flex min-h-[max(60vh,30rem)] items-center overflow-hidden py-0! text-white">
			<div class="absolute inset-0">
				<Image {...props.image} class="size-full object-cover" eager />
				<div class="hero-shade pointer-events-none absolute inset-0"></div>
			</div>
			<div class="container">{body(true)}</div>
		</section>
	);
}

export type CardData = {
	title: string;
	text?: string;
	href?: string;
	image?: Img;
	style?: "default" | "overlay" | "text";
};

// A card (emdash ui/Card): `default` image above the text, `overlay` text on a
// darkened image, `text` text on the primary colour. With a link the whole
// card is clickable. Without an image, default and overlay show as text.
export function Card(props: CardData) {
	const shell =
		"group relative flex h-full flex-col overflow-hidden rounded-md shadow-sm transition-all duration-200 focus-within:outline-4 focus-within:outline-primary/25 hover:-translate-y-1 hover:shadow-md";
	const zoom = "transition-transform duration-200 group-hover:scale-105";
	const link = props.href && (
		<a href={props.href} class="stretched-link">
			<span class="sr-only">{props.title}</span>
		</a>
	);
	const style = props.image ? (props.style ?? "default") : "text";
	if (style === "overlay" && props.image) {
		return (
			<div class={`${shell} min-h-80 bg-dark text-white`}>
				{link}
				<div class="absolute inset-0 overflow-hidden">
					<Image
						{...props.image}
						class={`size-full object-cover ${zoom}`}
						sizes="(min-width: 62rem) 33vw, (min-width: 48rem) 50vw, 100vw"
					/>
				</div>
				<div class="absolute inset-0 flex flex-col justify-end overflow-hidden p-flow">
					<div class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-b from-transparent to-black/75"></div>
					<h3 class="relative z-1 mb-0 heading-3">{props.title}</h3>
					{props.text && <div class="relative z-1">{props.text}</div>}
				</div>
			</div>
		);
	}
	if (style === "default" && props.image) {
		return (
			<div class={`${shell} border border-black/15 bg-white`}>
				{link}
				<div class="overflow-hidden">
					<Image
						{...props.image}
						class={`aspect-[4/3] w-full object-cover ${zoom}`}
						sizes="(min-width: 62rem) 33vw, (min-width: 48rem) 50vw, 100vw"
					/>
				</div>
				<div class="p-flow">
					<h3 class="mb-0 heading-4">{props.title}</h3>
					{props.text && <div>{props.text}</div>}
				</div>
			</div>
		);
	}
	return (
		<div class={`${shell} justify-end bg-primary p-flow text-white`}>
			{link}
			<h3 class="mb-0 heading-3">{props.title}</h3>
			{props.text && <div>{props.text}</div>}
		</div>
	);
}

// Cards in a grid: three columns from lg, or `bento` (wide, narrow, narrow,
// wide on a 12-column grid, fixed row height; suits overlay and text cards).
export function Cards(props: {
	title?: string;
	intro?: Child;
	cards: CardData[];
	layout?: "grid" | "bento";
}) {
	const bento = ["lg:col-span-8", "lg:col-span-4", "lg:col-span-4", "lg:col-span-8"];
	return (
		<section class="overflow-hidden">
			<div class="container">
				{(props.title || props.intro) && (
					<SectionHeader
						title={props.title}
						intro={props.intro}
						class="mx-auto text-center lg:w-2/3"
					/>
				)}
				{props.layout === "bento" ? (
					<div class="grid auto-rows-[20rem] gap-4 md:grid-cols-2 lg:auto-rows-[24rem] lg:grid-cols-12 xl:gap-6">
						{props.cards.map((card, i) => (
							<div class={bento[i % bento.length]}>
								<Card {...card} />
							</div>
						))}
					</div>
				) : (
					<div class="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3 xl:gap-6">
						{props.cards.map((card) => (
							<Card {...card} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}

// Text and buttons beside an image (emdash Feature), the image on the left or
// right from lg up. `children` is the text, usually text("…") from blocks.ts.
export function Feature(props: {
	title?: string;
	headline?: string;
	image: Img & { caption?: string };
	align?: "left" | "right";
	buttons?: Button[];
	children: Child;
}) {
	const right = props.align === "right";
	return (
		<section>
			<div class="container">
				<div class="grid items-center gap-6 lg:grid-cols-12">
					<figure class={right ? "lg:col-span-5 lg:col-start-8 lg:row-start-1" : "lg:col-span-5"}>
						<Image
							{...props.image}
							class="h-auto max-w-full rounded-md"
							sizes="(min-width: 62rem) 42vw, 100vw"
						/>
						{props.image.caption && (
							<figcaption class="mt-2 text-sm text-muted">{props.image.caption}</figcaption>
						)}
					</figure>
					<article
						class={`article ${right ? "lg:col-span-6 lg:col-start-1 lg:row-start-1" : "lg:col-span-6 lg:col-start-7"}`}
					>
						<SectionHeader headline={props.headline} title={props.title} class="mb-0!" />
						{props.children}
						<Buttons buttons={props.buttons} />
					</article>
				</div>
			</div>
		</section>
	);
}

// Selling points (emdash Features): `grid` three columns with a round icon
// above the text, `list` one column with the icon beside it. Without an
// image the icon is a check.
export function Features(props: {
	title?: string;
	intro?: Child;
	items: { title: string; text?: string; image?: Img }[];
	layout?: "grid" | "list";
}) {
	const list = props.layout === "list";
	return (
		<section>
			<div class="container">
				{(props.title || props.intro) && (
					<SectionHeader
						title={props.title}
						intro={props.intro}
						class="mx-auto text-center lg:w-2/3"
					/>
				)}
				<div class={list ? "grid gap-6 lg:w-2/3" : "grid gap-6 md:grid-cols-2 lg:grid-cols-3"}>
					{props.items.map((item) => (
						<div class={list ? "flex items-start gap-4" : "flex flex-col gap-4"}>
							<div class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-light text-primary">
								{item.image ? (
									<Image {...item.image} class="size-full object-cover" sizes="5rem" />
								) : (
									<Check class="size-6" />
								)}
							</div>
							<div>
								<h3 class="mb-2 heading-5">{item.title}</h3>
								{item.text && <p class="mb-0 whitespace-pre-line">{item.text}</p>}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// Key figures with a label: two per row, all in one row from lg up.
export function Stats(props: {
	title?: string;
	intro?: Child;
	items: { value: string; label: string }[];
}) {
	return (
		<section>
			<div class="container">
				{(props.title || props.intro) && (
					<SectionHeader
						title={props.title}
						intro={props.intro}
						class="mx-auto text-center lg:w-2/3"
					/>
				)}
				<dl class="grid grid-cols-2 gap-6 text-center lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none">
					{props.items.map((item) => (
						<div class="flex flex-col-reverse">
							<dt>{item.label}</dt>
							<dd class="mb-1 font-heading text-h2 leading-none font-bold text-primary">
								{item.value}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}

// A call to action on the dark primary colour, optionally over a darkened
// background image.
export function Cta(props: { title?: string; image?: Img; buttons?: Button[]; children?: Child }) {
	return (
		<section class="relative bg-primary-dark! text-white">
			{props.image && (
				<div class="absolute inset-0">
					<Image {...props.image} class="size-full object-cover" />
					<div class="pointer-events-none absolute inset-0 bg-black/50"></div>
				</div>
			)}
			<div class="relative z-1 container text-center">
				<header class="mb-section-half [&_a]:text-inherit">
					{props.title && <h2 class="not-last:mb-5">{props.title}</h2>}
					{props.children}
				</header>
				<Buttons buttons={props.buttons} on="dark" class="flex flex-wrap justify-center gap-2" />
			</div>
		</section>
	);
}

// Questions and answers that open one at a time: <details> with a shared
// `name`, so no script. `name` must be unique on the page.
export function Accordion(props: { name: string; items: { title: string; text: Child }[] }) {
	return (
		<div class="overflow-hidden rounded-md border border-border">
			{props.items.map((item) => (
				<details name={props.name} class="group border-b border-border last:border-b-0">
					<summary class="flex cursor-pointer list-none items-center gap-4 bg-white px-5 py-4 leading-tight font-bold transition-colors group-open:bg-light group-open:text-primary focus-visible:relative focus-visible:z-1 focus-visible:outline-4 focus-visible:outline-primary/25 [&::-webkit-details-marker]:hidden">
						{item.title}
						<svg
							class="ml-auto size-4 shrink-0 fill-current transition-transform duration-200 group-open:rotate-180"
							aria-hidden="true"
							viewBox="0 0 448 512"
						>
							<path d="M207.5 409c9.4 9.4 24.6 9.4 33.9 0l200-200c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-183 183-183-183c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l200 200z" />
						</svg>
					</summary>
					<div class="px-5 py-4 whitespace-pre-line [&_p:last-child]:mb-0">{item.text}</div>
				</details>
			))}
		</div>
	);
}

function Check(props: { class: string }) {
	return (
		<svg class={`fill-current ${props.class}`} aria-hidden="true" viewBox="0 0 448 512">
			<path d="M438 68.5c10.8 7.7 13.2 22.7 5.5 33.5l-264 368c-4.1 5.7-10.5 9.4-17.5 9.9S148 478 143 473L7 337c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L157 419 404.5 74c7.7-10.8 22.7-13.2 33.5-5.5z" />
		</svg>
	);
}

// A list with check icons, each item a bold label and an optional line.
export function Checklist(props: { items: { label: string; text?: string }[] }) {
	return (
		<dl class="flex flex-col gap-1">
			{props.items.map((item) => (
				<div class="flex gap-4">
					<div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-light text-primary">
						<Check class="size-4" />
					</div>
					<div>
						<dt class="font-bold">{item.label}</dt>
						{item.text && <dd class="mb-2">{item.text}</dd>}
					</div>
				</div>
			))}
		</dl>
	);
}

// A quote with its source.
export function Quote(props: { source?: string; children: Child }) {
	return (
		<figure>
			<blockquote class="text-xl [&_p:last-child]:mb-0">{props.children}</blockquote>
			{props.source && (
				<figcaption class="text-sm text-muted before:content-['—_']">
					<cite>{props.source}</cite>
				</figcaption>
			)}
		</figure>
	);
}

// A row of small rounded labels.
export function Labels(props: { items: string[] }) {
	return (
		<ul class="flex flex-wrap gap-2">
			{props.items.map((item) => (
				<li class="badge rounded-full border border-border bg-light font-medium text-dark">
					{item}
				</li>
			))}
		</ul>
	);
}

// Google Maps for an address or place, with the keyless embed URL. Google
// sets its own cookies once it loads; a site with a consent banner loads it
// after consent.
export function GoogleMap(props: {
	query: string;
	title?: string;
	intro?: Child;
	height?: number;
}) {
	const src = `https://www.google.com/maps?q=${encodeURIComponent(props.query)}&output=embed`;
	return (
		<section>
			<div class="container">
				{(props.title || props.intro) && (
					<SectionHeader
						title={props.title}
						intro={props.intro}
						class="mx-auto text-center lg:w-2/3"
					/>
				)}
				<div class="overflow-hidden rounded-md" style={`height: ${props.height ?? 450}px`}>
					<iframe
						class="size-full border-0"
						title={props.title ?? props.query}
						loading="lazy"
						src={src}
						referrerpolicy="no-referrer-when-downgrade"
					></iframe>
				</div>
			</div>
		</section>
	);
}

// An endless line of large text. The items render twice so the loop has no
// gap; the copy is hidden from screen readers. Pauses on hover and stands
// still with reduced motion.
export function Marquee(props: { items: string[]; speed?: "slow" | "normal" | "fast" }) {
	const duration = { slow: "50s", normal: "30s", fast: "15s" }[props.speed ?? "normal"];
	return (
		<section class="overflow-hidden">
			<div
				class="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
				style={`--marquee-duration: ${duration}`}
			>
				{[false, true].map((copy) => (
					<ul class="flex shrink-0" aria-hidden={copy ? "true" : undefined}>
						{props.items.map((item) => (
							<li class="pr-12 font-heading text-h2 font-bold whitespace-nowrap text-primary after:pl-12 after:text-secondary after:content-['•']">
								{item}
							</li>
						))}
					</ul>
				))}
			</div>
		</section>
	);
}

// The site footer (emdash ui/Footer): logo and name, the navbar's pages and
// the year. `links` comes from the layout.
export function Footer(props: { home: string; links: { title: string; href: string }[] }) {
	return (
		<footer class="overflow-hidden">
			<div class="container">
				<div class="flex flex-wrap justify-between gap-6 py-section md:gap-12">
					<div>
						<a class="mb-flow block" href={props.home}>
							<span class="logo"></span>
							<span class="sr-only">{env.SITE_NAME}</span>
						</a>
						<span class="block heading-5">{env.SITE_NAME}</span>
					</div>
					<ul class="flex flex-col gap-2">
						{props.links.map((link) => (
							<li>
								<a class="text-body no-underline hover:text-primary" href={link.href}>
									{link.title}
								</a>
							</li>
						))}
					</ul>
				</div>
				<hr class="border-border" />
				<div class="py-6 text-sm">{`© ${new Date().getFullYear()} ${env.SITE_NAME}`}</div>
			</div>
		</footer>
	);
}

// A saved part (parts.ts) as HTML. blocks.ts checked its fields when it was
// saved; links and image paths are checked again here before they go out.
// The components are synchronous, so the element is already a string.
export function renderPart(value: Record<string, unknown>): string {
	const node = partNode(value);
	return node ? (node as HtmlEscapedString).toString() : "";
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const rows = (v: unknown) =>
	(Array.isArray(v) ? v : []).filter(
		(row): row is Record<string, unknown> => typeof row === "object" && row !== null,
	);
const href = (v: unknown) => (uriLooksSafe(str(v)) ? str(v) : "");
function img(v: unknown): Img | undefined {
	if (typeof v !== "object" || v === null) return undefined;
	const image = v as Record<string, unknown>;
	if (!IMAGE_SRC.test(str(image.src))) return undefined;
	const size = (n: unknown) => (typeof n === "number" && n > 0 ? n : undefined);
	return {
		src: str(image.src),
		alt: str(image.alt),
		width: size(image.width),
		height: size(image.height),
	};
}
function buttons(v: unknown): Button[] {
	return rows(v)
		.map((b) => ({
			label: str(b.label),
			href: href(b.href),
			style: b.style === "outline" ? ("outline" as const) : ("default" as const),
		}))
		.filter((b) => b.label && b.href);
}

// A plain text field: a blank line starts a new paragraph, a single line break stays.
function paragraphs(v: unknown) {
	const text = str(v);
	if (!text) return undefined;
	return text.split(/\n\s*\n/).map((p) => <p class="whitespace-pre-line">{p.trim()}</p>);
}

function partNode(v: Record<string, unknown>) {
	const title = str(v.title) || undefined;
	const intro = paragraphs(v.intro);
	switch (v._type) {
		case "hero":
			return (
				<Hero
					title={str(v.title)}
					intro={intro}
					image={img(v.image)}
					variant={v.variant === "split" ? "split" : "cover"}
					buttons={buttons(v.buttons)}
				/>
			);
		case "feature": {
			const image = img(v.image);
			if (!image) return null;
			return (
				<Feature
					title={title}
					headline={str(v.headline) || undefined}
					image={{ ...image, caption: str(v.caption) || undefined }}
					align={v.align === "right" ? "right" : "left"}
					buttons={buttons(v.buttons)}
				>
					{paragraphs(v.text)}
				</Feature>
			);
		}
		case "cards":
			return (
				<Cards
					title={title}
					intro={intro}
					layout={v.layout === "bento" ? "bento" : "grid"}
					cards={rows(v.cards).map((c) => ({
						title: str(c.title),
						text: str(c.text) || undefined,
						href: href(c.href) || undefined,
						image: img(c.image),
						style: c.style === "overlay" || c.style === "text" ? c.style : "default",
					}))}
				/>
			);
		case "features":
			return (
				<Features
					title={title}
					intro={intro}
					layout={v.layout === "list" ? "list" : "grid"}
					items={rows(v.items).map((i) => ({
						title: str(i.title),
						text: str(i.text) || undefined,
						image: img(i.image),
					}))}
				/>
			);
		case "stats":
			return (
				<Stats
					title={title}
					intro={intro}
					items={rows(v.items).map((i) => ({ value: str(i.value), label: str(i.label) }))}
				/>
			);
		case "cta":
			return (
				<Cta title={title} image={img(v.image)} buttons={buttons(v.buttons)}>
					{paragraphs(v.text)}
				</Cta>
			);
		case "marquee":
			return (
				<Marquee
					items={rows(v.items).map((i) => str(i.text))}
					speed={v.speed === "slow" || v.speed === "fast" ? v.speed : "normal"}
				/>
			);
		case "map":
			return str(v.query) ? <GoogleMap title={title} intro={intro} query={str(v.query)} /> : null;
		case "accordion":
			return (
				<Accordion
					name={`accordion-${str(v._key)}`}
					items={rows(v.items).map((i) => ({ title: str(i.title), text: paragraphs(i.text) }))}
				/>
			);
		case "quote":
			return <Quote source={str(v.source) || undefined}>{paragraphs(v.text)}</Quote>;
		case "checklist":
			return (
				<Checklist
					items={rows(v.items).map((i) => ({
						label: str(i.label),
						text: str(i.text) || undefined,
					}))}
				/>
			);
		case "labels":
			return <Labels items={rows(v.items).map((i) => str(i.text))} />;
		default:
			return null;
	}
}
