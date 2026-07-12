function hex(buf: ArrayBuffer): string {
	return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("")
}

async function hmacSign(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	)
	const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
	return hex(sig)
}

export async function generateManageToken(
	appointmentId: string,
	customerEmail: string,
	secret: string,
): Promise<string> {
	return (await hmacSign(secret, `${appointmentId}:${customerEmail}`)).slice(0, 32)
}

export async function verifyManageToken(
	token: string,
	appointmentId: string,
	customerEmail: string,
	secret: string,
): Promise<boolean> {
	const expected = await generateManageToken(appointmentId, customerEmail, secret)
	if (token.length !== expected.length) return false
	let diff = 0
	for (let i = 0; i < token.length; i++) {
		diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
	}
	return diff === 0
}
