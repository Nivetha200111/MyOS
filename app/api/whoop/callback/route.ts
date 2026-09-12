import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db";
import { config, digest, exchangeCode } from "@/lib/whoop-server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const finish = (status: string) =>
    new Response(null, {
      status: 303,
      headers: {
        Location: "/whoop?connection=" + status,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Set-Cookie": `whoop_state=; HttpOnly; SameSite=Lax; Path=/api/whoop; Max-Age=0${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`,
      },
    });
  const user = await getChatGPTUser();
  if (!user) return finish("signin");
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const cookie = req.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("whoop_state="))
    ?.slice(12);
  if (!state || state.length > 200 || state !== cookie)
    return finish("expired");
  const c = config();
  if (!c.configured || new URL(c.redirectUri!).origin !== url.origin)
    return finish("setup");
  try {
    const valid = await database()
      .prepare(
        "DELETE FROM whoop_states WHERE owner=? AND hash=? AND expires>? RETURNING owner",
      )
      .bind(user.userId, await digest(state), Date.now())
      .first();
    if (!valid) return finish("expired");
    if (url.searchParams.has("error")) return finish("denied");
    const code = url.searchParams.get("code");
    if (!code || code.length > 4096) return finish("failed");
    await exchangeCode(user.userId, code);
    return finish("connected");
  } catch {
    return finish("failed");
  }
}
