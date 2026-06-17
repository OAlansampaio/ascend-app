// Fluxo OAuth do Strava. O client_secret NUNCA deve ficar no app:
// a troca code -> token roda no SEU backend (exemplo no README).
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";

const STRAVA = {
  clientId: "SEU_CLIENT_ID",
  redirectUri: "ascend://strava-callback",
  backendExchangeUrl: "https://SEU_BACKEND/strava/exchange", // troca code->token
  backendRefreshUrl: "https://SEU_BACKEND/strava/refresh",   // renova token (expira ~6h)
  scope: "read,activity:read",
};

export async function connectStrava() {
  const authUrl =
    `https://www.strava.com/oauth/mobile/authorize?client_id=${STRAVA.clientId}` +
    `&redirect_uri=${encodeURIComponent(STRAVA.redirectUri)}` +
    `&response_type=code&approval_prompt=auto&scope=${STRAVA.scope}`;

  return new Promise(async (resolve) => {
    const handle = await App.addListener("appUrlOpen", async ({ url }) => {
      if (!url || !url.startsWith(STRAVA.redirectUri)) return;
      const code = new URL(url).searchParams.get("code");
      await Browser.close().catch(() => {});
      handle.remove();
      if (!code) return resolve(null);
      try {
        const r = await fetch(STRAVA.backendExchangeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        resolve(await r.json()); // { access_token, refresh_token, expires_at }
      } catch (e) {
        console.warn("Falha na troca de token Strava:", e);
        resolve(null);
      }
    });
    await Browser.open({ url: authUrl });
  });
}

export async function getRecentActivities(accessToken) {
  const r = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error("Strava API " + r.status);
  return r.json();
}
