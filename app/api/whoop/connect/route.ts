import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db";
import {
  config,
  digest,
  scopes,
  json,
  sameOrigin,
  errorResponse,
} from "@/lib/whoop-server";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in before connecting WHOOP." }, 401);
  if (!sameOrigin(req)) return json({ error: "Request origin rejected." }, 403);
  const c = config();
  if (!c.configured)
    return json({ error: "Finish WHOOP setup before connecting." }, 503);
  if (new URL(c.redirectUri!).origin !== new URL(req.url).origin)
    return json(
      { error: "Open the configured site address to connect WHOOP." },
      400,
    );
  try {
    const state = crypto.randomUUID() + crypto.randomUUID();
    await database()
      .prepare(
        "INSERT INTO whoop_states(owner,hash,expires) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET hash=excluded.hash,expires=excluded.expires",
      )
      .bind(user.userId, await digest(state), Date.now() + 600000)
      .run();
    const url = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: c.clientId!,
      redirect_uri: c.redirectUri!,
      scope: scopes,
      state,
    }).toString();
    const response = json({ url: url.toString() });
    response.headers.set(
      "Set-Cookie",
      `whoop_state=${state}; HttpOnly; SameSite=Lax; Path=/api/whoop; Max-Age=600${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`,
    );
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}
