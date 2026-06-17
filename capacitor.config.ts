import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.seuapp.ascend",     // <-- troque pelo seu domínio reverso
  appName: "ASCEND",
  webDir: "dist",
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#46E0FF",
    },
  },
};

export default config;
