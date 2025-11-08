// Entrypoint wrapper pour Supabase CLI (TypeScript).
// Ce wrapper appelle dynamiquement le handler défini dans index.js
export async function handler(req: Request): Promise<Response> {
	const mod = await import('./index.js');
	return mod.handler(req);
}
