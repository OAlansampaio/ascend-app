// Ponte para o Health Connect (Android). O Google Fit foi descontinuado;
// para apps novos use Health Connect (dados ficam no dispositivo).
//
// Plugin de comunidade (instale separadamente):
//   npm i capacitor-health-connect
// A API pode variar conforme a versão/plugin — ajuste os nomes de método se necessário.
import { Capacitor } from "@capacitor/core";

function simulated() {
  return { steps: 3000 + Math.floor(Math.random() * 8000), source: "simulado" };
}

export async function ensureHealthPermissions() {
  if (Capacitor.getPlatform() !== "android") return false;
  try {
    const mod = await import("capacitor-health-connect");
    const HealthConnect = mod.HealthConnect || mod.default;
    await HealthConnect.requestHealthPermissions({ read: ["Steps", "Distance"], write: [] });
    return true;
  } catch (e) {
    console.warn("Health Connect indisponível:", e);
    return false;
  }
}

export async function getTodaySteps() {
  if (Capacitor.getPlatform() !== "android") return simulated();
  try {
    const mod = await import("capacitor-health-connect");
    const HealthConnect = mod.HealthConnect || mod.default;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const res = await HealthConnect.readRecords({
      type: "Steps",
      timeRangeFilter: { type: "between", startTime: start.toISOString(), endTime: new Date().toISOString() },
    });
    const steps = (res?.records || []).reduce((s, r) => s + (r.count || r.value || 0), 0);
    return { steps, source: "health-connect" };
  } catch (e) {
    console.warn("Falha ao ler passos, usando fallback:", e);
    return simulated();
  }
}
