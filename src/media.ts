import { env } from "cloudflare:workers";

// Images in the texts, stored in R2 (MEDIA in cloudflare.config.ts) and
// served at /media/<id>.<ext>. Without MEDIA the editor has no image buttons
// and /media/ is a 404. With IMAGES (Cloudflare Images) /media/<id>.<ext>?w=960
// is the image scaled to that width as WebP, and pages get a srcset.

const TYPES: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/avif": "avif",
};
const MAX_BYTES = 20 * 1024 * 1024;
const NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;
// The widths pages ask for; others get the original, so nobody can make the
// Worker transform an image at every width.
export const WIDTHS = [480, 960, 1440, 1920, 2560];

export function media(): R2Bucket | undefined {
	return (env as { MEDIA?: R2Bucket }).MEDIA;
}

function images(): ImagesBinding | undefined {
	return (env as { IMAGES?: ImagesBinding }).IMAGES;
}

// The srcset for an image `width` pixels wide: each of WIDTHS below it, and
// the original. Undefined without IMAGES; the page then loads the original.
export function srcset(src: string, width?: number) {
	if (!images() || !width) return undefined;
	const sizes = WIDTHS.filter((w) => w < width);
	return [...sizes.map((w) => `${src}?w=${w} ${w}w`), `${src} ${width}w`].join(", ");
}

// The admin's upload: one image, no SVG (it can carry scripts). Returns its
// path, which the editor stores as the block's `src`.
export async function uploadMedia(request: Request): Promise<Response> {
	const bucket = media();
	if (!bucket) return new Response("Not found", { status: 404 });
	const form = await request.formData();
	const file = form.get("file");
	if (!(file instanceof File)) return error("Kies een afbeelding.");
	const ext = TYPES[file.type];
	if (!ext) return error("Alleen JPEG, PNG, WebP of AVIF.");
	if (file.size > MAX_BYTES) return error("De afbeelding is groter dan 20 MB.");
	const name = `${crypto.randomUUID()}.${ext}`;
	await bucket.put(name, file.stream(), { httpMetadata: { contentType: file.type } });
	return Response.json({ src: `/media/${name}` });
}

// A stored image, or with ?w= a scaled WebP copy, kept in the edge cache so
// Cloudflare Images transforms each width once per location. Names are random
// and never reused, so browsers and caches keep them for a year.
export async function serveMedia(
	name: string,
	request: Request,
	ctx: ExecutionContext,
): Promise<Response> {
	const bucket = media();
	if (!bucket || !NAME.test(name)) return new Response("Not found", { status: 404 });
	const url = new URL(request.url);
	const width = Number(url.searchParams.get("w"));
	const transform = images();
	if (!transform || !WIDTHS.includes(width)) return original(bucket, name, request);

	const key = new Request(`${url.origin}/media/${name}?w=${width}`);
	const cache = await caches.open("media");
	const cached = await cache.match(key);
	if (cached) return cached;
	const object = await bucket.get(name);
	if (!object) return new Response("Not found", { status: 404 });
	const result = await transform
		.input(object.body)
		.transform({ width, fit: "scale-down" })
		.output({ format: "image/webp", quality: 82 });
	const res = result.response({ headers: cacheHeaders() });
	ctx.waitUntil(cache.put(key, res.clone()));
	return res;
}

async function original(bucket: R2Bucket, name: string, request: Request) {
	const object = await bucket.get(name, { onlyIf: request.headers });
	if (!object) return new Response("Not found", { status: 404 });
	const headers = new Headers(cacheHeaders());
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	if (!("body" in object)) return new Response(null, { status: 304, headers });
	return new Response(object.body, { headers });
}

function cacheHeaders() {
	return {
		"cache-control": "public, max-age=31536000, immutable",
		"x-content-type-options": "nosniff",
	};
}

function error(text: string) {
	return new Response(text, {
		status: 400,
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
