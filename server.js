// Backend mínimo para a troca/renovação de token do Strava.
// O client_secret fica AQUI, nunca no app. Rode em qualquer host (Render, Railway, Fly, VPS).
//   npm init -y && npm i express cors
//   node server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

// Troca o "code" do OAuth por tokens
app.post("/strava/exchange", async (req, res) => {
  try {
    const { code } = req.body;
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: "authorization_code" }),
    });
    res.json(await r.json()); // { access_token, refresh_token, expires_at, ... }
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Renova o access_token (eles expiram em ~6h)
app.post("/strava/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const r = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token, grant_type: "refresh_token" }),
    });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.listen(3000, () => console.log("Strava backend on :3000"));
