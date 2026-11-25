import { env } from "cloudflare:workers";
import { languages, messages, prefix } from "./languages.ts";

// The contact form's POST: checks reCAPTCHA, then mails the message to MAIL_TO
// with the Email Sending binding. Mounted in index.tsx as POST /api/contact.

const LIMITS = { name: 200, email: 254, message: 5000 };

export async function handleContact(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const form = await request.formData();
	const field = (key: string) => {
		const value = form.get(key);
		return typeof value === "string" ? value.trim() : "";
	};
	const name = field("name");
	const email = field("email");
	const message = field("message");
	// The form's language, for the messages and the thank-you page. The mail stays Dutch.
	const lang = languages.find((l) => l === field("lang")) ?? languages[0];
	const t = messages[lang].form;
	const sent = prefix(lang) + messages[lang].sent.path;

	// Honeypot: people leave it empty, bots fill it. Pretend it worked.
	if (field("website") !== "") return redirect(url, sent);

	if (
		name === "" ||
		message === "" ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
		name.length > LIMITS.name ||
		email.length > LIMITS.email ||
		message.length > LIMITS.message
	) {
		return error(t.invalid);
	}

	if (!(await recaptchaPassed(field("recaptcha_token"), request, url))) {
		return error(t.recaptcha);
	}

	try {
		await env.EMAIL.send({
			from: { email: env.MAIL_FROM, name: env.SITE_NAME },
			to: env.MAIL_TO,
			replyTo: { email, name },
			subject: `Contactformulier ${env.SITE_NAME}: ${name}`,
			text: `Naam: ${name}\nE-mail: ${email}\n\n${message}\n`,
		});
	} catch (e) {
		const code = (e as { code?: string }).code ?? "unknown";
		console.error("send failed", code, (e as Error).message);
		return error(t.failed, 502);
	}

	return redirect(url, sent);
}

// reCAPTCHA score check with siteverify and the score key's secret. The token
// must be valid, made for the "contact" action on this hostname, and score
// at least MIN_SCORE (0.0 is a bot, 1.0 a person).
const MIN_SCORE = 0.5;

async function recaptchaPassed(token: string, request: Request, url: URL) {
	if (token === "") return false;
	const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
		method: "POST",
		body: new URLSearchParams({
			secret: env.RECAPTCHA_SECRET,
			response: token,
			remoteip: request.headers.get("CF-Connecting-IP") ?? "",
		}),
	});
	if (!res.ok) return false;
	const data = (await res.json()) as {
		success: boolean;
		score?: number;
		action?: string;
		hostname?: string;
		"error-codes"?: string[];
	};
	if (!data.success) console.error("recaptcha failed", data["error-codes"]);
	return (
		data.success &&
		data.action === "contact" &&
		data.hostname === url.hostname &&
		(data.score ?? 0) >= MIN_SCORE
	);
}

function redirect(url: URL, path: string) {
	return Response.redirect(new URL(path, url).toString(), 303);
}

function error(text: string, status = 400) {
	return new Response(text, {
		status,
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
