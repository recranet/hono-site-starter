// Alpine.js setup for the navbar, from the emdash-boilerplate's scripts/alpine.js. Runs before Alpine starts
// (alpine:init); Alpine and its focus plugin load from the CDN tags in each page's <head>.
document.addEventListener("alpine:init", () => {
	// Screen size flag, matching the xl breakpoint in app.css: the navbar is a full menu from xl up.
	Alpine.store("screen", {
		xl: false,
		init() {
			const media = window.matchMedia("(min-width: 75rem)");
			this.xl = media.matches;
			media.addEventListener("change", (event) => (this.xl = event.matches));
		},
	});
});
