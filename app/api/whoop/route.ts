import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  config,
  connection,
  syncWhoop,
  disconnectWhoop,
  json,
  errorResponse,
  sameOrigin,
} from "@/lib/whoop-server";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to view WHOOP." }, 401);
  try {
    const c = config();
    const row = await connection(user.userId);
    return json({
      configured: c.configured,
      connected: !!row?.credentials,
      updated: row?.updated ?? null,
      snapshot: row?.snapshot ? JSON.parse(row.snapshot) : null,
      redirectUri: c.redirectUri || null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to sync WHOOP." }, 401);
  if (!sameOrigin(req)) return json({ error: "Request origin rejected." }, 403);
  try {
    await syncWhoop(user.userId);
    return GET();
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to disconnect WHOOP." }, 401);
  if (!sameOrigin(req)) return json({ error: "Request origin rejected." }, 403);
  try {
    await disconnectWhoop(user.userId);
    return GET();
  } catch (e) {
    return errorResponse(e);
  }
}
