// The lightbox for galleries (blocks.ts renders them, layout.tsx the dialog).
// A click on a gallery image opens it large; the srcset lets the browser pick
// a size that fills the screen. Without JS the link opens the image itself.
const dialog = document.getElementById("lightbox");
const large = dialog?.querySelector("img");
let images = [];
let index = 0;

function show(i) {
	index = (i + images.length) % images.length;
	const thumb = images[index];
	large.src = thumb.src;
	large.srcset = thumb.srcset;
	large.sizes = "92vw";
	large.alt = thumb.alt;
}

document.addEventListener("click", (event) => {
	const link = event.target.closest?.("a[data-gallery]");
	if (!link || !dialog) return;
	event.preventDefault();
	images = [...link.closest(".gallery").querySelectorAll("a[data-gallery] img")];
	show(images.indexOf(link.querySelector("img")));
	dialog.showModal();
});

dialog?.addEventListener("click", (event) => {
	const step = event.target.closest("[data-step]");
	if (step) show(index + Number(step.dataset.step));
	else if (event.target === dialog) dialog.close();
});

dialog?.addEventListener("keydown", (event) => {
	if (event.key === "ArrowLeft") show(index - 1);
	if (event.key === "ArrowRight") show(index + 1);
});
