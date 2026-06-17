import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Swords, Shield, Brain, Zap, Eye, Heart, Flame, ScrollText, User, Store, Plus,
  Check, ChevronRight, Skull, Sparkles, Trophy, AlertTriangle, Settings, Bell,
  Activity, Footprints, Link2, RefreshCw, Award,
} from "lucide-react";
import * as storage from "./services/storage";
import * as notifications from "./services/notifications";
import * as health from "./services/health";
import * as strava from "./services/strava";

const C = {
  bg: "#070A14", panel: "#0E1426", panel2: "#141C36", line: "#23304F",
  cyan: "#46E0FF", violet: "#9A6BFF", amber: "#FFB84D", green: "#5BE59A",
  red: "#FF5E7A", text: "#E7EEFF", dim: "#8A98C0",
};

const STATS = [
  { key: "forca", label: "Força", icon: Swords, color: C.red },
  { key: "agilidade", label: "Agilidade", icon: Zap, color: C.cyan },
  { key: "vigor", label: "Vigor", icon: Shield, color: C.green },
  { key: "intelecto", label: "Intelecto", icon: Brain, color: C.violet },
  { key: "percepcao", label: "Percepção", icon: Eye, color: C.amber },
];
const CLASSES = [
  { id: "guerreiro", name: "Guerreiro", stat: "forca", desc: "+2 Força. Dano bruto." },
  { id: "assassino", name: "Assassino", stat: "agilidade", desc: "+2 Agilidade. Golpes rápidos." },
  { id: "sentinela", name: "Sentinela", stat: "vigor", desc: "+2 Vigor. Aguenta tudo." },
  { id: "arcano", name: "Arcano", stat: "intelecto", desc: "+2 Intelecto. Poder mágico." },
  { id: "rastreador", name: "Rastreador", stat: "percepcao", desc: "+2 Percepção. Vê fraquezas." },
];
const QUEST_POOL = [
  { t: "Faça 30 flexões", stat: "forca", xp: 40, kind: "Físico" },
  { t: "Faça 40 agachamentos", stat: "forca", xp: 40, kind: "Físico" },
  { t: "Prancha por 1 minuto", stat: "vigor", xp: 35, kind: "Físico" },
  { t: "Caminhe 5.000 passos", stat: "vigor", xp: 45, kind: "Físico" },
  { t: "Beba 2L de água hoje", stat: "vigor", xp: 30, kind: "Saúde" },
  { t: "Alongue-se por 10 min", stat: "agilidade", xp: 30, kind: "Físico" },
  { t: "Corra/caminhe rápido 15 min", stat: "agilidade", xp: 45, kind: "Físico" },
  { t: "Suba escadas em vez do elevador", stat: "agilidade", xp: 25, kind: "Físico" },
  { t: "Leia 20 páginas", stat: "intelecto", xp: 45, kind: "Mente" },
  { t: "Estude/pratique uma skill 30 min", stat: "intelecto", xp: 50, kind: "Mente" },
  { t: "Escreva 3 metas do dia", stat: "intelecto", xp: 25, kind: "Mente" },
  { t: "Medite por 10 minutos", stat: "percepcao", xp: 35, kind: "Mente" },
  { t: "2h sem redes sociais", stat: "percepcao", xp: 40, kind: "Foco" },
  { t: "Arrume seu espaço", stat: "percepcao", xp: 25, kind: "Disciplina" },
  { t: "Acorde antes das 7h", stat: "percepcao", xp: 40, kind: "Disciplina" },
  { t: "Durma 7h+ esta noite", stat: "vigor", xp: 35, kind: "Saúde" },
];
const ENEMY_NAMES = [
  "Larva Sombria", "Espreitador Cinza", "Lâmina Oca", "Servo de Pedra",
  "Vorláth Menor", "Aberração Pálida", "Sabujo de Cinzas", "Serpe Gélida",
  "Ceifador Errante", "Quimera Rachada", "Golem Rúnico", "Espectro Faminto",
  "Carniçal das Brumas", "Vespa de Aço", "Sentinela Trincada", "Sombra Latente",
];
const BOSS_NAMES = ["Guardião do Portão", "Tirano de Obsidiana", "O Devorador", "Soberano Caído", "Colosso Abissal", "Arauto do Vazio"];
const ENEMY_TYPES = [
  { id: "comum", name: "Comum", color: C.dim, icon: Skull, counter: null, tip: "Sem fraqueza especial." },
  { id: "blindado", name: "Blindado", color: C.green, icon: Shield, counter: "forca", tip: "Resistente: suba Força para furar a armadura." },
  { id: "veloz", name: "Veloz", color: C.cyan, icon: Zap, counter: "agilidade", tip: "Ataca rápido: Agilidade reduz o dano." },
  { id: "eterico", name: "Etéreo", color: C.violet, icon: Brain, counter: "intelecto", tip: "Magia pura: Intelecto neutraliza." },
  { id: "furtivo", name: "Furtivo", color: C.amber, icon: Eye, counter: "percepcao", tip: "Some nas sombras: Percepção revela." },
];
const BOSS_TYPES = [
  { id: "colossal", name: "Colossal", color: C.red, icon: Flame, counter: "vigor", powMul: 1.15, tip: "Imenso: Vigor sustenta o combate." },
  { id: "tirano", name: "Tirano", color: C.amber, icon: Skull, counter: "forca", powMul: 1.1, tip: "Brutal: Força vence força." },
];

const todayStr = () => new Date().toISOString().slice(0, 10);
function yesterdayOf(ds) { const d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function genDailyQuests(seed) {
  const rng = mulberry32(hashStr("q" + seed));
  const idx = [...QUEST_POOL.keys()];
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, 4).map((qi, k) => ({ id: `${seed}-${k}`, ...QUEST_POOL[qi], done: false }));
}
function genEnemy(floor) {
  const isBoss = floor % 5 === 0;
  const rng = mulberry32(hashStr("en" + floor));
  let name = isBoss ? BOSS_NAMES[Math.floor(rng() * BOSS_NAMES.length)] : ENEMY_NAMES[Math.floor(rng() * ENEMY_NAMES.length)];
  if (!isBoss) name = (floor >= 21 ? "Ancião " : floor >= 11 ? "Corrompido " : "") + name;
  const pool = isBoss ? BOSS_TYPES : ENEMY_TYPES;
  const type = pool[Math.floor(rng() * pool.length)];
  const power = Math.floor((45 + floor * 20) * (isBoss ? 1.45 : 1) * (type.powMul || 1));
  return { name, type, power, isBoss, floor };
}
function counterMult(p, e) { if (!e.type.counter) return 1; return p.stats[e.type.counter] >= 6 + e.floor * 0.5 ? 1.08 : 0.82; }
function rankFromLevel(l) {
  if (l >= 50) return { r: "S", color: C.amber }; if (l >= 40) return { r: "A", color: C.violet };
  if (l >= 30) return { r: "B", color: C.cyan }; if (l >= 20) return { r: "C", color: C.green };
  if (l >= 10) return { r: "D", color: "#7FA0FF" }; return { r: "E", color: C.dim };
}
const TITLES = [{ min: 0, t: "Despertado" }, { min: 10, t: "Caçador" }, { min: 20, t: "Veterano" }, { min: 30, t: "Elite" }, { min: 40, t: "Monarca Menor" }, { min: 50, t: "Soberano" }];
const xpToNext = (l) => Math.floor(80 * Math.pow(1.18, l - 1));
const playerPower = (p) => {
  const b = p.stats.forca * 2.4 + p.stats.agilidade * 1.8 + p.stats.vigor * 2.2 + p.stats.intelecto * 1.6 + p.stats.percepcao * 1.5 + p.level * 6;
  return Math.floor(b * (1 + Math.min(p.streak || 0, 15) * 0.015));
};
const DEFAULTS = { frame: C.cyan, title: "Despertado", level: 1, xp: 0, statPoints: 0, gold: 60, maxHp: 100, hp: 100, floor: 1, best: 0, streak: 0, bestStreak: 0, lastAllDoneDate: null, reminderEnabled: false, reminderHour: 20, fit: { google: false, strava: false, steps: 0, lastSync: null } };
function normalize(p) { return { ...DEFAULTS, ...p, stats: { forca: 5, agilidade: 5, vigor: 5, intelecto: 5, percepcao: 5, ...(p.stats || {}) }, fit: { ...DEFAULTS.fit, ...(p.fit || {}) } }; }
function freshPlayer(name, classId, avatar) {
  const stats = { forca: 5, agilidade: 5, vigor: 5, intelecto: 5, percepcao: 5 };
  const cls = CLASSES.find((c) => c.id === classId); if (cls) stats[cls.stat] += 2;
  return normalize({ name, classId, avatar: avatar || null, stats, lastQuestDate: todayStr(), quests: genDailyQuests(todayStr()) });
}
const SAVE_KEY = "ascend:save:v2";

export default function App() {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("status");
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);
  const lastNotifyDay = useRef(null);

  const notify = useCallback((msg, color = C.cyan) => { setToast({ msg, color }); setTimeout(() => setToast(null), 2400); }, []);

  useEffect(() => {
    (async () => {
      try { const v = await storage.get(SAVE_KEY); if (v) setPlayer(applyDailyReset(normalize(JSON.parse(v)))); } catch (e) {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!player) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { storage.set(SAVE_KEY, JSON.stringify(player)); }, 400);
  }, [player]);

  // (re)agenda o lembrete nativo quando ativado/horário muda
  useEffect(() => {
    if (!player) return;
    if (player.reminderEnabled) notifications.scheduleDailyReminder(player.reminderHour);
    else notifications.cancelReminder();
  }, [player?.reminderEnabled, player?.reminderHour]);

  // aviso em-app de reforço
  useEffect(() => {
    if (!player || !player.reminderEnabled) return;
    const tick = () => {
      const pending = player.quests.filter((q) => !q.done).length;
      if (pending > 0 && new Date().getHours() >= player.reminderHour && lastNotifyDay.current !== todayStr()) {
        lastNotifyDay.current = todayStr();
        notify(`Lembrete: ${pending} missão(ões) pendente(s) hoje.`, C.amber);
      }
    };
    tick(); const iv = setInterval(tick, 60000); return () => clearInterval(iv);
  }, [player, notify]);

  function applyDailyReset(p) {
    const t = todayStr();
    if (p.lastQuestDate !== t) {
      const missed = (p.quests || []).filter((q) => !q.done).length;
      if (p.lastAllDoneDate !== yesterdayOf(t)) p = { ...p, streak: 0 };
      p = { ...p, quests: genDailyQuests(t), lastQuestDate: t, hp: Math.max(10, p.hp - missed * 6) };
    }
    return p;
  }

  if (loading) return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "ui-sans-serif,system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <Sparkles size={36} color={C.cyan} style={{ filter: `drop-shadow(0 0 10px ${C.cyan})` }} />
        <p style={{ color: C.dim, marginTop: 12, letterSpacing: 3, fontSize: 12 }}>CARREGANDO O SISTEMA…</p>
      </div>
    </div>
  );
  if (!player) return <Awakening onCreate={(n, c, a) => { setPlayer(freshPlayer(n, c, a)); notify("Você despertou. O Sistema o escolheu.", C.violet); }} />;

  const grantXp = (p, xp) => { p.xp += xp; while (p.xp >= xpToNext(p.level)) { p.xp -= xpToNext(p.level); p.level++; p.statPoints += 3; p.maxHp += 12; p.hp = p.maxHp; } return p; };
  function maybeAdvanceStreak(p) {
    if (p.quests.every((q) => q.done) && p.lastAllDoneDate !== todayStr()) {
      p.streak = p.lastAllDoneDate === yesterdayOf(todayStr()) ? p.streak + 1 : 1;
      p.lastAllDoneDate = todayStr(); p.bestStreak = Math.max(p.bestStreak || 0, p.streak);
      const bonus = 20 + p.streak * 5; p.gold += bonus; return { up: true, streak: p.streak, bonus };
    }
    return { up: false };
  }
  function completeQuest(id) {
    let res = { up: false };
    setPlayer((prev) => {
      const p = structuredClone(prev); const q = p.quests.find((x) => x.id === id);
      if (!q || q.done) return prev;
      q.done = true; p.stats[q.stat] += 1; p.gold += 15; grantXp(p, q.xp); res = maybeAdvanceStreak(p); return p;
    });
    if (res.up) notify(`Dia completo! Streak ${res.streak} 🔥 +${res.bonus} ◆`, C.amber);
    else notify("Missão concluída! +XP e +atributo", C.green);
  }
  function allocate(k) { setPlayer((prev) => { if (prev.statPoints <= 0) return prev; const p = structuredClone(prev); p.statPoints--; p.stats[k]++; return p; }); }
  function battle() {
    setPlayer((prev) => {
      const p = structuredClone(prev);
      if (p.hp <= 5) { notify("HP baixo demais. Descanse ou use uma poção.", C.red); return prev; }
      const e = genEnemy(p.floor);
      const my = playerPower(p) * (0.9 + Math.random() * 0.25) * counterMult(p, e);
      if (my / e.power >= 1) {
        p.hp = Math.max(1, p.hp - Math.max(3, Math.floor((e.power / Math.max(my, 1)) * 22)));
        grantXp(p, 12 + p.floor * 6); p.gold += 8 + p.floor * 4; p.floor += 1; p.best = Math.max(p.best, p.floor - 1);
        notify(`${e.isBoss ? "CHEFE derrotado!" : "Inimigo derrotado!"} Andar ${p.floor}`, e.isBoss ? C.amber : C.green);
      } else {
        p.hp = Math.max(0, p.hp - Math.max(8, Math.floor((e.power / Math.max(my, 1)) * 18)));
        notify(p.hp <= 0 ? "Você caiu. Descanse para recuperar." : `Recuou! ${e.type.tip}`, C.red);
      }
      return p;
    });
  }
  function rest() { setPlayer((prev) => ({ ...prev, hp: prev.maxHp })); notify("Descansou. HP restaurado.", C.cyan); }
  function buy(item) {
    setPlayer((prev) => {
      if (prev.gold < item.cost) { notify("Ouro insuficiente.", C.red); return prev; }
      const p = structuredClone(prev); p.gold -= item.cost;
      if (item.type === "hp") p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.5));
      if (item.type === "stat") p.stats[item.stat] += 1; return p;
    });
    notify("Comprado!", C.green);
  }
  const updatePlayer = (patch) => setPlayer((prev) => ({ ...prev, ...patch }));

  async function requestNotif() {
    const ok = await notifications.ensurePermission();
    if (ok) { setPlayer((p) => ({ ...p, reminderEnabled: true })); notify("Notificações ativadas.", C.green); }
    else notify("Permissão negada ou indisponível neste ambiente.", C.amber);
  }
  async function connectFit(provider) {
    if (provider === "google") {
      const ok = await health.ensureHealthPermissions();
      setPlayer((p) => ({ ...p, fit: { ...p.fit, google: ok || !p.fit.google } }));
      notify(ok ? "Health Connect conectado." : "Modo demonstração (sem Health Connect aqui).", ok ? C.green : C.amber);
    } else {
      const res = await strava.connectStrava().catch(() => null);
      setPlayer((p) => ({ ...p, fit: { ...p.fit, strava: !!res || !p.fit.strava } }));
      notify(res ? "Strava conectado." : "Modo demonstração (configure o backend Strava).", res ? C.green : C.amber);
    }
  }
  async function syncFitness() {
    if (!player.fit.google && !player.fit.strava) { notify("Conecte uma fonte de atividade primeiro.", C.amber); return; }
    const { steps, source } = await health.getTodaySteps();
    let completed = 0;
    setPlayer((prev) => {
      const p = structuredClone(prev);
      p.fit.steps = steps; p.fit.lastSync = new Date().toISOString();
      p.quests.forEach((q) => { if (!q.done && q.kind === "Físico") { q.done = true; p.stats[q.stat] += 1; p.gold += 15; grantXp(p, q.xp); completed++; } });
      maybeAdvanceStreak(p); return p;
    });
    notify(`Sincronizado (${source}): ${steps.toLocaleString("pt-BR")} passos · ${completed} missão(ões) física(s).`, C.green);
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "ui-sans-serif,system-ui,-apple-system", paddingBottom: 80 }}>
      <BgGlow />
      <Header player={player} />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "0 14px" }}>
        {tab === "status" && <StatusView player={player} allocate={allocate} />}
        {tab === "quests" && <QuestView player={player} onDone={completeQuest} />}
        {tab === "tower" && <TowerView player={player} onBattle={battle} onRest={rest} />}
        {tab === "shop" && <ShopView player={player} onBuy={buy} />}
        {tab === "avatar" && <AvatarView player={player} update={updatePlayer} notify={notify} />}
        {tab === "config" && <ConfigView player={player} update={updatePlayer} requestNotif={requestNotif} connectFit={connectFit} syncFitness={syncFitness} />}
      </main>
      <TabBar tab={tab} setTab={setTab} questsLeft={player.quests.filter((q) => !q.done).length} />
      {toast && <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 94, zIndex: 50, background: C.panel2, border: `1px solid ${toast.color}`, color: C.text, padding: "10px 16px", borderRadius: 12, boxShadow: `0 0 18px ${toast.color}55`, fontSize: 13, maxWidth: 340, textAlign: "center" }}>{toast.msg}</div>}
    </div>
  );
}

function BgGlow() { return <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: `radial-gradient(60% 40% at 50% 0%, ${C.violet}22, transparent 70%), radial-gradient(50% 30% at 80% 90%, ${C.cyan}14, transparent 70%)` }} />; }
function Header({ player }) {
  const rk = rankFromLevel(player.level); const need = xpToNext(player.level); const pct = Math.min(100, Math.floor((player.xp / need) * 100));
  return (
    <header style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "16px 14px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar player={player} size={54} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{player.name}</span>
            <span style={{ fontSize: 10, color: rk.color, border: `1px solid ${rk.color}`, borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>RANK {rk.r}</span>
          </div>
          <div style={{ fontSize: 11, color: C.dim }}>{player.title} · Nível {player.level}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {player.streak > 0 && <div style={{ fontSize: 11, color: C.amber, fontWeight: 700 }}>🔥 {player.streak}d</div>}
          <div style={{ fontSize: 11, color: C.amber, fontWeight: 700 }}>◆ {player.gold}</div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}><Bar pct={pct} color={C.cyan} label={`XP ${player.xp}/${need}`} /></div>
    </header>
  );
}
function Avatar({ player, size = 64 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", padding: 2, background: `conic-gradient(from 180deg, ${player.frame}, ${C.violet}, ${player.frame})`, boxShadow: `0 0 14px ${player.frame}77`, flexShrink: 0 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: C.panel2, display: "grid", placeItems: "center" }}>
        {player.avatar ? <img src={player.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={size * 0.5} color={C.dim} />}
      </div>
    </div>
  );
}
function Bar({ pct, color, label, height = 9 }) {
  return (
    <div>
      <div style={{ height, background: "#0A1124", borderRadius: 99, overflow: "hidden", border: `1px solid ${C.line}` }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 10px ${color}`, transition: "width .4s" }} />
      </div>
      {label && <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{label}</div>}
    </div>
  );
}
function Panel({ children, style }) { return <div style={{ position: "relative", zIndex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginTop: 12, ...style }}>{children}</div>; }
function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      {Icon && <Icon size={16} color={C.cyan} />}
      <h2 style={{ fontSize: 12, letterSpacing: 2, color: C.dim, fontWeight: 700, textTransform: "uppercase", flex: 1 }}>{children}</h2>
      {right}
    </div>
  );
}
function Stat({ label, value, color, icon: Icon, mini }) {
  return (
    <div style={{ flex: 1, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: mini ? "8px 6px" : 12, textAlign: "center" }}>
      {Icon && <Icon size={15} color={color} style={{ marginBottom: 3 }} />}
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: C.dim }}>{label}</div>
    </div>
  );
}
function StatusView({ player, allocate }) {
  return (
    <>
      <Panel>
        <SectionTitle icon={Trophy}>Poder de combate</SectionTitle>
        <div style={{ fontSize: 30, fontWeight: 800, color: C.amber, filter: `drop-shadow(0 0 8px ${C.amber}66)` }}>{playerPower(player).toLocaleString("pt-BR")}</div>
        {player.streak > 0 && <div style={{ fontSize: 11, color: C.amber, marginTop: 2 }}>Aura de constância: +{Math.min(player.streak, 15) * 1.5}% poder</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Stat mini label="HP" value={`${player.hp}/${player.maxHp}`} color={C.red} icon={Heart} />
          <Stat mini label="Andar máx." value={player.best} color={C.violet} icon={Flame} />
          <Stat mini label="Pontos" value={player.statPoints} color={C.green} icon={Plus} />
        </div>
      </Panel>
      <Panel style={player.streak > 0 ? { borderColor: C.amber } : {}}>
        <SectionTitle icon={Award}>Sequência de dias</SectionTitle>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: C.amber }}>{player.streak}</span>
          <span style={{ fontSize: 13, color: C.dim }}>dias seguidos · recorde {player.bestStreak}</span>
        </div>
        <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Conclua todas as missões do dia para manter o fogo aceso. Pular um dia zera a sequência.</p>
      </Panel>
      <Panel>
        <SectionTitle icon={Sparkles} right={player.statPoints > 0 ? <span style={{ fontSize: 11, color: C.green }}>{player.statPoints} p/ distribuir</span> : null}>Atributos</SectionTitle>
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.line}55` }}>
              <Icon size={18} color={s.color} />
              <span style={{ flex: 1, fontSize: 14 }}>{s.label}</span>
              <span style={{ fontWeight: 700, fontSize: 16, minWidth: 30, textAlign: "right" }}>{player.stats[s.key]}</span>
              <button onClick={() => allocate(s.key)} disabled={player.statPoints <= 0} style={{ marginLeft: 6, width: 30, height: 30, borderRadius: 8, border: `1px solid ${player.statPoints > 0 ? s.color : C.line}`, background: player.statPoints > 0 ? `${s.color}1a` : "transparent", color: player.statPoints > 0 ? s.color : C.line, cursor: player.statPoints > 0 ? "pointer" : "default", display: "grid", placeItems: "center" }}><Plus size={16} /></button>
            </div>
          );
        })}
      </Panel>
    </>
  );
}
function QuestView({ player, onDone }) {
  const left = player.quests.filter((q) => !q.done).length;
  return (
    <>
      <Panel style={left === 0 ? { borderColor: C.green } : {}}>
        <SectionTitle icon={ScrollText} right={<span style={{ fontSize: 11, color: C.amber }}>🔥 {player.streak}d</span>}>Missões diárias</SectionTitle>
        <p style={{ fontSize: 12, color: C.dim, margin: "2px 0 4px" }}>{left === 0 ? "Todas concluídas. O Sistema reconhece sua disciplina." : `Faltam ${left}. Missões não concluídas geram penalidade de HP amanhã.`}</p>
        {left > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.amber, marginTop: 6 }}><AlertTriangle size={13} /> Zona de penalidade ativa</div>}
      </Panel>
      {player.quests.map((q) => {
        const st = STATS.find((s) => s.key === q.stat);
        return (
          <Panel key={q.id} style={{ opacity: q.done ? 0.55 : 1, borderColor: q.done ? C.green : C.line, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: st.color, letterSpacing: 1, marginBottom: 2 }}>{q.kind.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 600, textDecoration: q.done ? "line-through" : "none" }}>{q.t}</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>+{q.xp} XP · +1 {st.label} · +15 ◆</div>
              </div>
              <button onClick={() => onDone(q.id)} disabled={q.done} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${q.done ? C.green : C.cyan}`, background: q.done ? `${C.green}22` : `${C.cyan}14`, color: q.done ? C.green : C.cyan, cursor: q.done ? "default" : "pointer", display: "grid", placeItems: "center" }}><Check size={20} /></button>
            </div>
          </Panel>
        );
      })}
    </>
  );
}
function TowerView({ player, onBattle, onRest }) {
  const e = genEnemy(player.floor); const TIcon = e.type.icon; const my = playerPower(player);
  const odds = Math.min(99, Math.max(1, Math.floor((my * counterMult(player, e) / e.power) * 60))); const hpPct = Math.floor((player.hp / player.maxHp) * 100);
  return (
    <Panel style={{ textAlign: "center", borderColor: e.isBoss ? C.amber : C.line }}>
      <SectionTitle icon={Flame}>Torre — Andar {player.floor}</SectionTitle>
      <div style={{ margin: "14px auto 6px", width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center", background: `radial-gradient(circle, ${e.type.color}33, transparent 70%)`, border: `1px solid ${e.type.color}` }}>
        <Skull size={40} color={e.type.color} style={{ filter: `drop-shadow(0 0 8px ${e.type.color})` }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>{e.name}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: e.type.color, border: `1px solid ${e.type.color}55`, borderRadius: 99, padding: "2px 10px", margin: "6px 0" }}>
        <TIcon size={12} /> {e.isBoss ? "CHEFE · " : ""}{e.type.name} · Poder {e.power}
      </div>
      <p style={{ fontSize: 11, color: C.dim, margin: "0 0 10px" }}>{e.type.tip}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, fontSize: 12, color: C.dim, marginBottom: 12 }}>
        <span>Seu poder: <b style={{ color: C.amber }}>{my}</b></span>
        <span>Chance: <b style={{ color: odds >= 60 ? C.green : odds >= 35 ? C.amber : C.red }}>{odds}%</b></span>
      </div>
      <div style={{ marginBottom: 12 }}><Bar pct={hpPct} color={C.red} label={`HP ${player.hp}/${player.maxHp}`} /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBattle} disabled={player.hp <= 5} style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 15, background: player.hp <= 5 ? C.line : `linear-gradient(90deg, ${C.violet}, ${C.cyan})`, color: player.hp <= 5 ? C.dim : "#06101F", cursor: player.hp <= 5 ? "default" : "pointer", boxShadow: player.hp <= 5 ? "none" : `0 0 16px ${C.violet}66` }}>Atacar</button>
        <button onClick={onRest} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.cyan}`, background: `${C.cyan}12`, color: C.cyan, fontWeight: 700, cursor: "pointer" }}>Descansar</button>
      </div>
      <p style={{ fontSize: 11, color: C.dim, marginTop: 10 }}>Cada tipo de inimigo tem uma fraqueza. Suba o atributo certo com missões reais.</p>
    </Panel>
  );
}
function ShopView({ player, onBuy }) {
  const items = [{ id: "hp", type: "hp", name: "Poção de Vida", desc: "Restaura 50% do HP", cost: 30, color: C.red, icon: Heart }, ...STATS.map((s) => ({ id: "c-" + s.key, type: "stat", stat: s.key, name: `Núcleo de ${s.label}`, desc: `+1 ${s.label} permanente`, cost: 120, color: s.color, icon: s.icon }))];
  return (
    <>
      <Panel><SectionTitle icon={Store}>Loja do Sistema</SectionTitle><p style={{ fontSize: 12, color: C.dim }}>Seu ouro: <b style={{ color: C.amber }}>◆ {player.gold}</b>. Ganhe mais com missões, streaks e andares.</p></Panel>
      {items.map((it) => {
        const Icon = it.icon; const can = player.gold >= it.cost;
        return (
          <Panel key={it.id} style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: `${it.color}18`, border: `1px solid ${it.color}55` }}><Icon size={18} color={it.color} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div><div style={{ fontSize: 11, color: C.dim }}>{it.desc}</div></div>
              <button onClick={() => onBuy(it)} disabled={!can} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${can ? C.amber : C.line}`, background: can ? `${C.amber}18` : "transparent", color: can ? C.amber : C.line, fontWeight: 700, fontSize: 12, cursor: can ? "pointer" : "default", whiteSpace: "nowrap" }}>◆ {it.cost}</button>
            </div>
          </Panel>
        );
      })}
    </>
  );
}
function AvatarView({ player, update, notify }) {
  const fileRef = useRef(null); const frames = [C.cyan, C.violet, C.amber, C.green, C.red, "#7FA0FF"]; const titles = TITLES.filter((t) => player.level >= t.min).map((t) => t.t);
  function onFile(e) { const f = e.target.files?.[0]; if (!f) return; if (f.size > 4500000) { notify("Imagem muito grande (máx ~4MB).", C.red); return; } const r = new FileReader(); r.onload = () => update({ avatar: r.result }); r.readAsDataURL(f); }
  return (
    <>
      <Panel style={{ textAlign: "center" }}>
        <SectionTitle icon={User}>Seu avatar</SectionTitle>
        <div style={{ display: "grid", placeItems: "center", margin: "10px 0" }}><Avatar player={player} size={120} /></div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => fileRef.current?.click()} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.cyan}`, background: `${C.cyan}14`, color: C.cyan, fontWeight: 700, cursor: "pointer" }}>{player.avatar ? "Trocar foto" : "Enviar foto"}</button>
          {player.avatar && <button onClick={() => update({ avatar: null })} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: "transparent", color: C.dim, cursor: "pointer" }}>Remover</button>}
        </div>
        <p style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Sua foto fica só neste dispositivo.</p>
      </Panel>
      <Panel><SectionTitle icon={Sparkles}>Moldura</SectionTitle><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>{frames.map((f) => <button key={f} onClick={() => update({ frame: f })} style={{ width: 38, height: 38, borderRadius: "50%", background: f, border: player.frame === f ? `3px solid #fff` : `2px solid ${C.line}`, cursor: "pointer", boxShadow: `0 0 10px ${f}88` }} />)}</div></Panel>
      <Panel><SectionTitle icon={Trophy}>Título</SectionTitle><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>{titles.map((t) => <button key={t} onClick={() => update({ title: t })} style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: `1px solid ${player.title === t ? C.amber : C.line}`, background: player.title === t ? `${C.amber}18` : "transparent", color: player.title === t ? C.amber : C.dim }}>{t}</button>)}</div><p style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Novos títulos liberam ao subir de nível.</p></Panel>
    </>
  );
}
function ConfigView({ player, update, requestNotif, connectFit, syncFitness }) {
  const fitSources = [{ id: "google", name: "Saúde do Android", sub: "Health Connect", color: C.green, icon: Footprints }, { id: "strava", name: "Strava", sub: "Corridas e pedaladas", color: "#FC4C02", icon: Activity }];
  return (
    <>
      <Panel>
        <SectionTitle icon={Bell}>Lembretes de penalidade</SectionTitle>
        <p style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>Receba um aviso se ainda houver missões pendentes no fim do dia.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 14 }}>Ativar lembrete diário</span>
          <button onClick={() => update({ reminderEnabled: !player.reminderEnabled })} style={{ width: 52, height: 28, borderRadius: 99, border: `1px solid ${player.reminderEnabled ? C.green : C.line}`, background: player.reminderEnabled ? `${C.green}33` : C.panel2, position: "relative", cursor: "pointer" }}>
            <span style={{ position: "absolute", top: 2, left: player.reminderEnabled ? 26 : 2, width: 22, height: 22, borderRadius: "50%", background: player.reminderEnabled ? C.green : C.dim, transition: "left .2s" }} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ flex: 1, fontSize: 14 }}>Horário do lembrete</span>
          <select value={player.reminderHour} onChange={(e) => update({ reminderHour: Number(e.target.value) })} style={{ background: C.panel2, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", fontSize: 14 }}>{[18, 19, 20, 21, 22].map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
        </div>
        <button onClick={requestNotif} style={{ width: "100%", padding: "11px", borderRadius: 10, border: `1px solid ${C.cyan}`, background: `${C.cyan}14`, color: C.cyan, fontWeight: 700, cursor: "pointer" }}>Permitir notificações do sistema</button>
      </Panel>
      <Panel>
        <SectionTitle icon={Link2}>Atividade física</SectionTitle>
        <p style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>Conecte uma fonte para concluir missões físicas automaticamente pelos seus passos/treinos.</p>
        {fitSources.map((s) => {
          const Icon = s.icon; const on = player.fit[s.id];
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.line}55` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: `${s.color}18`, border: `1px solid ${s.color}55` }}><Icon size={18} color={s.color} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 11, color: C.dim }}>{s.sub}</div></div>
              <button onClick={() => connectFit(s.id)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${on ? C.green : s.color}`, background: on ? `${C.green}18` : `${s.color}18`, color: on ? C.green : s.color, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{on ? "Conectado" : "Conectar"}</button>
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1, fontSize: 12, color: C.dim }}>{player.fit.lastSync ? `Último sync: ${player.fit.steps.toLocaleString("pt-BR")} passos` : "Nenhuma sincronização ainda."}</div>
          <button onClick={syncFitness} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, border: "none", background: `linear-gradient(90deg, ${C.violet}, ${C.cyan})`, color: "#06101F", fontWeight: 700, cursor: "pointer" }}><RefreshCw size={15} /> Sincronizar</button>
        </div>
      </Panel>
    </>
  );
}
function TabBar({ tab, setTab, questsLeft }) {
  const tabs = [{ id: "status", label: "Status", icon: Trophy }, { id: "quests", label: "Missões", icon: ScrollText, badge: questsLeft }, { id: "tower", label: "Torre", icon: Flame }, { id: "shop", label: "Loja", icon: Store }, { id: "avatar", label: "Avatar", icon: User }, { id: "config", label: "Config", icon: Settings }];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: `${C.panel}f2`, borderTop: `1px solid ${C.line}`, backdropFilter: "blur(8px)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
        {tabs.map((t) => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 0 12px", background: "none", border: "none", cursor: "pointer", color: active ? C.cyan : C.dim, position: "relative" }}>
              <Icon size={19} style={{ filter: active ? `drop-shadow(0 0 6px ${C.cyan})` : "none" }} />
              <div style={{ fontSize: 9, marginTop: 3 }}>{t.label}</div>
              {t.badge > 0 && <span style={{ position: "absolute", top: 4, right: "50%", marginRight: -20, background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 99, minWidth: 15, height: 15, display: "grid", placeItems: "center", padding: "0 3px" }}>{t.badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
function Awakening({ onCreate }) {
  const [name, setName] = useState(""); const [cls, setCls] = useState("guerreiro"); const [avatar, setAvatar] = useState(null); const fileRef = useRef(null);
  function onFile(e) { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setAvatar(r.result); r.readAsDataURL(f); }
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "ui-sans-serif,system-ui", position: "relative" }}>
      <BgGlow />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto", padding: "40px 18px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Sparkles size={34} color={C.cyan} style={{ filter: `drop-shadow(0 0 12px ${C.cyan})` }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, marginTop: 8 }}>ASCEND</h1>
          <p style={{ color: C.violet, fontSize: 12, letterSpacing: 3 }}>O SISTEMA SELECIONOU VOCÊ</p>
          <p style={{ color: C.dim, fontSize: 13, marginTop: 14, lineHeight: 1.5 }}>Cumpra missões na vida real para ganhar XP e atributos. Use seu poder para escalar a Torre. Quanto mais disciplina, mais forte você fica.</p>
        </div>
        <Panel><label style={{ fontSize: 12, color: C.dim }}>Nome do caçador</label><input value={name} onChange={(e) => setName(e.target.value)} maxLength={18} placeholder="Seu nome" style={{ width: "100%", marginTop: 6, padding: "11px 12px", borderRadius: 10, background: C.panel2, border: `1px solid ${C.line}`, color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box" }} /></Panel>
        <Panel style={{ textAlign: "center" }}>
          <label style={{ fontSize: 12, color: C.dim }}>Foto do avatar (opcional)</label>
          <div style={{ display: "grid", placeItems: "center", margin: "10px 0" }}>
            <div style={{ width: 86, height: 86, borderRadius: "50%", padding: 2, background: `conic-gradient(from 180deg, ${C.cyan}, ${C.violet})`, boxShadow: `0 0 14px ${C.cyan}66` }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: C.panel2, display: "grid", placeItems: "center" }}>{avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={42} color={C.dim} />}</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.cyan}`, background: `${C.cyan}14`, color: C.cyan, fontSize: 13, cursor: "pointer" }}>Enviar foto</button>
        </Panel>
        <Panel>
          <label style={{ fontSize: 12, color: C.dim }}>Escolha sua classe</label>
          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {CLASSES.map((c) => {
              const active = cls === c.id;
              return (
                <button key={c.id} onClick={() => setCls(c.id)} style={{ textAlign: "left", padding: "11px 12px", borderRadius: 10, cursor: "pointer", border: `1px solid ${active ? C.cyan : C.line}`, background: active ? `${C.cyan}12` : C.panel2, color: C.text, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: active ? C.cyan : C.text }}>{c.name}</div><div style={{ fontSize: 11, color: C.dim }}>{c.desc}</div></div>
                  {active && <ChevronRight size={18} color={C.cyan} />}
                </button>
              );
            })}
          </div>
        </Panel>
        <button onClick={() => name.trim() && onCreate(name.trim(), cls, avatar)} disabled={!name.trim()} style={{ width: "100%", marginTop: 16, padding: "15px", borderRadius: 14, border: "none", fontWeight: 800, fontSize: 16, letterSpacing: 1, background: name.trim() ? `linear-gradient(90deg, ${C.violet}, ${C.cyan})` : C.line, color: name.trim() ? "#06101F" : C.dim, cursor: name.trim() ? "pointer" : "default", boxShadow: name.trim() ? `0 0 20px ${C.violet}66` : "none" }}>Despertar</button>
      </div>
    </div>
  );
}
