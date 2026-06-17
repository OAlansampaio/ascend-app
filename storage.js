// Persistência nativa via Capacitor Preferences, com fallback para localStorage.
import { Preferences } from "@capacitor/preferences";

export async function get(key) {
  try {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  } catch {
    try { return localStorage.getItem(key); } catch { return null; }
  }
}

export async function set(key, value) {
  try {
    await Preferences.set({ key, value });
  } catch {
    try { localStorage.setItem(key, value); } catch {}
  }
}
