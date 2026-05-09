import { useState, useEffect, useRef, useCallback } from "react";
import {
  usePackages, useReadyListings,
  usePipelineStatus, usePipelineLogs, useSnowMemory, useSnowChat
} from "./useAirtable";

// ─── Design tokens — Cyberpunk City Night ─────────────────
const C = {
  bg:         "#080810",
  card:       "#0d0d1a",
  border:     "#1a1a2e",
  roomBorder: "#2a2a4a",
  accent:     "#7c6aff",
  cyan:       "#00b4ff",
  snow:       "#a78bff",
  text:       "#e0e0f0",
  muted:      "#444466",
  faint:      "#1a1a2e",
  success:    "#00ff88",
  danger:     "#ff4466",
  amber:      "#ffaa00",
  glow:       "0 0 12px #7c6aff33",
  glowSnow:   "0 0 16px #a78bff44",
  glowCyan:   "0 0 10px #00b4ff33",
  glowAmber:  "0 0 10px #ffaa0033",
};
const F = { fontFamily: "'Courier New', Courier, monospace" };
const API = "http://localhost:8000";
const BASE_ID  = "appsS6oYAVqgJhe7H";
const TABLE_ID = "tblIyWuFysf5Hxu8u";
const atHeaders = () => ({ Authorization: `Bearer ${process.env.REACT_APP_AIRTABLE_API_KEY}` });

async function deleteByStatus(statuses, onDone) {
  const formula = encodeURIComponent(`OR(${statuses.map(s => `{status}="${s}"`).join(",")})`);
  const res  = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${formula}`, { headers: atHeaders() });
  const data = await res.json();
  const ids  = (data.records || []).map(r => r.id);
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 10) {
    const params = ids.slice(i, i + 10).map(id => `records[]=${id}`).join("&");
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`, { method: "DELETE", headers: atHeaders() });
  }
  onDone?.();
}

// ─── Cat SVGs ──────────────────────────────────────────────
const LoafCat = ({ color = C.snow, size = 40 }) => (
  <svg width={size} height={Math.round(size * 0.85)} viewBox="0 0 50 43" fill="none">
    <ellipse cx="25" cy="30" rx="22" ry="13" fill={color} />
    <ellipse cx="25" cy="22" rx="14" ry="11" fill={color} />
    <polygon points="13,14 11,6 18,12" fill={color} />
    <polygon points="37,14 39,6 32,12" fill={color} />
    <path d="M18,22 Q22,20 26,22 Q30,20 33,22" stroke={C.bg} strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>
);
const ResearchCat = ({ color = C.accent, size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 44 48" fill="none">
    <ellipse cx="22" cy="38" rx="13" ry="9" fill={color} />
    <ellipse cx="22" cy="22" rx="13" ry="14" fill={color} />
    <polygon points="11,11 9,2 16,10" fill={color} />
    <polygon points="33,11 35,2 28,10" fill={color} />
    <circle cx="17" cy="20" r="2.8" fill={C.bg} />
    <circle cx="27" cy="20" r="2.8" fill={C.bg} />
    <circle cx="17.8" cy="19.2" r="1.1" fill="rgba(255,255,255,0.4)" />
    <circle cx="27.8" cy="19.2" r="1.1" fill="rgba(255,255,255,0.4)" />
    <path d="M34,40 Q42,34 38,45" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
const DesignCat = ({ color = C.accent, size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 46 48" fill="none">
    <ellipse cx="20" cy="38" rx="12" ry="8" fill={color} />
    <ellipse cx="22" cy="22" rx="13" ry="13" fill={color} />
    <polygon points="12,11 10,3 17,10" fill={color} />
    <polygon points="32,11 34,3 27,10" fill={color} />
    <circle cx="18" cy="20" r="2.5" fill={C.bg} />
    <circle cx="27" cy="20" r="2.5" fill={C.bg} />
    <path d="M36,22 Q44,16 42,28 Q40,34 36,30" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <ellipse cx="42" cy="22" rx="4" ry="3" fill={color} />
  </svg>
);
const ListingCat = ({ color = C.cyan, size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 42 48" fill="none">
    <ellipse cx="21" cy="38" rx="13" ry="10" fill={color} />
    <ellipse cx="21" cy="20" rx="13" ry="13" fill={color} />
    <polygon points="11,10 9,2 16,9" fill={color} />
    <polygon points="31,10 33,2 26,9" fill={color} />
    <path d="M16,20 Q18,18 21,20" stroke={C.bg} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M21,20 Q24,18 27,20" stroke={C.bg} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <path d="M30,36 Q38,28 35,42 Q30,46 21,44" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
const ReviewCat = ({ color = C.amber, size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 44 48" fill="none">
    <ellipse cx="22" cy="36" rx="14" ry="10" fill={color} />
    <ellipse cx="22" cy="20" rx="13" ry="13" fill={color} />
    <polygon points="11,10 9,2 16,9" fill={color} />
    <polygon points="33,10 35,2 28,9" fill={color} />
    <ellipse cx="22" cy="20" rx="7" ry="4.5" fill={C.bg} />
    <ellipse cx="22" cy="20" rx="3.5" ry="3.5" fill={color} />
    <ellipse cx="22" cy="20" rx="1.5" ry="1.5" fill={C.bg} />
  </svg>
);
const FeedbackCat = ({ color = C.danger, size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 42 48" fill="none">
    <ellipse cx="21" cy="36" rx="14" ry="11" fill={color} />
    <ellipse cx="21" cy="20" rx="13" ry="13" fill={color} />
    <polygon points="11,10 9,2 16,9" fill={color} />
    <polygon points="31,10 33,2 26,9" fill={color} />
    <circle cx="16.5" cy="19" r="3.2" fill={C.bg} />
    <circle cx="25.5" cy="19" r="3.2" fill={C.bg} />
    <circle cx="17.3" cy="18" r="1.3" fill="rgba(255,255,255,0.4)" />
    <circle cx="26.3" cy="18" r="1.3" fill="rgba(255,255,255,0.4)" />
  </svg>
);

// ─── UI atoms ──────────────────────────────────────────────
const Btn = ({ children, onClick, color = C.accent, style: ex = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...F, background: "transparent", color, border: `1px solid ${color}66`,
    borderRadius: 6, padding: "6px 14px", fontSize: 11, cursor: disabled ? "default" : "pointer",
    letterSpacing: 1, transition: "all 0.15s", opacity: disabled ? 0.4 : 1, ...ex,
  }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.boxShadow = `0 0 10px ${color}44`)}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
  >{children}</button>
);
const GreenBtn  = (p) => <Btn {...p} color={C.success} />;
const RedBtn    = (p) => <Btn {...p} color={C.danger} />;
const AmberBtn  = (p) => <Btn {...p} color={C.amber} />;
const GhostBtn  = (p) => <Btn {...p} color={C.muted} />;
const VioletBtn = (p) => <Btn {...p} color={C.accent} />;
const CyanBtn   = (p) => <Btn {...p} color={C.cyan} />;

const Label = ({ children, style: ex = {} }) => (
  <div style={{ ...F, fontSize: 8, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 8, ...ex }}>{children}</div>
);
const EmptyState = ({ text }) => (
  <div style={{ ...F, fontSize: 10, color: C.muted, textAlign: "center", padding: "28px 0", letterSpacing: 1 }}>{text}</div>
);

function StatusDot({ color, pulse = false }) {
  const col = color || C.muted;
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: col,
      flexShrink: 0, animation: pulse ? "pulse 1.4s ease-in-out infinite" : "none",
      boxShadow: pulse ? `0 0 6px ${col}` : "none",
    }} />
  );
}

function agentDotColor(agentData) {
  if (!agentData?.last_run?.run_date) return C.muted;
  const diff = (Date.now() - new Date(agentData.last_run.run_date)) / 86400000;
  if (diff < 1) return C.success;
  if (diff < 7) return C.amber;
  return C.muted;
}

const Badge = ({ text, color = C.accent }) => (
  <span style={{ ...F, fontSize: 8, padding: "2px 8px", borderRadius: 4, letterSpacing: 1,
    textTransform: "uppercase", color, background: `${color}18`, border: `1px solid ${color}44`,
    flexShrink: 0, whiteSpace: "nowrap" }}>{text}</span>
);

// ─── Internal hooks ────────────────────────────────────────
function useActivityLog(pipelineStatus, logs) {
  const [entries, setEntries] = useState([]);
  const lastTs   = useRef(null);
  const lastTask = useRef(null);
  const seeded   = useRef(false);

  useEffect(() => {
    if (seeded.current || logs.length === 0) return;
    seeded.current = true;
    const initial = [...logs].reverse().slice(-6).map((log, i) => ({
      id: `seed-${i}`, time: log.date ? String(log.date).slice(0, 10) : "—",
      agent: "PIPELINE",
      message: `run complete — ${log.listings} listings — ${(log.status || "").toUpperCase()}`,
      type: log.status === "success" ? "success" : "warning",
    }));
    setEntries(initial);
  }, [logs]);

  useEffect(() => {
    if (!pipelineStatus?.timestamp) return;
    const { timestamp, active_agent, current_task, running, status } = pipelineStatus;
    if (timestamp === lastTs.current && current_task === lastTask.current) return;
    lastTs.current = timestamp; lastTask.current = current_task;
    const d = new Date(timestamp);
    const time = isNaN(d) ? "—" : d.toTimeString().slice(0, 8);
    const type = !running && status === "complete" ? "success"
               : !running && status?.startsWith("waiting") ? "warning"
               : "info";
    setEntries(prev => [...prev, {
      id: `${timestamp}-${active_agent}`,
      time, agent: (active_agent || "SYSTEM").toUpperCase(),
      message: current_task || (running ? "processing..." : `status: ${status || "idle"}`), type,
    }].slice(-60));
  }, [pipelineStatus]);

  return entries;
}

function usePendingDecisions() {
  const [decisions, setDecisions] = useState([]);
  const fetch_ = useCallback(async () => {
    try { const res = await fetch(`${API}/decisions`); const data = await res.json(); setDecisions(data.decisions || []); } catch (_) {}
  }, []);
  useEffect(() => { fetch_(); const t = setInterval(fetch_, 10000); return () => clearInterval(t); }, [fetch_]);
  const resolve = async (id, status, note = "") => {
    try {
      await fetch(`${API}/decisions/${id}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note }) });
      fetch_();
    } catch (_) {}
  };
  return { decisions, resolve };
}

function useAgentsStatus() {
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    const f = async () => { try { const res = await fetch(`${API}/agents/status`); const d = await res.json(); setAgents(d.agents || []); } catch (_) {} };
    f(); const t = setInterval(f, 30000); return () => clearInterval(t);
  }, []);
  return agents;
}

function useLastMeeting() {
  const [meeting, setMeeting] = useState(null);
  useEffect(() => {
    const f = async () => { try { const res = await fetch(`${API}/meeting/last`); const d = await res.json(); setMeeting(d.meeting || null); } catch (_) {} };
    f(); const t = setInterval(f, 60000); return () => clearInterval(t);
  }, []);
  return meeting;
}

// ─── Sidebar ───────────────────────────────────────────────
function Sidebar({ active, setActive, counts, agentDots }) {
  const navItem = (id, icon, label, accent = C.accent, badge = 0, dot = null) => {
    const isActive = active === id;
    return (
      <button key={id} onClick={() => setActive(id)} style={{
        ...F, width: "100%", display: "flex", alignItems: "center", gap: 10,
        background: isActive ? `${accent}11` : "transparent",
        border: "none", borderLeft: `3px solid ${isActive ? accent : "transparent"}`,
        padding: "0 12px 0 9px", height: 44, cursor: "pointer",
        transition: "all 0.15s", textAlign: "left",
      }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${accent}09`; e.currentTarget.style.borderLeftColor = `${accent}44`; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; } }}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
        <span style={{ ...F, fontSize: 11, color: isActive ? accent : C.muted, letterSpacing: 1.2, flex: 1, textTransform: "uppercase" }}>{label}</span>
        {dot && <StatusDot color={dot} pulse={dot === C.success} />}
        {badge > 0 && (
          <span style={{ ...F, fontSize: 9, color: accent, background: `${accent}18`,
            border: `1px solid ${accent}44`, borderRadius: 3, padding: "0 5px", lineHeight: "16px", minWidth: 16, textAlign: "center" }}>{badge}</span>
        )}
      </button>
    );
  };

  const groupLabel = (text) => (
    <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 2, textTransform: "uppercase",
      padding: "14px 12px 4px", opacity: 0.6 }}>{text}</div>
  );

  return (
    <div style={{ width: 200, flexShrink: 0, background: C.bg, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>

      {/* Logo */}
      <div style={{ padding: "16px 12px 12px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LoafCat color={C.snow} size={26} />
          <div>
            <div style={{ ...F, fontSize: 12, fontWeight: 700, color: C.snow, letterSpacing: 2 }}>PROJECTSNOW</div>
            <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>v0.1</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, paddingTop: 4 }}>
        {groupLabel("Command")}
        {navItem("overview", "❄️", "Snow", C.snow)}

        {groupLabel("Production Floor")}
        {navItem("review",   "📋", "Review",  C.amber,   counts.review,  agentDots.review)}
        {navItem("listing",  "📤", "Snoopy",  C.cyan,    counts.listing, agentDots.snoopy)}
        {navItem("feedback", "📊", "Waffle",  C.danger,  0,              agentDots.waffle)}

        {groupLabel("Intelligence")}
        {navItem("logs",   "📜", "Pipeline Logs", C.accent)}
        {navItem("memory", "🧠", "Snow Memory",   C.accent)}

        {groupLabel("Future Agents")}
        {[0,1,2].map(i => (
          <div key={i} style={{ padding: "0 12px 0 12px", height: 40, display: "flex", alignItems: "center", opacity: 0.2 }}>
            <span style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 1 }}>+ AGENT SLOT</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat column ───────────────────────────────────────────
const fmtTime = (ts) => { if (!ts) return ""; const d = new Date(ts); return isNaN(d) ? "" : d.toTimeString().slice(0, 5); };

function SnowChat() {
  const [input, setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const { messages, refresh } = useSnowChat();
  const scrollRef  = useRef(null);
  const prevCount  = useRef(0);

  useEffect(() => {
    if (messages.length > prevCount.current && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    prevCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (sending && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sending]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setSending(true); setInput("");
    try { await fetch(`${API}/telegram?message=${encodeURIComponent(msg)}`); await refresh(); } catch (_) {}
    setTimeout(() => setSending(false), 15000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <LoafCat color={C.snow} size={20} />
        <span style={{ ...F, fontSize: 10, color: C.snow, letterSpacing: 2 }}>DIRECT LINE — SNOW</span>
        <span style={{ ...F, fontSize: 8, color: C.muted, marginLeft: "auto" }}>opus-4.6</span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px",
        display: "flex", flexDirection: "column", gap: 10, background: `${C.bg}` }}>
        {messages.length === 0 && !sending && (
          <div style={{ ...F, fontSize: 9, color: C.muted, textAlign: "center", marginTop: 80, letterSpacing: 1 }}>
            NO MESSAGES YET — SAY SOMETHING TO SNOW
          </div>
        )}
        {messages.map((m, i) => m.role === "user" ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "flex-end" }}>
            <span style={{ ...F, fontSize: 7, color: C.muted }}>{fmtTime(m.timestamp)}</span>
            <div>
              <div style={{ ...F, fontSize: 7, color: C.muted, textAlign: "right", marginBottom: 3, letterSpacing: 1 }}>YOU</div>
              <div style={{ ...F, fontSize: 11, color: C.text, background: `${C.accent}18`,
                border: `1px solid ${C.accent}33`, borderRadius: "6px 6px 2px 6px",
                padding: "7px 10px", maxWidth: 260, lineHeight: 1.6, wordBreak: "break-word" }}>{m.text}</div>
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0, marginTop: 16 }}><LoafCat color={C.snow} size={18} /></div>
            <div>
              <div style={{ ...F, fontSize: 7, color: C.muted, marginBottom: 3, letterSpacing: 1 }}>
                SNOW <span style={{ color: `${C.muted}88` }}>{fmtTime(m.timestamp)}</span>
              </div>
              <div style={{ ...F, fontSize: 11, color: C.text, background: C.card,
                border: `1px solid ${C.border}`, borderRadius: "6px 6px 6px 2px",
                padding: "8px 11px", maxWidth: 280, lineHeight: 1.7, wordBreak: "break-word",
                boxShadow: C.glowSnow }}>{m.text}</div>
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <LoafCat color={C.muted} size={18} />
            <span style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5, animation: "blink 1s step-end infinite" }}>THINKING...</span>
          </div>
        )}
      </div>

      <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !sending && send()}
          placeholder="Message Snow..."
          style={{ ...F, flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: "6px 9px", color: C.text, fontSize: 10, outline: "none", caretColor: C.snow }}
          onFocus={e => e.target.style.borderColor = C.snow}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <VioletBtn onClick={send} disabled={sending} style={{ padding: "6px 12px", fontSize: 10, borderRadius: 6 }}>
          {sending ? "..." : "SEND"}
        </VioletBtn>
      </div>
    </div>
  );
}

// ─── 4 Rooms (Production Floor) ───────────────────────────
function Room({ accent, children, onClick, style: ex = {} }) {
  const ref = useRef(null);
  return (
    <div ref={ref} onClick={onClick} style={{
      background: C.card, border: `1px solid ${C.roomBorder}`,
      borderLeft: `4px solid ${accent}`, borderRadius: 12, padding: 16,
      cursor: onClick ? "pointer" : "default", transition: "all 0.2s",
      marginBottom: 10, ...ex,
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 14px ${accent}22`; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.roomBorder; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderLeftColor = accent; }}
    >
      {children}
    </div>
  );
}

function RoomLabel({ text, color = C.muted }) {
  return <div style={{ ...F, fontSize: 7, letterSpacing: 2, textTransform: "uppercase", color, marginBottom: 10 }}>{text}</div>;
}

function RoomsView({ agentsStatus, packages, listings, setActive }) {
  const leon   = agentsStatus.find(a => a.name === "Leon");
  const riko   = agentsStatus.find(a => a.name === "Riko");
  const snoopy = agentsStatus.find(a => a.name === "Snoopy");
  const waffle = agentsStatus.find(a => a.name === "Waffle");

  const metricVal = (agent, key) => {
    const vals = agent?.metrics?.[key];
    if (!vals || !vals.length) return null;
    return vals[vals.length - 1];
  };

  return (
    <div style={{ padding: "18px 20px" }}>

      {/* Room 1 — Leon + Riko */}
      <Room accent={C.accent} onClick={() => setActive("review")}>
        <RoomLabel text="Production Lab" color={C.accent} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Leon */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ResearchCat color={C.accent} size={26} />
              <div>
                <div style={{ ...F, fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.5 }}>LEON</div>
                <div style={{ ...F, fontSize: 8, color: C.muted }}>MARKET RESEARCH</div>
              </div>
              <StatusDot color={agentDotColor(leon)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div>
                <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>RUNS</div>
                <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.text }}>{leon?.run_count || 0}</div>
              </div>
              <div>
                <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>IDEAS/RUN</div>
                <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.text }}>
                  {metricVal(leon, "proposals_per_run") ?? "—"}
                </div>
              </div>
            </div>
            <div style={{ ...F, fontSize: 8, color: C.muted, marginTop: 6 }}>
              last: {leon?.last_run?.run_date ? String(leon.last_run.run_date).slice(0, 10) : "never"}
            </div>
          </div>

          {/* Riko */}
          <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <DesignCat color={C.accent} size={26} />
              <div>
                <div style={{ ...F, fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.5 }}>RIKO</div>
                <div style={{ ...F, fontSize: 8, color: C.muted }}>VISUAL DESIGN</div>
              </div>
              <StatusDot color={agentDotColor(riko)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div>
                <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>RUNS</div>
                <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.text }}>{riko?.run_count || 0}</div>
              </div>
              <div>
                <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>IMAGES</div>
                <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.text }}>
                  {metricVal(riko, "images_per_run") ?? "—"}
                </div>
              </div>
            </div>
            <div style={{ ...F, fontSize: 8, color: C.muted, marginTop: 6 }}>
              last: {riko?.last_run?.run_date ? String(riko.last_run.run_date).slice(0, 10) : "never"}
            </div>
          </div>
        </div>
      </Room>

      {/* Room 2 — Review */}
      <Room accent={C.amber} onClick={() => setActive("review")}>
        <RoomLabel text="Review Room" color={C.amber} />
        {packages.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {packages[0]?.image_url && (
              <img src={packages[0].image_url} alt="" style={{ width: 56, height: 72, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ ...F, fontSize: 18, fontWeight: 700, color: C.amber }}>{packages.length}</span>
                <span style={{ ...F, fontSize: 10, color: C.text }}>PACKAGE{packages.length !== 1 ? "S" : ""} AWAITING YOUR DECISION</span>
              </div>
              <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 10 }}>
                {packages[0]?.title?.slice(0, 50) || ""}
              </div>
              <AmberBtn style={{ fontSize: 10, padding: "4px 12px" }}>[ VIEW ALL PACKAGES ]</AmberBtn>
            </div>
          </div>
        ) : (
          <div style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 1 }}>
            NO PACKAGES PENDING — PRODUCTION FLOOR IDLE
          </div>
        )}
      </Room>

      {/* Room 3 — Snoopy */}
      <Room accent={C.cyan} onClick={() => setActive("listing")}>
        <RoomLabel text="Copy & Upload" color={C.cyan} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ListingCat color={C.cyan} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ ...F, fontSize: 12, fontWeight: 700, color: C.cyan, letterSpacing: 1.5 }}>SNOOPY</span>
              <span style={{ ...F, fontSize: 8, color: C.muted }}>SEO & LISTING COPY</span>
              <StatusDot color={agentDotColor(snoopy)} />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>RUNS</div>
                <div style={{ ...F, fontSize: 16, fontWeight: 700, color: C.text }}>{snoopy?.run_count || 0}</div>
              </div>
              <div>
                <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>READY</div>
                <div style={{ ...F, fontSize: 16, fontWeight: 700, color: listings.length > 0 ? C.cyan : C.text }}>{listings.length}</div>
              </div>
            </div>
          </div>
          {listings.length > 0 && <Badge text={`${listings.length} READY TO POST`} color={C.cyan} />}
        </div>
      </Room>

      {/* Room 4 — Waffle */}
      <Room accent={C.danger} onClick={() => setActive("feedback")}>
        <RoomLabel text="Performance" color={C.danger} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FeedbackCat color={C.danger} size={32} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ ...F, fontSize: 12, fontWeight: 700, color: C.danger, letterSpacing: 1.5 }}>WAFFLE</span>
              <span style={{ ...F, fontSize: 8, color: C.muted }}>PERFORMANCE TRACKER</span>
              <StatusDot color={agentDotColor(waffle)} />
            </div>
            <div style={{ ...F, fontSize: 9, color: C.muted }}>NEXT RECAP IN 6 DAYS</div>
            <div style={{ ...F, fontSize: 9, color: `${C.muted}88`, marginTop: 3 }}>NO DATA YET — AWAITING FIRST ETSY SALES</div>
          </div>
        </div>
      </Room>
    </div>
  );
}

// ─── Snow Overview page ─────────────────────────────────────
function OverviewPage({ setActive, pipelineStatus, packages, listings }) {
  const { decisions, resolve } = usePendingDecisions();
  const agentsStatus = useAgentsStatus();
  const lastMeeting  = useLastMeeting();
  const [meetingBusy, setMeetingBusy] = useState(false);
  const [modifyId, setModifyId] = useState(null);
  const [modifyNote, setModifyNote] = useState("");

  const subAgents = agentsStatus.filter(a => a.name !== "Snow");
  const snowAgent = agentsStatus.find(a => a.name === "Snow");

  const callMeeting = async () => {
    setMeetingBusy(true);
    try { await fetch(`${API}/meeting`, { method: "POST" }); } catch (_) {}
    setTimeout(() => setMeetingBusy(false), 3000);
  };

  const nextMondayStr = (() => {
    const now = new Date(), day = now.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
    const next = new Date(now); next.setDate(now.getDate() + diff); next.setHours(9, 0, 0, 0);
    const ms = next - now, days = Math.floor(ms / 86400000), hours = Math.floor((ms % 86400000) / 3600000);
    return days > 0 ? `in ${days}d ${hours}h` : `in ${hours}h`;
  })();

  const agentPageMap = { Leon: "research", Riko: "design", Snoopy: "listing", Waffle: "feedback" };

  return (
    <div style={{ padding: "20px 22px" }}>

      {/* Snow identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18,
        padding: "16px 18px", background: C.card, border: `1px solid ${C.snow}33`,
        borderRadius: 12, boxShadow: C.glowSnow }}>
        <LoafCat color={C.snow} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <span style={{ ...F, fontSize: 22, fontWeight: 700, color: C.snow, letterSpacing: 3 }}>SNOW</span>
            <span style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5 }}>AGENT MANAGER · OBSERVATION MODE</span>
            <Badge text="claude-opus-4.6" color={C.snow} />
          </div>
          {/* SNOW IS WATCHING */}
          <div style={{ marginBottom: 8 }}>
            {pipelineStatus?.running ? (
              <div style={{ ...F, fontSize: 10, color: C.snow, letterSpacing: 1.5, animation: "pulse 1.4s ease-in-out infinite" }}>
                ❄️ SNOW IS WATCHING {(pipelineStatus.active_agent || "").toUpperCase()} — {pipelineStatus.current_task || "processing..."}
              </div>
            ) : (
              <div style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 1.5 }}>
                ❄️ ALL AGENTS IDLE — AWAITING YOUR SIGNAL
              </div>
            )}
          </div>
          {/* Agent dots */}
          <div style={{ display: "flex", gap: 14 }}>
            {subAgents.map(a => {
              const dot = agentDotColor(a);
              return (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                  onClick={() => setActive(agentPageMap[a.name] || "overview")}>
                  <StatusDot color={dot} pulse={dot === C.success} />
                  <span style={{ ...F, fontSize: 8, color: dot === C.muted ? C.muted : C.text, letterSpacing: 1 }}>{a.name.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1, marginBottom: 3 }}>AUTONOMY</div>
          <div style={{ ...F, fontSize: 24, fontWeight: 700, color: C.amber }}>
            {snowAgent?.autonomy_level ?? 2}<span style={{ fontSize: 10, color: C.muted }}>/10</span>
          </div>
        </div>
      </div>

      {/* Production floor rooms */}
      <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>PRODUCTION FLOOR</div>
      <RoomsView agentsStatus={agentsStatus} packages={packages} listings={listings} setActive={setActive} />

      {/* Pending decisions */}
      <div style={{ marginBottom: 18, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ ...F, fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: 2 }}>PENDING DECISIONS</span>
          {decisions.length > 0 && <Badge text={String(decisions.length)} color={C.danger} />}
        </div>
        {decisions.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px", textAlign: "center" }}>
            <span style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 1.5 }}>NO PENDING DECISIONS — SNOW IS WATCHING</span>
          </div>
        ) : decisions.map(d => (
          <div key={d.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Badge text={d.decision_type?.toUpperCase() || "GENERAL"} color={C.accent} />
              <span style={{ ...F, fontSize: 8, color: C.muted, marginLeft: "auto" }}>{String(d.created_at || "").slice(0, 16)}</span>
            </div>
            <div style={{ ...F, fontSize: 11, color: C.text, marginBottom: 5, lineHeight: 1.5 }}>{d.description}</div>
            <div style={{ ...F, fontSize: 9, color: C.muted, lineHeight: 1.6, marginBottom: 10,
              borderLeft: `2px solid ${C.accent}33`, paddingLeft: 8 }}>{d.recommendation}</div>
            {modifyId === d.id && (
              <input value={modifyNote} onChange={e => setModifyNote(e.target.value)}
                placeholder="Note (optional)..."
                style={{ ...F, width: "100%", marginBottom: 8, background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "5px 9px", color: C.text, fontSize: 10, outline: "none", boxSizing: "border-box" }} />
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <GreenBtn onClick={() => resolve(d.id, "approved", modifyNote)} style={{ flex: 1, padding: "5px 0", fontSize: 10 }}>[ APPROVE ]</GreenBtn>
              <AmberBtn onClick={() => { setModifyId(modifyId === d.id ? null : d.id); setModifyNote(""); }} style={{ padding: "5px 10px", fontSize: 10 }}>[ MODIFY ]</AmberBtn>
              <RedBtn onClick={() => resolve(d.id, "rejected", modifyNote)} style={{ padding: "5px 10px", fontSize: 10 }}>[ REJECT ]</RedBtn>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly meeting */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <Label style={{ margin: 0 }}>WEEKLY MEETING</Label>
          <span style={{ ...F, fontSize: 8, color: C.muted, marginLeft: "auto" }}>Next: Monday 09:00 ({nextMondayStr})</span>
        </div>
        {lastMeeting ? (
          <div style={{ ...F, fontSize: 9, color: C.muted, lineHeight: 1.7, marginBottom: 10, maxHeight: 48, overflow: "hidden" }}>
            {(lastMeeting.summary || "").slice(0, 200)}
          </div>
        ) : (
          <div style={{ ...F, fontSize: 9, color: `${C.muted}66`, marginBottom: 10 }}>No meetings yet</div>
        )}
        <VioletBtn onClick={callMeeting} disabled={meetingBusy} style={{ fontSize: 10 }}>
          {meetingBusy ? "CALLING MEETING..." : "[ CALL MEETING NOW ]"}
        </VioletBtn>
      </div>

      {/* Agent performance mini cards */}
      <Label style={{ marginBottom: 10 }}>AGENT PERFORMANCE</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {subAgents.map(a => {
          const dot = agentDotColor(a);
          const primary = Object.entries(a.metrics || {}).find(([k]) => k === "proposals_per_run" || k === "images_per_run" || k === "listings_per_run" || k === "completion_rate");
          const accentMap = { Leon: C.accent, Riko: C.accent, Snoopy: C.cyan, Waffle: C.danger };
          const ac = accentMap[a.name] || C.accent;
          return (
            <div key={a.name} onClick={() => setActive(agentPageMap[a.name] || "overview")}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px",
                cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.boxShadow = `0 0 10px ${ac}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ ...F, fontSize: 10, fontWeight: 700, color: ac, letterSpacing: 1 }}>{a.name.toUpperCase()}</span>
                <StatusDot color={dot} />
              </div>
              <div style={{ ...F, fontSize: 7, color: C.muted, marginBottom: 2 }}>RUNS</div>
              <div style={{ ...F, fontSize: 16, fontWeight: 700, color: C.text }}>{a.run_count || 0}</div>
              {primary && (
                <>
                  <div style={{ ...F, fontSize: 7, color: C.muted, marginTop: 6, marginBottom: 2 }}>{primary[0].toUpperCase()}</div>
                  <div style={{ ...F, fontSize: 14, color: C.text }}>
                    {primary[1] != null ? (primary[1] < 1.5 ? (primary[1] * 100).toFixed(0) + "%" : primary[1].toFixed(1)) : "—"}
                    <span style={{ fontSize: 10, marginLeft: 4, color: { up: C.success, down: C.danger, stable: C.muted }[a.trends?.[primary[0]]] || C.muted }}>
                      {{ up: "↑", down: "↓", stable: "→" }[a.trends?.[primary[0]]] || "→"}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {subAgents.length === 0 && <div style={{ gridColumn: "1/-1" }}><EmptyState text="NO AGENT DATA YET — RUN THE PIPELINE" /></div>}
      </div>
    </div>
  );
}

// ─── Review page ───────────────────────────────────────────
function ReviewPage({ packages, reviewPackage, activeAgent, runStep2 }) {
  const [expanded, setExpanded]     = useState(null);
  const [showPrompt, setShowPrompt] = useState(null);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const isActive = activeAgent === "Leon" || activeAgent === "Riko";

  const handleReview = async (pkg, status) => {
    await reviewPackage(pkg.id, status, { title: pkg.title, niche: pkg.niche, keyword: pkg.keyword });
    setSessionReviewed(n => n + 1);
  };

  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ ...F, fontSize: 16, fontWeight: 700, color: C.amber, letterSpacing: 2 }}>REVIEW</span>
        <span style={{ ...F, fontSize: 9, color: C.muted }}>LEON × RIKO</span>
        {isActive && <Badge text="GENERATING" color={C.accent} />}
        {packages.length > 0 && <Badge text={`${packages.length} PENDING`} color={C.amber} />}
      </div>

      {packages.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          {sessionReviewed > 0 ? (
            <>
              <div style={{ ...F, fontSize: 13, color: C.success, letterSpacing: 2, marginBottom: 12 }}>ALL PACKAGES REVIEWED</div>
              <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 20 }}>
                {sessionReviewed} package{sessionReviewed !== 1 ? "s" : ""} decided — approved packages queued for strategy review.
              </div>
              <GreenBtn onClick={runStep2} style={{ fontSize: 11, letterSpacing: 1 }}>[ RUN STRATEGY REVIEW ]</GreenBtn>
            </>
          ) : <EmptyState text="NO PACKAGES READY — RUN THE PIPELINE FIRST" />}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ background: C.card, border: `1px solid ${C.roomBorder}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr" }}>
                <div style={{ position: "relative", background: "#050510", minHeight: 260 }}>
                  {pkg.image_url ? (
                    <>
                      <img src={pkg.image_url} alt={pkg.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                        onClick={() => setExpanded(expanded === pkg.id ? null : pkg.id)} />
                      <button onClick={() => setExpanded(expanded === pkg.id ? null : pkg.id)} style={{
                        position: "absolute", top: 8, right: 8, ...F, fontSize: 9, color: C.text,
                        background: "rgba(0,0,0,0.8)", border: `1px solid ${C.border}`, borderRadius: 4,
                        padding: "3px 8px", cursor: "pointer", letterSpacing: 1 }}>EXPAND</button>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
                      <span style={{ ...F, fontSize: 9, color: C.muted }}>NO IMAGE</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ ...F, fontSize: 15, color: C.text, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>{pkg.title}</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      <Badge text={pkg.niche} color={C.accent} />
                      <Badge text={pkg.keyword} color={C.cyan} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>WHY IT SELLS</div>
                      <div style={{ ...F, fontSize: 10, color: C.muted, lineHeight: 1.7 }}>{pkg.why_it_sells}</div>
                    </div>
                    {pkg.image_prompt && (
                      <div>
                        <button onClick={() => setShowPrompt(showPrompt === pkg.id ? null : pkg.id)}
                          style={{ ...F, fontSize: 8, color: C.muted, background: "transparent", border: "none",
                            cursor: "pointer", letterSpacing: 1, padding: 0, textTransform: "uppercase" }}>
                          {showPrompt === pkg.id ? "▲ HIDE PROMPT" : "▼ IMAGE PROMPT"}
                        </button>
                        {showPrompt === pkg.id && (
                          <div style={{ ...F, fontSize: 9, color: `${C.muted}99`, marginTop: 6, lineHeight: 1.6,
                            background: C.bg, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}` }}>
                            {pkg.image_prompt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                    <GreenBtn onClick={() => handleReview(pkg, "strategy_review")}
                      style={{ width: "100%", padding: "9px 0", fontSize: 11, letterSpacing: 1, borderRadius: 8 }}>
                      [ APPROVE ]
                    </GreenBtn>
                    <RedBtn onClick={() => handleReview(pkg, "rejected")}
                      style={{ width: "100%", padding: "9px 0", fontSize: 11, letterSpacing: 1, borderRadius: 8 }}>
                      [ REJECT ]
                    </RedBtn>
                  </div>
                </div>
              </div>
              {expanded === pkg.id && pkg.image_url && (
                <div onClick={() => setExpanded(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.97)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
                  <img src={pkg.image_url} alt={pkg.title} style={{ maxHeight: "92vh", maxWidth: "72vw", objectFit: "contain", borderRadius: 8 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Agent history page ─────────────────────────────────────
function AgentHistoryPage({ name, role, Cat, accent = C.accent, entries, activeAgent }) {
  const agentsStatus = useAgentsStatus();
  const agent = agentsStatus.find(a => a.name === name);
  const isActive = activeAgent === name;

  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Cat color={accent} size={36} />
        <div>
          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: accent, letterSpacing: 2 }}>{name.toUpperCase()}</div>
          <div style={{ ...F, fontSize: 9, color: C.muted }}>{role}</div>
        </div>
        {isActive && <Badge text="RUNNING" color={C.success} />}
        <StatusDot color={agentDotColor(agent)} pulse={isActive} />
      </div>
      {agent ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "TOTAL RUNS", value: agent.run_count || 0 },
            { label: "AUTONOMY", value: `${agent.autonomy_level || 0}/10`, color: C.amber },
            { label: "LAST RUN", value: agent.last_run?.run_date ? String(agent.last_run.run_date).slice(0, 10) : "never" },
            ...Object.entries(agent.metrics || {}).map(([k, v]) => ({
              label: k.toUpperCase().replace(/_/g, " "),
              value: v != null ? (v < 1.5 ? (v * 100).toFixed(0) + "%" : v.toFixed(1)) : "—",
              trend: { up: "↑", down: "↓", stable: "→" }[agent.trends?.[k]] || "→",
            })),
          ].map((stat, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px" }}>
              <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ ...F, fontSize: 22, fontWeight: 700, color: stat.color || C.text }}>
                {stat.value}
                {stat.trend && <span style={{ fontSize: 12, marginLeft: 5, color: stat.trend === "↑" ? C.success : stat.trend === "↓" ? C.danger : C.muted }}>{stat.trend}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState text={`NO DATA YET FOR ${name} — RUN THE PIPELINE`} />}
      <AgentLog agentName={name} entries={entries} accent={accent} isActive={isActive} />
    </div>
  );
}

// ─── Agent log terminal ─────────────────────────────────────
function AgentLog({ agentName, entries, accent = C.accent, isActive }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [entries, isActive]);
  const relevant = entries.filter(e => e.agent === agentName.toUpperCase()).slice(-5);
  return (
    <div style={{ background: C.bg, border: `1px solid ${isActive ? accent + "44" : C.border}`, borderRadius: 8,
      overflow: "hidden", boxShadow: isActive ? `0 0 10px ${accent}22` : "none", marginTop: 4 }}>
      <div style={{ padding: "5px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 2 }}>AGENT LOG</span>
        {isActive && <StatusDot color={accent} pulse />}
      </div>
      <div ref={scrollRef} style={{ padding: "8px 12px", height: 100, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
        {relevant.length === 0 && !isActive && <span style={{ ...F, fontSize: 9, color: `${C.muted}66` }}>No activity this session.</span>}
        {relevant.map(entry => (
          <div key={entry.id} style={{ ...F, fontSize: 9, color: accent, lineHeight: 1.7 }}>
            <span style={{ color: `${C.muted}88` }}>[{entry.time}]</span>
            <span style={{ marginLeft: 7 }}>{entry.message}</span>
          </div>
        ))}
        {isActive && <div style={{ ...F, fontSize: 9, color: accent, lineHeight: 1.7 }}>processing<span style={{ animation: "blink 1s step-end infinite" }}>_</span></div>}
      </div>
    </div>
  );
}

// ─── Listing page ───────────────────────────────────────────
function ListingPage({ listings, activeAgent, onSelect, entries }) {
  const state = activeAgent === "Snoopy" ? "running" : listings.length > 0 ? "waiting" : "idle";
  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <ListingCat color={C.cyan} size={34} />
        <div>
          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: C.cyan, letterSpacing: 2 }}>SNOOPY</div>
          <div style={{ ...F, fontSize: 9, color: C.muted }}>SEO & LISTING COPY</div>
        </div>
        {state === "running" && <Badge text="RUNNING" color={C.success} />}
        {listings.length > 0 && <Badge text={`${listings.length} READY`} color={C.cyan} />}
        <div style={{ marginLeft: "auto" }}>
          <GhostBtn onClick={() => deleteByStatus(["ready_to_upload"])} style={{ fontSize: 10 }}>[ CLEAR UPLOADED ]</GhostBtn>
        </div>
      </div>

      {listings.length === 0
        ? <EmptyState text="NO LISTINGS READY — APPROVE PACKAGES FIRST" />
        : (
          <>
            <Label style={{ marginBottom: 10 }}>READY TO UPLOAD ({listings.length})</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {listings.map(l => (
                <div key={l.id} onClick={() => onSelect(l)}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.boxShadow = C.glowCyan; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                  {l.image_url && (
                    <div style={{ position: "relative" }}>
                      <img src={l.image_url} alt={l.title} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                      {l.price && <span style={{ position: "absolute", bottom: 6, left: 8, ...F, fontSize: 13, fontWeight: 700, color: C.cyan, background: "rgba(0,0,0,0.85)", padding: "2px 7px", borderRadius: 4 }}>{l.price}</span>}
                    </div>
                  )}
                  <div style={{ padding: "10px 11px" }}>
                    <div style={{ ...F, fontSize: 9, color: C.text, marginBottom: 5, lineHeight: 1.4 }}>{l.title?.slice(0, 52)}{l.title?.length > 52 ? "…" : ""}</div>
                    <div style={{ ...F, fontSize: 8, color: C.muted, marginBottom: 8 }}>{l.tags?.split(",").length || 0} tags</div>
                    <CyanBtn onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "5px 0", fontSize: 10 }}>[ POST TO ETSY ]</CyanBtn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      }
      <div style={{ marginTop: 12 }}><AgentLog agentName="Snoopy" entries={entries} accent={C.cyan} isActive={state === "running"} /></div>
    </div>
  );
}

// ─── Feedback / Waffle page ─────────────────────────────────
function FeedbackPage({ entries }) {
  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <FeedbackCat color={C.danger} size={34} />
        <div>
          <div style={{ ...F, fontSize: 16, fontWeight: 700, color: C.danger, letterSpacing: 2 }}>WAFFLE</div>
          <div style={{ ...F, fontSize: 9, color: C.muted }}>PERFORMANCE TRACKER</div>
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <div style={{ ...F, fontSize: 10, color: C.muted }}>Next recap in <span style={{ color: C.text }}>6 days</span></div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ ...F, fontSize: 13, color: `${C.muted}66`, letterSpacing: 3 }}>NO DATA YET</div>
        <div style={{ ...F, fontSize: 9, color: `${C.muted}44`, marginTop: 8 }}>Requires active Etsy listings</div>
      </div>
      <div style={{ marginTop: 12 }}><AgentLog agentName="Waffle" entries={entries} accent={C.danger} isActive={false} /></div>
    </div>
  );
}

// ─── Logs page ──────────────────────────────────────────────
function LogsPage({ logs }) {
  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ ...F, fontSize: 14, color: C.accent, letterSpacing: 2, marginBottom: 4 }}>PIPELINE LOGS</div>
      <div style={{ ...F, fontSize: 9, color: C.muted, marginBottom: 18 }}>All runs — newest first</div>
      {logs.length === 0 ? <EmptyState text="NO RUNS RECORDED YET" /> : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.6fr 0.6fr 0.6fr 0.8fr", padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
            {["DATE", "DURATION", "PROPS", "DESIGNS", "LISTINGS", "STATUS"].map(h => (
              <div key={h} style={{ ...F, fontSize: 7, color: C.muted, letterSpacing: 1.5 }}>{h}</div>
            ))}
          </div>
          {logs.map((log, i) => {
            const sc = log.status === "success" ? C.success : log.status === "failed" ? C.danger : C.amber;
            return (
              <div key={log.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.6fr 0.6fr 0.6fr 0.8fr",
                padding: "9px 16px", borderBottom: i < logs.length - 1 ? `1px solid ${C.faint}` : "none", alignItems: "center" }}>
                <div style={{ ...F, fontSize: 10, color: C.text }}>{log.date}</div>
                <div style={{ ...F, fontSize: 10, color: C.muted }}>{log.duration || "—"}</div>
                <div style={{ ...F, fontSize: 10, color: C.muted }}>{log.proposals}</div>
                <div style={{ ...F, fontSize: 10, color: C.muted }}>{log.designs}</div>
                <div style={{ ...F, fontSize: 10, color: C.muted }}>{log.listings}</div>
                <Badge text={log.status} color={sc} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Memory page ────────────────────────────────────────────
function MemoryPage({ memory }) {
  const [filter, setFilter] = useState("all");
  const cats  = ["all", ...Array.from(new Set(memory.map(m => m.category)))];
  const shown = filter === "all" ? memory : memory.filter(m => m.category === filter);
  const catColor = (c) => ({ approved: C.success, rejected: C.danger, trend: C.cyan, avoid: C.amber })[c] || C.accent;
  return (
    <div style={{ padding: "20px 22px" }}>
      <div style={{ ...F, fontSize: 14, color: C.accent, letterSpacing: 2, marginBottom: 4 }}>SNOW MEMORY</div>
      <div style={{ ...F, fontSize: 9, color: C.muted, marginBottom: 16 }}>Observations across all pipeline runs</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            ...F, fontSize: 8, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
            letterSpacing: 1, textTransform: "uppercase",
            background: filter === cat ? `${catColor(cat)}18` : C.card,
            color: filter === cat ? catColor(cat) : C.muted,
            border: `1px solid ${filter === cat ? catColor(cat) + "66" : C.border}`,
          }}>{cat}</button>
        ))}
      </div>
      {shown.length === 0 ? <EmptyState text="NO ENTRIES" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shown.map(m => (
            <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "10px 13px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Badge text={m.category} color={catColor(m.category)} />
              <div style={{ ...F, fontSize: 10, color: C.muted, flex: 1, lineHeight: 1.6 }}>{m.observation}</div>
              <div style={{ ...F, fontSize: 8, color: `${C.muted}66`, whiteSpace: "nowrap" }}>{m.created_at?.slice(0, 10) || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Listing modal ──────────────────────────────────────────
function ListingModal({ listing, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,8,0.96)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.accent}`,
        borderRadius: 12, overflow: "hidden", maxWidth: 640, width: "92%", cursor: "default",
        display: "grid", gridTemplateColumns: "1fr 1fr", boxShadow: C.glowSnow }}>
        {listing.image_url && (
          <img src={listing.image_url} alt={listing.title}
            style={{ width: "100%", height: "100%", minHeight: 320, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: "20px 18px", overflowY: "auto", maxHeight: 480 }}>
          <div style={{ ...F, fontSize: 13, color: C.text, marginBottom: 6, lineHeight: 1.4 }}>{listing.title}</div>
          <div style={{ ...F, fontSize: 20, fontWeight: 700, color: C.cyan, marginBottom: 14 }}>{listing.price}</div>
          <Label>Description</Label>
          <div style={{ ...F, fontSize: 10, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
            {listing.description?.slice(0, 300)}{listing.description?.length > 300 ? "…" : ""}
          </div>
          <Label>Tags</Label>
          <div style={{ ...F, fontSize: 9, color: `${C.muted}88`, lineHeight: 2, marginBottom: 16 }}>{listing.tags}</div>
          <CyanBtn style={{ width: "100%", padding: "9px 0", fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>[ POST TO ETSY ]</CyanBtn>
          <GhostBtn onClick={onClose} style={{ width: "100%", padding: "8px 0", fontSize: 11 }}>[ CLOSE ]</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Lock screen ────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);
  const inputRef          = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const attempt = () => {
    if (pw === process.env.REACT_APP_DASHBOARD_PASSWORD) {
      localStorage.setItem("projectsnow_unlocked", "1"); onUnlock();
    } else { setError(true); setPw(""); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...F }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(124,106,255,0.015) 3px, rgba(124,106,255,0.015) 4px)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 28, filter: `drop-shadow(0 0 20px ${C.snow}66)`, animation: "floatCat 4s ease-in-out infinite" }}>
          <LoafCat color={C.snow} size={72} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.snow, letterSpacing: 4, marginBottom: 6 }}>PROJECTSNOW</div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 40 }}>AGENT OPS v0.1</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input ref={inputRef} type="password" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()}
            placeholder="password"
            style={{ ...F, background: C.card, border: `1px solid ${error ? C.danger : C.accent}66`,
              borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 12, width: 220,
              outline: "none", caretColor: C.snow, letterSpacing: 2,
              boxShadow: error ? `0 0 12px ${C.danger}44` : `0 0 12px ${C.accent}22` }} />
          <VioletBtn onClick={attempt} style={{ padding: "9px 20px", fontSize: 11, letterSpacing: 1.5, borderRadius: 8 }}>[ ENTER ]</VioletBtn>
        </div>
        <div style={{ marginTop: 16, ...F, fontSize: 11, letterSpacing: 2, color: C.danger, height: 18, opacity: error ? 1 : 0 }}>
          ACCESS DENIED
        </div>
      </div>
      <style>{`@keyframes floatCat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }`}</style>
    </div>
  );
}

// ─── Page titles ────────────────────────────────────────────
const PAGE_TITLES = {
  overview: "SNOW — COMMAND CENTER",
  review:   "REVIEW — LEON × RIKO",
  research: "LEON — RESEARCH",
  design:   "RIKO — DESIGN",
  listing:  "SNOOPY — LISTING",
  feedback: "WAFFLE — FEEDBACK",
  logs:     "PIPELINE LOGS",
  memory:   "SNOW MEMORY",
};

// ─── Root ───────────────────────────────────────────────────
export default function Dashboard() {
  const [unlocked, setUnlocked] = useState(() => !!localStorage.getItem("projectsnow_unlocked"));

  const { packages, review: reviewPackage } = usePackages();
  const { listings }       = useReadyListings();
  const { status: ps }     = usePipelineStatus();
  const { logs }           = usePipelineLogs();
  const { memory }         = useSnowMemory();

  const [activePage, setActivePage]         = useState("overview");
  const [keywords, setKeywords]             = useState("");
  const [launching, setLaunching]           = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const activeAgent  = ps?.active_agent;
  const isRunning    = ps?.running;
  const pipelineStep = ps?.status;

  const activityEntries = useActivityLog(ps, logs);

  // Agent dots for sidebar
  const agentsStatus = useAgentsStatus();
  const agentDots = {
    review:  packages.length > 0 ? C.amber : C.muted,
    snoopy:  agentDotColor(agentsStatus.find(a => a.name === "Snoopy")),
    waffle:  agentDotColor(agentsStatus.find(a => a.name === "Waffle")),
  };

  const counts = { review: packages.length, listing: listings.length };

  const callEndpoint = async (url) => { setLaunching(true); try { await fetch(url, { method: "POST" }); } catch (_) {} setTimeout(() => setLaunching(false), 2000); };
  const launch       = () => callEndpoint(`${API}/launch?keywords=${encodeURIComponent(keywords)}`);
  const runStep2     = () => callEndpoint(`${API}/step2`);
  const runStep3     = () => callEndpoint(`${API}/step3`);
  const stopPipeline = async () => { try { await fetch(`${API}/stop`,  { method: "POST" }); } catch (_) {} };
  const resetPipeline= async () => { try { await fetch(`${API}/reset`, { method: "POST" }); } catch (_) {} };
  const fullReset    = async () => { if (!window.confirm("Delete ALL Airtable records and reset the pipeline?")) return; try { await fetch(`${API}/reset/airtable`, { method: "POST" }); } catch (_) {} };

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, overflow: "hidden" }}>

      <Sidebar active={activePage} setActive={setActivePage} counts={counts} agentDots={agentDots} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header */}
        <div style={{ height: 46, borderBottom: `1px solid ${C.border}`, display: "flex",
          alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0, background: C.bg }}>
          <span style={{ ...F, fontSize: 11, color: C.accent, letterSpacing: 2, minWidth: 180 }}>
            {PAGE_TITLES[activePage] || "OVERVIEW"}
          </span>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !isRunning && !launching && launch()}
            placeholder="keywords for snow..."
            style={{ ...F, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: "5px 10px", color: C.text, fontSize: 10, width: 180, outline: "none", caretColor: C.snow }}
            onFocus={e => e.target.style.borderColor = C.snow}
            onBlur={e => e.target.style.borderColor = C.border}
          />

          {isRunning ? (
            <RedBtn onClick={stopPipeline} style={{ fontSize: 10, animation: "pulse 1.4s ease-in-out infinite" }}>[ STOP ]</RedBtn>
          ) : launching ? (
            <GhostBtn disabled style={{ fontSize: 10 }}>LAUNCHING...</GhostBtn>
          ) : pipelineStep === "waiting_review" ? (
            <AmberBtn onClick={() => setActivePage("review")} style={{ fontSize: 10 }}>[ APPROVE PACKAGES ]</AmberBtn>
          ) : pipelineStep === "waiting_listing" ? (
            <CyanBtn onClick={runStep3} style={{ fontSize: 10 }}>[ RUN SNOOPY ]</CyanBtn>
          ) : (
            <VioletBtn onClick={launch} style={{ fontSize: 10 }}>[ GO WORK ]</VioletBtn>
          )}

          <GhostBtn onClick={resetPipeline} style={{ fontSize: 10 }}>[ RESET ]</GhostBtn>
          <RedBtn onClick={fullReset} style={{ fontSize: 10 }}>[ FULL RESET ]</RedBtn>

          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <StatusDot color={C.success} pulse />
              <span style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1 }}>{activeAgent}</span>
            </div>
          )}

          <div style={{ flex: 1 }} />
          {[["LISTINGS", listings.length], ["VIEWS", 0], ["SALES", 0]].map(([label, val]) => (
            <div key={label} style={{ textAlign: "right", paddingLeft: 14, borderLeft: `1px solid ${C.border}` }}>
              <div style={{ ...F, fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1 }}>{val}</div>
              <div style={{ ...F, fontSize: 7, color: C.muted, marginTop: 2, letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Status banners */}
        {!isRunning && pipelineStep === "waiting_review" && (
          <div style={{ padding: "6px 16px", background: `${C.amber}0e`, borderBottom: `1px solid ${C.amber}33`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}
            onClick={() => setActivePage("review")}>
            <StatusDot color={C.amber} />
            <span style={{ ...F, fontSize: 9, color: C.amber, letterSpacing: 1.5 }}>
              {packages.length} PACKAGE{packages.length !== 1 ? "S" : ""} WAITING FOR REVIEW — CLICK TO REVIEW
            </span>
          </div>
        )}
        {!isRunning && pipelineStep === "waiting_listing" && (
          <div style={{ padding: "6px 16px", background: `${C.cyan}0e`, borderBottom: `1px solid ${C.cyan}33`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot color={C.cyan} pulse />
            <span style={{ ...F, fontSize: 9, color: C.cyan, letterSpacing: 1.5 }}>
              PACKAGES APPROVED — CLICK [ RUN SNOOPY ] TO WRITE LISTINGS
            </span>
          </div>
        )}
        {!isRunning && pipelineStep === "complete" && (
          <div style={{ padding: "6px 16px", background: `${C.success}0e`, borderBottom: `1px solid ${C.success}33`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot color={C.success} pulse />
            <span style={{ ...F, fontSize: 9, color: C.success, letterSpacing: 1.5 }}>
              PIPELINE COMPLETE — CHECK SNOOPY'S LISTINGS
            </span>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activePage === "overview"  && <OverviewPage setActive={setActivePage} pipelineStatus={ps} packages={packages} listings={listings} />}
          {activePage === "review"    && <ReviewPage packages={packages} reviewPackage={reviewPackage} activeAgent={activeAgent} runStep2={runStep2} />}
          {activePage === "research"  && <AgentHistoryPage name="LEON"   role="Market Research Specialist" Cat={ResearchCat} accent={C.accent} entries={activityEntries} activeAgent={activeAgent} />}
          {activePage === "design"    && <AgentHistoryPage name="RIKO"   role="Visual Design Specialist"    Cat={DesignCat}   accent={C.accent} entries={activityEntries} activeAgent={activeAgent} />}
          {activePage === "listing"   && <ListingPage listings={listings} activeAgent={activeAgent} onSelect={setSelectedListing} entries={activityEntries} />}
          {activePage === "feedback"  && <FeedbackPage entries={activityEntries} />}
          {activePage === "logs"      && <LogsPage logs={logs} />}
          {activePage === "memory"    && <MemoryPage memory={memory} />}
        </div>
      </div>

      {/* Right column — Snow chat */}
      <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${C.border}`, height: "100vh", display: "flex", flexDirection: "column" }}>
        <SnowChat />
      </div>

      {selectedListing && <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(124,106,255,0.015) 3px, rgba(124,106,255,0.015) 4px);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        input::placeholder { color: ${C.muted}; }
        button:focus { outline: none; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes floatCat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}
