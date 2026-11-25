import { env } from "cloudflare:workers";

// Images in the texts, stored in R2 (MEDIA in cloudflare.config.ts) and
// served at /media/<id>.<ext>. Without the binding the editor has no image
// button and /media/ is a 404.

const TYPES: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;
const NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

export function media(): R2Bucket | undefined {
	return (env as { MEDIA?: R2Bucket }).MEDIA;
}

// The admin's upload: one image, no SVG (it can carry scripts). Returns its
// path, which the editor stores as the image block's `src`.
export async function uploadMedia(request: Request): Promise<Response> {
	const bucket = media();
	if (!bucket) return new Response("Not found", { status: 404 });
	const form = await request.formData();
	const file = form.get("file");
	if (!(file instanceof File)) return error("Kies een afbeelding.");
	const ext = TYPES[file.type];
	if (!ext) return error("Alleen JPEG, PNG, WebP of AVIF.");
	if (file.size > MAX_BYTES) return error("De afbeelding is groter dan 5 MB.");
	const name = `${crypto.randomUUID()}.${ext}`;
	await bucket.put(name, file.stream(), { httpMetadata: { contentType: file.type } });
	return Response.json({ src: `/media/${name}` });
}

// A stored image. Names are random and never reused, so caches keep them.
export async function serveMedia(name: string, request: Request): Promise<Response> {
	const bucket = media();
	if (!bucket || !NAME.test(name)) return new Response("Not found", { status: 404 });
	const object = await bucket.get(name, { onlyIf: request.headers });
	if (!object) return new Response("Not found", { status: 404 });
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", "public, max-age=31536000, immutable");
	headers.set("x-content-type-options", "nosniff");
	if (!("body" in object)) return new Response(null, { status: 304, headers });
	return new Response(object.body, { headers });
}

function error(text: string) {
	return new Response(text, {
		status: 400,
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
