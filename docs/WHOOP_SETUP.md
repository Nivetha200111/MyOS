# Connect WHOOP to Nivetha OS

The integration is built, but it does not receive your WHOOP data until you create a developer application and authorize your account.

## 1. Create your WHOOP application

1. Open the [WHOOP Developer Dashboard](https://developer-dashboard.whoop.com) and sign in with your WHOOP account.
2. Create an application named **Nivetha OS**. Use your private site address as its website: `https://nivetha-os-command.niv2001.chatgpt.site`.
3. Register this exact redirect URL:

   ```text
   https://nivetha-os-command.niv2001.chatgpt.site/api/whoop/callback
   ```

4. Enable read access to recovery, cycles, sleep and workouts if the dashboard asks you to select scopes. The app requests `offline read:recovery read:cycles read:sleep read:workout` when you connect. `offline` lets it refresh an expired authorization without another login.
5. Keep the Client ID and Client Secret from the dashboard for the next step.

See WHOOP's [application overview](https://developer.whoop.com/docs/developing/overview/) and [OAuth documentation](https://developer.whoop.com/docs/developing/oauth/).

## 2. Configure the private site's server

The server needs these four environment values:

| Name | Value |
| --- | --- |
| `WHOOP_CLIENT_ID` | The application's Client ID |
| `WHOOP_CLIENT_SECRET` | The application's Client Secret; store as a secret |
| `WHOOP_REDIRECT_URI` | The exact redirect URL above |
| `WHOOP_TOKEN_KEY` | A securely generated 32-byte key encoded as 64 hexadecimal characters; store as a secret |

These values belong in **Sites runtime environment settings**, not in source code or `hosting.json`. They must not use a `NEXT_PUBLIC_` or `VITE_` prefix.

You can use Codex to configure these through the Sites environment tool. To avoid posting credentials in chat, save the Client ID and Client Secret in the ignored local `.env` file using the names above, then tell Codex: **“The WHOOP credentials are in my local .env. Configure the private site, generate its token encryption key, and deploy.”** Codex can read that file without printing the values and configure the server. Do not commit `.env` or put secrets in GitHub issues.

Keep the encryption key stable. Changing it makes existing authorization tokens unreadable; revoke the application's access in WHOOP before reconnecting with a new key.

For local development, use the same environment names in `.env`, register a separate callback `http://localhost:5173/api/whoop/callback` if WHOOP accepts your development callback, and set the local redirect value to it. Hosted values remain configured separately through Sites. Apply the database migrations before running the app. Local preview login is for development only: production must sit behind Sites' authenticated dispatcher.

## 3. Connect and sync

1. Open **WHOOP** in your OS.
2. Click **Refresh setup status**. Once the server is configured, **Connect WHOOP** appears.
3. Click it, sign in on WHOOP's own website, and grant access.
4. WHOOP returns you to your OS. Your first sync loads the last 30 days.

The OS checks on opening and once a minute while visible. It requests new WHOOP data when the saved sync is older than 15 minutes. **Sync now** requests an earlier update; requests within one minute reuse the latest sync. Your phone and desktop read the same stored snapshot.

This version does not sync while all OS tabs are closed. It has no webhook receiver or background job. A phone's WHOOP app must still upload band data to WHOOP before its API can return it.

## What appears

- Recovery score, heart rate variability and resting heart rate.
- Actual time asleep (light + deep + REM), sleep performance and consistency.
- Day strain grouped by WHOOP physiological cycle.
- Recent workouts and a rolling 30-day table.

Physiological cycles are not necessarily calendar days. The interface labels the cycle date in Asia/Kolkata and marks old syncs. Pending and unscorable readings stay blank; it never substitutes sample scores. The daily briefing includes available fresh readings without treating them as a prescription.

## Privacy and disconnection

The GitHub repository contains application code, not your WHOOP records. Tokens are encrypted with AES-GCM, bound to your signed-in owner ID, and stored in D1. They never enter client responses, browser storage, workspace exports or logs. Health snapshots are owner-scoped D1 records behind the private site's existing authentication.

**Disconnect & remove WHOOP data** revokes the WHOOP connection and deletes its saved snapshot and authorization from your OS; manual check-ins remain. If WHOOP is unavailable, the operation reports an error so you can retry. You can also revoke access from WHOOP's connected-app settings. Export my data includes the last successful WHOOP snapshot, without credentials.

## Troubleshooting

- **Set up connection stays visible:** one of the four environment values is missing or invalid, or the hosted configuration has not been deployed.
- **Open the configured site address:** you are connecting from a different origin than `WHOOP_REDIRECT_URI`.
- **Connection link expired:** start Connect WHOOP again in the same browser. OAuth state is single-use, expires after ten minutes, and is bound to your OS account and browser.
- **Reconnect:** authorization was revoked or expired. Use Reconnect WHOOP and approve the requested scopes.
- **Sync unavailable / rate limited:** the last complete snapshot is preserved. Retry later; partial fetches do not replace it.

API reference: [WHOOP v2](https://developer.whoop.com/api/).
