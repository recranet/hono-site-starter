import { env } from "cloudflare:workers";

// The page blocks the customer inserts (hero, cards, …) are in
// @recranet/worker-site-editor's extensions (editor.ts). Components the site's
// own layout and pages use live here.

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
