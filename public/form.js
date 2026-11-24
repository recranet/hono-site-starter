// Fetches a reCAPTCHA Enterprise token for the "contact" action just before the
// form posts. The site key comes from the enterprise.js tag's render parameter.
const script = document.querySelector('script[src*="recaptcha/enterprise.js"]');
const siteKey = new URL(script.src).searchParams.get("render");
const form = document.querySelector('form[action="/contact"]');

form.addEventListener("submit", (event) => {
	event.preventDefault();
	grecaptcha.enterprise.ready(async () => {
		form.elements.recaptcha_token.value = await grecaptcha.enterprise.execute(siteKey, {
			action: "contact",
		});
		form.submit();
	});
});
