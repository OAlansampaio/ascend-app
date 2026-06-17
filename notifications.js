// Lembretes de penalidade agendados (funcionam com o app fechado no celular).
import { LocalNotifications } from "@capacitor/local-notifications";

const REMINDER_ID = 4242;

export async function ensurePermission() {
  try {
    const r = await LocalNotifications.requestPermissions();
    return r.display === "granted";
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(hour) {
  try {
    await cancelReminder();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: "ASCEND — Zona de penalidade",
          body: "Você tem missões pendentes. Conclua para manter seu streak.",
          schedule: { on: { hour, minute: 0 }, repeats: true, allowWhileIdle: true },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminder() {
  try { await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch {}
}
