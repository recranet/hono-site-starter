import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth/minimal";
import { genericOAuth } from "better-auth/plugins/generic-oauth";

// Editing is on when the D1 binding and the OIDC config are there
// (cloudflare.config.ts). Without them the site has no admin routes.
type Editing = {
	DB: D1Database;
	AUTH_ISSUER: string;
	CUSTOMER_ID: string;
	OIDC_CLIENT_ID: string;
	OIDC_CLIENT_SECRET: string;
	BETTER_AUTH_SECRET: string;
};

export function editing(): Editing | undefined {
	const e = env as Partial<Editing>;
	return e.DB &&
		e.AUTH_ISSUER &&
		e.CUSTOMER_ID &&
		e.OIDC_CLIENT_ID &&
		e.OIDC_CLIENT_SECRET &&
		e.BETTER_AUTH_SECRET
		? (e as Editing)
		: undefined;
}

// Sign-in through the console's OpenID provider (auth.<brand>.dev). Better
// Auth without a database: the session is an encrypted cookie, so the site
// keeps no users, accounts or sessions of its own. The provider only signs in
// addresses of the client's customer; the claim check below holds that here too.
export function createAuth(e: Editing, origin: string) {
	const customerClaim = `${e.AUTH_ISSUER}/customer_id`;
	return betterAuth({
		baseURL: origin,
		secret: e.BETTER_AUTH_SECRET,
		session: { expiresIn: 12 * 60 * 60 },
		plugins: [
			genericOAuth({
				config: [
					{
						providerId: "console",
						discoveryUrl: `${e.AUTH_ISSUER}/.well-known/openid-configuration`,
						clientId: e.OIDC_CLIENT_ID,
						clientSecret: e.OIDC_CLIENT_SECRET,
						scopes: ["openid", "profile", "email"],
						authentication: "basic",
						pkce: true,
						// Another customer's account gets no email, so Better Auth
						// refuses the sign-in and sends the visitor to errorCallbackURL.
						mapProfileToUser(profile) {
							if (String(profile[customerClaim]) === e.CUSTOMER_ID) return {};
							console.error("sign-in refused: another customer", profile[customerClaim]);
							return { email: "" };
						},
					},
				],
			}),
		],
	});
}
