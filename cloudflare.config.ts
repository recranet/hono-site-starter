import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.tsx" with { type: "cf-worker" };

// The sender must be on the zone that has Cloudflare Email Sending enabled.
const MAIL_FROM = "website@example.nl";

export default defineConfig({
	// The Cloudflare account the site lives in (cf auth whoami).
	// Pinned so a deploy with the wrong login fails instead of landing elsewhere.
	accountId: "<ACCOUNT_ID>",
	worker: {
		name: "example-nl",
		compatibilityDate: "2026-11-19",
		entrypoint,
		// Files in public/ are served as they are; every other path runs the
		// Worker, which renders the pages and handles POST /api/contact.
		assets: {},
		// Keep the workers.dev address when a route or domain is added, and keep
		// Workers Logs on: the Worker logs failed reCAPTCHA checks and sends.
		workersDev: true,
		observability: { enabled: true },
		// The hostname. A Custom Domain, which also creates its DNS record:
		//   domains: ["example.nl", "www.example.nl"],
		// Or a route, where the zone has a wildcard record and a catch-all route
		// that would win over a Custom Domain. Add `triggers` to the cf/config import.
		//   triggers: [triggers.fetch({ pattern: "example.nl/*", zone: "example.nl" })],
		env: {
			EMAIL: bindings.sendEmail({ allowedSenderAddresses: [MAIL_FROM] }),
			MAIL_FROM: bindings.text(MAIL_FROM),
			MAIL_TO: bindings.text("info@example.nl"),
			SITE_NAME: bindings.text("Example"),
			// The SCORE key's site key (public, rendered into the page) and its
			// secret, for siteverify.
			RECAPTCHA_SITE_KEY: bindings.text("<SITE_KEY>"),
			RECAPTCHA_SECRET: bindings.secret(),
			// Editing (README, "Editing"): the text blocks in D1 and sign-in with
			// the customer's console account. Leave these out and the site has
			// no admin; the pages show the blocks' default text.
			//   DB: bindings.d1({ id: "<DATABASE_ID>" }),
			//   AUTH_ISSUER: bindings.text("https://auth.recranet.dev"),
			//   CUSTOMER_ID: bindings.text("<CUSTOMER_ID>"),
			//   OIDC_CLIENT_ID: bindings.text("<CLIENT_ID>"),
			//   OIDC_CLIENT_SECRET: bindings.secret(),
			//   BETTER_AUTH_SECRET: bindings.secret(),
			// Images and galleries in the texts (README, "Editing"): an R2 bucket,
			// and Cloudflare Images to serve them scaled (optional).
			//   MEDIA: bindings.r2({ name: "<BUCKET_NAME>" }),
			//   IMAGES: bindings.images(),
		},
	},
});
