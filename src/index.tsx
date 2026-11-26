import { Hono } from "hono";
import { appendTrailingSlash } from "hono/trailing-slash";
import { admin } from "./admin/index.tsx";
import { blocks, href } from "./blocks.ts";
import {
	Accordion,
	Cards,
	Checklist,
	Cta,
	Feature,
	Features,
	GoogleMap,
	Hero,
	Labels,
	Marquee,
	Quote,
	Stats,
} from "./components.tsx";
import { handleContact } from "./contact.ts";
import { langAt, languages, messages, prefix } from "./languages.ts";
import { ContactForm, Layout } from "./layout.tsx";
import { serveMedia } from "./media.ts";

// Pages render here with Hono JSX. Files in public/ (CSS, JS, images) are
// served before the Worker runs.
const app = new Hono({ strict: true });

// /over-ons -> /over-ons/, so every page has one URL.
app.use(appendTrailingSlash());

// More than one language: / goes to the first language's home (languages.ts).
if (languages.length > 1) app.get("/", (c) => c.redirect(`${prefix(languages[0])}/`));

// A page with editable text loads its blocks first (blocks.ts). href() gives
// its path, with the language prefix on a site with more than one.
app.get(href("home"), async (c) => {
	const text = await blocks("home");
	return c.html(
		<Layout url={c.req.url}>
			<Hero
				title="Welkom"
				intro={text("intro")}
				button={{ label: "Neem contact op", href: href("contact") }}
			/>
			<section>
				<div class="container">
					<h2>Over deze site</h2>
					{text("about")}
					<a class="btn btn-outline-primary" href={href("over-ons")}>
						Lees meer
					</a>
				</div>
			</section>
		</Layout>,
	);
});

app.get(href("over-ons"), async (c) => {
	const text = await blocks("over-ons");
	return c.html(
		<Layout title="Over ons" url={c.req.url}>
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Over ons</h1>
						<div class="text-lg">{text("intro")}</div>
						{text("body")}
					</div>
				</div>
			</section>
		</Layout>,
	);
});

// Every part in components.tsx once, with placeholder content. A site deletes
// this route and the page in blocks.ts.
app.get(href("onderdelen"), async (c) => {
	const text = await blocks("onderdelen");
	const image = { src: "/img/placeholder.svg", alt: "", width: 1600, height: 1200 };
	return c.html(
		<Layout title="Onderdelen" url={c.req.url}>
			<Hero
				title="Onderdelen"
				intro={text("intro")}
				image={image}
				button={{ label: "Neem contact op", href: href("contact") }}
			/>
			<Feature
				title="Tekst naast afbeelding"
				headline="Feature"
				image={{ ...image, caption: "Een onderschrift" }}
				buttons={[{ label: "Lees meer", href: href("over-ons"), style: "outline" }]}
			>
				{text("feature")}
			</Feature>
			<Cards
				title="Kaarten"
				intro="Drie stijlen: met afbeelding, tekst over de afbeelding en alleen tekst."
				cards={[
					{ title: "Kaart", text: "Afbeelding boven de tekst", href: "#", image },
					{
						title: "Overlay",
						text: "Tekst over de afbeelding",
						href: "#",
						image,
						style: "overlay",
					},
					{ title: "Tekst", text: "Alleen tekst, in de merkkleur", href: "#" },
				]}
			/>
			<Cards
				title="Bento"
				layout="bento"
				cards={[
					{ title: "Breed", image, style: "overlay" },
					{ title: "Smal", image, style: "overlay" },
					{ title: "Smal" },
					{ title: "Breed", image, style: "overlay" },
				]}
			/>
			<Features
				title="Kenmerken"
				items={[
					{ title: "Snel", text: "Pagina's komen van de Worker, dicht bij de bezoeker." },
					{ title: "Bewerkbaar", text: "De klant past de teksten aan via /admin/." },
					{ title: "Licht", text: "Geen JavaScript-bibliotheken nodig.", image },
				]}
			/>
			<Features
				title="Als lijst"
				layout="list"
				items={[
					{ title: "Eerste punt", text: "Met het vinkje als er geen afbeelding is." },
					{ title: "Tweede punt", text: "Of een ronde afbeelding.", image },
				]}
			/>
			<Stats
				title="Kerncijfers"
				items={[
					{ value: "25+", label: "jaar ervaring" },
					{ value: "1.200", label: "klanten" },
					{ value: "98%", label: "tevreden" },
					{ value: "24/7", label: "bereikbaar" },
				]}
			/>
			<Cta
				title="Oproep"
				buttons={[
					{ label: "Neem contact op", href: href("contact") },
					{ label: "Over ons", href: href("over-ons"), style: "outline" },
				]}
			>
				{text("cta")}
			</Cta>
			<section>
				<div class="container">
					<div class="article max-w-2xl">
						<h2>In een tekstkolom</h2>
						<Accordion
							name="faq"
							items={[
								{ title: "Opent één tegelijk?", text: "Ja, met <details name>, zonder script." },
								{ title: "Kan het antwoord lang zijn?", text: "Ja.\nRegeleinden blijven staan." },
							]}
						/>
						<Checklist
							items={[
								{ label: "Vinkjeslijst", text: "Met een regel uitleg" },
								{ label: "Alleen een label" },
							]}
						/>
						<Quote source="Een klant">Een citaat met de bron eronder.</Quote>
						<Labels items={["Label", "Nog een label", "Derde"]} />
					</div>
				</div>
			</section>
			<Marquee
				items={["Doorlopende tekst", "Pauzeert bij hover", "Staat stil bij reduced motion"]}
			/>
			<GoogleMap title="Kaart" query="Middelburg" height={360} />
			<Hero
				title="Hero naast afbeelding"
				intro="De variant split: tekst naast de afbeelding."
				image={image}
				variant="split"
			/>
		</Layout>,
	);
});

app.get(href("contact"), async (c) => {
	const text = await blocks("contact");
	return c.html(
		<Layout title="Contact" url={c.req.url} form>
			<section>
				<div class="container">
					<div class="max-w-2xl">
						<h1>Contact</h1>
						<div class="mb-8">{text("intro")}</div>
						<ContactForm lang="nl" />
					</div>
				</div>
			</section>
		</Layout>,
	);
});

// The thank-you page, in each language (languages.ts).
for (const lang of languages) {
	const t = messages[lang];
	app.get(prefix(lang) + t.sent.path, (c) =>
		c.html(
			<Layout title={t.sent.title} url={c.req.url}>
				<section>
					<div class="container">
						<h1>{t.sent.heading}</h1>
						<p>{t.sent.text}</p>
						<a class="btn btn-primary" href={`${prefix(lang)}/`}>
							{t.back}
						</a>
					</div>
				</section>
			</Layout>,
		),
	);
}

app.post("/api/contact", (c) => handleContact(c.req.raw));

// Images in the texts, from R2 (media.ts).
app.get("/media/:name", (c) =>
	serveMedia(c.req.param("name"), c.req.raw, c.executionCtx as ExecutionContext),
);

// /admin/ and /api/auth/*, only when editing is on (admin/auth.ts).
app.route("/", admin);

// In the language of the path's prefix.
app.notFound((c) => {
	const lang = langAt(c.req.path);
	const t = messages[lang];
	return c.html(
		<Layout title={t.notFound} url={c.req.url}>
			<section>
				<div class="container">
					<h1>{t.notFound}</h1>
					<a class="btn btn-primary" href={`${prefix(lang)}/`}>
						{t.back}
					</a>
				</div>
			</section>
		</Layout>,
		404,
	);
});

export default app satisfies ExportedHandler;
