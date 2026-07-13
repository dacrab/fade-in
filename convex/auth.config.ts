export default {
	providers: [
		{
			// WARNING: The fallback domain will cause auth to fail silently if CLERK_JWT_ISSUER_DOMAIN is not set.
			domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "https://clerk.example.com",
			applicationID: "clerk",
		},
	],
}
