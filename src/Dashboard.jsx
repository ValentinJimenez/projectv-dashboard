import { useState, useEffect, useRef, useCallback } from "react";
import {
  usePackages, useReadyListings,
  usePipelineStatus, usePipelineLogs, useSnowMemory, useSnowChat
} from "./useAirtable";

// ─── Design tokens ────────────────────────────────────────
const C = {
  bg:          "#080808",
  card:        "#0d0d0d",
  border:      "#00ff8822",
  borderHover: "#00ff8855",
  active:      "#00ff88",
  text:        "#e8e8e8",
  muted:       "#556655",
  faint:       "#1a1a1a",
  danger:      "#ff4444",
  dangerDim:   "#1a0000",
  amber:       "#ffbb44",
  cyan:        "#44ddff",
  purple:      "#cc88ff",
  dim:         "#00ff8833",
  glow:        "0 0 8px #00ff8844",
  glowStrong:  "0 0 14px #00ff8866",
};
const F = { fontFamily: "'Courier New', Courier, monospace" };

// ─── API base ─────────────────────────────────────────────
const API = "http://localhost:8000";

// ─── Airtable delete helpers ───────────────────────────────
const BASE_ID  = "appsS6oYAVqgJhe7H";
const TABLE_ID = "tblIyWuFysf5Hxu8u";
const atHeaders = () => ({ Authorization: `Bearer ${process.env.REACT_APP_AIRTABLE_API_KEY}` });

async function deleteByStatus(statuses, onDone) {
  const formula = encodeURIComponent(`OR(${statuses.map(s => `{status}="${s}"`).join(",")})`);
  const res  = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${formula}`,
    { headers: atHeaders() }
  );
  const data = await res.json();
  const ids  = (data.records || []).map(r => r.id);
  if (ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 10) {
    const chunk  = ids.slice(i, i + 10);
    const params = chunk.map(id => `records[]=${id}`).join("&");
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`, {
      method: "DELETE", headers: atHeaders(),
    });
  }
  onDone?.();
}

// ─── Cat SVGs ─────────────────────────────────────────────
const LoafCat = ({ color = C.active, size = 40 }) => (
  <svg width={size} height={Math.round(size * 0.85)} viewBox="0 0 50 43" fill="none">
    <ellipse cx="25" cy="30" rx="22" ry="13" fill={color} />
    <ellipse cx="25" cy="22" rx="14" ry="11" fill={color} />
    <polygon points="13,14 11,6 18,12" fill={color} />
    <polygon points="37,14 39,6 32,12" fill={color} />
    <path d="M18,22 Q22,20 26,22 Q30,20 33,22" stroke={C.bg} strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>
);
const ResearchCat = ({ color = "#00aa55", size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 44 48" fill="none">
    <ellipse cx="22" cy="38" rx="13" ry="9" fill={color} />
    <ellipse cx="22" cy="22" rx="13" ry="14" fill={color} />
    <polygon points="11,11 9,2 16,10" fill={color} />
    <polygon points="33,11 35,2 28,10" fill={color} />
    <circle cx="17" cy="20" r="2.8" fill={C.bg} />
    <circle cx="27" cy="20" r="2.8" fill={C.bg} />
    <path d="M34,40 Q42,34 38,45" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
const DesignCat = ({ color = "#00aa55", size = 36 }) => (
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
const ListingCat = ({ color = "#00aa55", size = 36 }) => (
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
const ReviewCat = ({ color = "#00aa55", size = 36 }) => (
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

const FeedbackCat = ({ color = "#00aa55", size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 42 48" fill="none">
    <ellipse cx="21" cy="36" rx="14" ry="11" fill={color} />
    <ellipse cx="21" cy="20" rx="13" ry="13" fill={color} />
    <polygon points="11,10 9,2 16,9" fill={color} />
    <polygon points="31,10 33,2 26,9" fill={color} />
    <circle cx="16.5" cy="19" r="3.2" fill={C.bg} />
    <circle cx="25.5" cy="19" r="3.2" fill={C.bg} />
  </svg>
);

// ─── Base UI atoms ─────────────────────────────────────────
const GreenBtn = ({ children, onClick, style: ex = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...F, background: "transparent", color: C.active, border: `1px solid ${C.active}`,
    borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: disabled ? "default" : "pointer",
    letterSpacing: 1, transition: "all 0.15s", opacity: disabled ? 0.4 : 1, ...ex,
  }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.boxShadow = C.glow)}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
  >{children}</button>
);

const RedBtn = ({ children, onClick, style: ex = {} }) => (
  <button onClick={onClick} style={{
    ...F, background: "transparent", color: C.danger, border: `1px solid ${C.danger}44`,
    borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: "pointer",
    letterSpacing: 1, ...ex,
  }}>{children}</button>
);

const GhostBtn = ({ children, onClick, style: ex = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...F, background: "transparent", color: C.muted, border: `1px solid #333`,
    borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: disabled ? "default" : "pointer",
    letterSpacing: 1, opacity: disabled ? 0.4 : 1, ...ex,
  }}>{children}</button>
);

const AmberBtn = ({ children, onClick, style: ex = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...F, background: "transparent", color: C.amber, border: `1px solid ${C.amber}66`,
    borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: disabled ? "default" : "pointer",
    letterSpacing: 1, opacity: disabled ? 0.4 : 1, ...ex,
  }}>{children}</button>
);

const Label = ({ children, style: ex = {} }) => (
  <div style={{ ...F, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 8, ...ex }}>{children}</div>
);

const EmptyState = ({ text }) => (
  <div style={{ ...F, fontSize: 11, color: C.muted, textAlign: "center", padding: "32px 0", letterSpacing: 1 }}>{text}</div>
);

const StatusDot = ({ state }) => {
  const color = state === "running" ? C.active : state === "waiting" ? C.amber : "#334433";
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: color, flexShrink: 0,
      animation: state === "running" ? "pulse 1.4s ease-in-out infinite" : "none",
      boxShadow: state === "running" ? `0 0 6px ${C.active}` : "none",
    }} />
  );
};

const CategoryBadge = ({ category }) => {
  const map = {
    approved:  { color: C.active,  bg: "#001a0d", border: C.dim },
    rejected:  { color: "#aa3333", bg: C.dangerDim, border: "#330000" },
    trend:     { color: C.cyan,    bg: "#001a22", border: "#003344" },
    avoid:     { color: C.amber,   bg: "#1a1000", border: "#332200" },
    general:   { color: C.muted,   bg: C.faint,  border: "#222" },
    STRATEGY:  { color: C.purple,  bg: "#0f001a", border: "#330055" },
    AUTONOMY:  { color: C.amber,   bg: "#1a1000", border: "#332200" },
    PIPELINE:  { color: C.cyan,    bg: "#001a22", border: "#003344" },
    DIRECTIVE: { color: C.active,  bg: "#001a0d", border: C.dim },
  };
  const s = map[category] || map.general;
  return (
    <span style={{ ...F, fontSize: 8, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.8,
      textTransform: "uppercase", color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      flexShrink: 0, whiteSpace: "nowrap" }}>{category}</span>
  );
};

// ─── Sidebar ───────────────────────────────────────────────
const NAV = [
  { id: "overview",  label: "SNOW",     sub: "Agent manager",        Cat: LoafCat },
  { id: "review",    label: "REVIEW",   sub: "Leon + Riko packages", Cat: ReviewCat },
  { id: "research",  label: "LEON",     sub: "Research specialist",  Cat: ResearchCat },
  { id: "design",    label: "RIKO",     sub: "Visual design",        Cat: DesignCat },
  { id: "strategy",  label: "STRATEGY", sub: "Coming soon",          Cat: ListingCat, disabled: true },
  { id: "listing",   label: "SNOOPY",   sub: "SEO & listings",       Cat: ListingCat },
  { id: "feedback",  label: "WAFFLE",   sub: "Performance tracker",  Cat: FeedbackCat },
];
const NAV2 = [
  { id: "logs",   label: "PIPELINE LOGS" },
  { id: "memory", label: "SNOW MEMORY" },
];
const PLACEHOLDERS = ["FUTURE AGENT 01", "FUTURE AGENT 02", "FUTURE AGENT 03"];

function Sidebar({ active, setActive, agentStates, counts }) {
  return (
    <div style={{ width: 260, flexShrink: 0, background: C.bg, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <LoafCat color={C.active} size={30} />
          <div>
            <div style={{ ...F, fontSize: 14, fontWeight: 700, color: C.active, letterSpacing: 2 }}>PROJECTSNOW</div>
            <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5 }}>AGENT OPS v2.0</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 10px 4px" }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          const state    = agentStates[item.id] || "idle";
          const count    = counts[item.id] || 0;
          return (
            <button key={item.id} onClick={() => !item.disabled && setActive(item.id)} disabled={item.disabled}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                background: isActive ? "#0d150d" : C.card,
                border: isActive ? `1px solid ${C.active}` : `1px solid ${C.border}`,
                borderLeft: isActive ? `3px solid ${C.active}` : `3px solid transparent`,
                borderRadius: 4, padding: "10px 10px", marginBottom: 5, cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.3 : 1, boxShadow: isActive ? C.glow : "none",
                minHeight: 64, transition: "all 0.15s",
              }}>
              <div style={{ flexShrink: 0 }}>
                <item.Cat color={isActive ? C.active : "#336644"} size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...F, fontSize: 11, fontWeight: 700, color: isActive ? C.active : C.muted,
                  letterSpacing: 1.5, marginBottom: 2 }}>{item.label}</div>
                <div style={{ ...F, fontSize: 9, color: "#334433", letterSpacing: 0.5 }}>{item.sub}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <StatusDot state={item.disabled ? "idle" : state} />
                {count > 0 && (
                  <span style={{ ...F, fontSize: 9, color: C.active, background: "#001a0d",
                    border: `1px solid ${C.dim}`, borderRadius: 3, padding: "0 5px", lineHeight: "16px" }}>{count}</span>
                )}
              </div>
            </button>
          );
        })}
        <div style={{ height: 1, background: C.border, margin: "8px 4px 10px" }} />
        {NAV2.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              width: "100%", textAlign: "left", background: isActive ? "#0d150d" : C.card,
              border: isActive ? `1px solid ${C.active}` : `1px solid ${C.border}`,
              borderLeft: isActive ? `3px solid ${C.active}` : `3px solid transparent`,
              borderRadius: 4, padding: "9px 12px", marginBottom: 5, cursor: "pointer",
              boxShadow: isActive ? C.glow : "none", transition: "all 0.15s",
            }}>
              <span style={{ ...F, fontSize: 11, color: isActive ? C.active : C.muted, letterSpacing: 1.5 }}>{item.label}</span>
            </button>
          );
        })}
        <div style={{ height: 1, background: C.border, margin: "8px 4px 10px" }} />
        {PLACEHOLDERS.map(p => (
          <div key={p} style={{ background: C.card, border: `1px solid #111`, borderRadius: 4,
            padding: "10px 12px", marginBottom: 5, minHeight: 50, display: "flex", alignItems: "center" }}>
            <span style={{ ...F, fontSize: 10, color: "#222", letterSpacing: 1 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Agent page header ─────────────────────────────────────
function AgentPageHeader({ CatComp, catColor = "#00aa55", name, sub, state, rightSlot }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 26px 16px",
      borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 56, height: 56, borderRadius: 6, background: C.card, border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: state === "running" ? C.glowStrong : "none" }}>
        <CatComp color={state === "running" ? C.active : catColor} size={36} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...F, fontSize: 14, fontWeight: 700, color: C.active, letterSpacing: 2, marginBottom: 2 }}>{name}</div>
        <div style={{ ...F, fontSize: 10, color: C.muted }}>{sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusDot state={state} />
        <span style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{state}</span>
      </div>
      {rightSlot}
    </div>
  );
}

const TermLine = ({ text, color = C.muted }) => (
  <div style={{ padding: "8px 26px", background: "#050505", borderBottom: `1px solid ${C.border}`,
    ...F, fontSize: 10, color }}>
    <span style={{ color: C.active, marginRight: 8 }}>&gt;</span>{text}
  </div>
);

// ─── Activity log hook ─────────────────────────────────────
function useActivityLog(pipelineStatus, logs) {
  const [entries, setEntries] = useState([]);
  const lastTs   = useRef(null);
  const lastTask = useRef(null);
  const seeded   = useRef(false);

  useEffect(() => {
    if (seeded.current || logs.length === 0) return;
    seeded.current = true;
    const initial = [...logs].reverse().slice(-6).map((log, i) => ({
      id:      `seed-${i}`,
      time:    log.date ? String(log.date).slice(0, 10) : "—",
      agent:   "PIPELINE",
      message: `run complete — ${log.proposals} proposals · ${log.designs} designs · ${log.listings} listings — ${(log.status || "").toUpperCase()}`,
      type:    log.status === "success" ? "success" : log.status === "failed" ? "error" : "warning",
    }));
    setEntries(initial);
  }, [logs]);

  useEffect(() => {
    if (!pipelineStatus?.timestamp) return;
    const { timestamp, active_agent, current_task, running, status } = pipelineStatus;
    if (timestamp === lastTs.current && current_task === lastTask.current) return;
    lastTs.current   = timestamp;
    lastTask.current = current_task;

    const d    = new Date(timestamp);
    const time = isNaN(d) ? "—" : d.toTimeString().slice(0, 8);
    const agent   = (active_agent || "SYSTEM").toUpperCase();
    const message = current_task || (running ? "processing..." : `status: ${status || "idle"}`);
    const type = !running && status === "complete"          ? "success"
               : !running && status?.startsWith("waiting") ? "warning"
               : running                                    ? "info"
               :                                             "info";

    setEntries(prev => [
      ...prev,
      { id: `${timestamp}-${agent}-${message}`, time, agent, message, type },
    ].slice(-60));
  }, [pipelineStatus]);

  return entries;
}

// ─── Pending decisions hook ────────────────────────────────
function usePendingDecisions() {
  const [decisions, setDecisions] = useState([]);

  const fetch_ = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/decisions`);
      const data = await res.json();
      setDecisions(data.decisions || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 10000);
    return () => clearInterval(t);
  }, [fetch_]);

  const resolve = async (id, status, note = "") => {
    try {
      await fetch(`${API}/decisions/${id}/resolve`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status, note }),
      });
      fetch_();
    } catch (_) {}
  };

  return { decisions, resolve, refresh: fetch_ };
}

// ─── Agents status hook ────────────────────────────────────
function useAgentsStatus() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await fetch(`${API}/agents/status`);
        const data = await res.json();
        setAgents(data.agents || []);
      } catch (_) {}
    };
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, []);

  return agents;
}

// ─── Last meeting hook ─────────────────────────────────────
function useLastMeeting() {
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await fetch(`${API}/meeting/last`);
        const data = await res.json();
        setMeeting(data.meeting || null);
      } catch (_) {}
    };
    fetch_();
    const t = setInterval(fetch_, 60000);
    return () => clearInterval(t);
  }, []);

  return meeting;
}

// ─── Chat (now from SnowBrain) ─────────────────────────────
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d) ? "" : d.toTimeString().slice(0, 5);
};

function SnowChat() {
  const [input, setInput]     = useState("");
  const [sending, setSending] = useState(false);
  const { messages, refresh } = useSnowChat();
  const scrollRef             = useRef(null);
  const prevCountRef          = useRef(0);

  // Only scroll to bottom when new messages arrive, not on every poll
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  // Also scroll when the thinking indicator appears
  useEffect(() => {
    if (sending && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sending]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setSending(true);
    setInput("");
    try {
      await fetch(`${API}/telegram?message=${encodeURIComponent(msg)}`);
      // server saves user message synchronously before returning — refresh now to show it immediately
      await refresh();
    } catch (_) {}
    setTimeout(() => setSending(false), 15000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <LoafCat color={C.active} size={20} />
        <span style={{ ...F, fontSize: 11, color: C.active, letterSpacing: 2 }}>DIRECT LINE — SNOW</span>
        <span style={{ ...F, fontSize: 9, color: C.muted, marginLeft: "auto", letterSpacing: 1 }}>
          claude-opus-4.6
        </span>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px",
        display: "flex", flexDirection: "column", gap: 12, background: "#060606" }}>
        {messages.length === 0 && !sending && (
          <div style={{ ...F, fontSize: 10, color: "#223322", textAlign: "center",
            marginTop: 100, letterSpacing: 1 }}>NO MESSAGES YET — SAY SOMETHING TO SNOW</div>
        )}
        {messages.map((m, i) => m.role === "user" ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "flex-end" }}>
            <span style={{ ...F, fontSize: 8, color: "#334433", flexShrink: 0 }}>{fmtTime(m.timestamp)}</span>
            <div>
              <div style={{ ...F, fontSize: 8, color: C.muted, textAlign: "right", marginBottom: 4, letterSpacing: 1 }}>YOU</div>
              <div style={{ ...F, fontSize: 11, color: C.active, background: "#001a0d",
                border: `1px solid ${C.dim}`, borderRadius: "6px 6px 2px 6px",
                padding: "8px 12px", maxWidth: 320, lineHeight: 1.65, wordBreak: "break-word" }}>{m.text}</div>
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0, marginTop: 18 }}><LoafCat color={C.active} size={20} /></div>
            <div>
              <div style={{ ...F, fontSize: 8, color: C.muted, marginBottom: 4, letterSpacing: 1 }}>
                SNOW <span style={{ color: "#334433" }}>{fmtTime(m.timestamp)}</span>
              </div>
              <div style={{ ...F, fontSize: 11, color: C.text, background: "#0a0a0a",
                border: `1px solid ${C.border}`, borderRadius: "6px 6px 6px 2px",
                padding: "9px 13px", maxWidth: 400, lineHeight: 1.75, wordBreak: "break-word",
                boxShadow: C.glow }}>{m.text}</div>
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LoafCat color={C.muted} size={20} />
            <span style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 2,
              animation: "blink 1s step-end infinite" }}>SNOW IS THINKING...</span>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 8, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !sending && send()}
          placeholder="Message Snow..."
          style={{ ...F, flex: 1, background: "#080808", border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "7px 10px", color: C.text, fontSize: 11,
            outline: "none", caretColor: C.active }} />
        <GreenBtn onClick={send} disabled={sending} style={{ padding: "7px 18px", fontSize: 11 }}>
          {sending ? "SENDING..." : "[ SEND ]"}
        </GreenBtn>
      </div>
    </div>
  );
}

// ─── Decision card ─────────────────────────────────────────
function DecisionCard({ decision, onResolve }) {
  const [modifying, setModifying] = useState(false);
  const [note, setNote]           = useState("");

  const typeColor = {
    STRATEGY:  C.purple,
    AUTONOMY:  C.amber,
    PIPELINE:  C.cyan,
    DIRECTIVE: C.active,
  };
  const color = typeColor[decision.decision_type?.toUpperCase()] || C.muted;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
      padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <CategoryBadge category={decision.decision_type?.toUpperCase() || "GENERAL"} />
        <span style={{ ...F, fontSize: 9, color: "#334433", marginLeft: "auto" }}>
          {String(decision.created_at || "").slice(0, 16)}
        </span>
      </div>
      <div style={{ ...F, fontSize: 12, color: C.text, marginBottom: 6, lineHeight: 1.5 }}>
        {decision.description}
      </div>
      <div style={{ ...F, fontSize: 10, color: C.muted, lineHeight: 1.6, marginBottom: 10,
        borderLeft: `2px solid ${color}33`, paddingLeft: 10 }}>
        {decision.recommendation}
      </div>
      {modifying && (
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="Note (optional)..."
          style={{ ...F, width: "100%", marginBottom: 8, background: "#060606",
            border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 10px",
            color: C.text, fontSize: 10, outline: "none", boxSizing: "border-box" }} />
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <GreenBtn onClick={() => onResolve(decision.id, "approved", note)}
          style={{ flex: 1, padding: "6px 0", fontSize: 10, letterSpacing: 1 }}>
          [ APPROVE ]
        </GreenBtn>
        <AmberBtn onClick={() => setModifying(!modifying)}
          style={{ padding: "6px 12px", fontSize: 10, letterSpacing: 1 }}>
          [ MODIFY ]
        </AmberBtn>
        <RedBtn onClick={() => onResolve(decision.id, "rejected", note)}
          style={{ padding: "6px 12px", fontSize: 10, letterSpacing: 1 }}>
          [ REJECT ]
        </RedBtn>
      </div>
    </div>
  );
}

// ─── Agent mini card ───────────────────────────────────────
function AgentMiniCard({ agent, onClick }) {
  const name   = agent.name;
  const runs   = agent.run_count || 0;
  const level  = agent.autonomy_level || 0;
  const trends = agent.trends || {};
  const metrics = agent.metrics || {};

  const lastRun = agent.last_run?.run_date
    ? String(agent.last_run.run_date).slice(0, 10)
    : "never";

  // Determine dot color based on last run recency
  let dotColor = "#334433"; // gray = idle
  if (agent.last_run?.run_date) {
    const runDate = new Date(agent.last_run.run_date);
    const now     = new Date();
    const diffMs  = now - runDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 1)       dotColor = C.active;  // green = ran today
    else if (diffDays < 7)  dotColor = C.amber;   // amber = ran this week
  }

  // Primary metric
  const primaryMetric = Object.entries(metrics).find(([k]) =>
    k === "approval_rate" || k === "completion_rate" || k === "listings_per_run"
  );
  const metricLabel = primaryMetric ? primaryMetric[0] : null;
  const metricValue = primaryMetric ? primaryMetric[1] : null;
  const trendArrow  = metricLabel
    ? ({ up: "↑", down: "↓", stable: "→" }[trends[metricLabel]] || "→")
    : "";

  const CatMap = { Leon: ResearchCat, Riko: DesignCat, Snoopy: ListingCat, Waffle: FeedbackCat };
  const Cat = CatMap[name] || FeedbackCat;

  return (
    <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 6, padding: "14px 14px", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.active + "88"; e.currentTarget.style.boxShadow = C.glow; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Cat color={dotColor} size={26} />
        <div>
          <div style={{ ...F, fontSize: 12, fontWeight: 700, color: C.active, letterSpacing: 1.5 }}>{name.toUpperCase()}</div>
          <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 0.5 }}>{agent.role?.slice(0, 28)}</div>
        </div>
        <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
          background: dotColor, flexShrink: 0, boxShadow: dotColor === C.active ? `0 0 5px ${C.active}` : "none",
          display: "inline-block" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div>
          <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>TOTAL RUNS</div>
          <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.text }}>{runs}</div>
        </div>
        {metricLabel && (
          <div>
            <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 2 }}>
              {metricLabel.toUpperCase()}
            </div>
            <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.text }}>
              {typeof metricValue === "number"
                ? (metricValue < 1.5 ? (metricValue * 100).toFixed(0) + "%" : metricValue.toFixed(1))
                : "—"}
              <span style={{ fontSize: 12, marginLeft: 4, color: trendArrow === "↑" ? C.active : trendArrow === "↓" ? C.danger : C.muted }}>
                {trendArrow}
              </span>
            </div>
          </div>
        )}
      </div>
      <div style={{ ...F, fontSize: 8, color: "#334433", marginTop: 8, letterSpacing: 0.5 }}>
        last: {lastRun} · autonomy: {level}/10
      </div>
    </div>
  );
}

// ─── Overview page (Snow's command center) ─────────────────
function OverviewPage({ setActive, pipelineStatus }) {
  const { decisions, resolve } = usePendingDecisions();
  const agentsStatus           = useAgentsStatus();
  const lastMeeting            = useLastMeeting();
  const [meetingBusy, setMeetingBusy] = useState(false);

  const subAgents = agentsStatus.filter(a => a.name !== "Snow");
  const snowAgent = agentsStatus.find(a => a.name === "Snow");

  const callMeeting = async () => {
    setMeetingBusy(true);
    try {
      await fetch(`${API}/meeting`, { method: "POST" });
    } catch (_) {}
    setTimeout(() => setMeetingBusy(false), 3000);
  };

  // Next Monday countdown
  const nextMondayStr = (() => {
    const now  = new Date();
    const day  = now.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    next.setHours(9, 0, 0, 0);
    const diffMs = next - now;
    const days   = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours  = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return days > 0 ? `in ${days}d ${hours}h` : `in ${hours}h`;
  })();

  const agentPageMap = { Leon: "research", Riko: "design", Snoopy: "listing", Waffle: "feedback" };

  return (
    <div style={{ padding: "24px 26px" }}>

      {/* Snow identity row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
        padding: "16px", background: C.card, border: `1px solid ${C.active}33`,
        borderRadius: 6, boxShadow: C.glow }}>
        <div style={{ width: 56, height: 56, borderRadius: 6, background: "#040804",
          border: `1px solid ${C.active}44`, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, boxShadow: C.glowStrong }}>
          <LoafCat color={C.active} size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ ...F, fontSize: 20, fontWeight: 700, color: C.active, letterSpacing: 3 }}>SNOW</div>
            <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 2 }}>AGENT MANAGER</div>
            <span style={{ ...F, fontSize: 9, color: C.active, background: "#001a0d",
              border: `1px solid ${C.dim}`, borderRadius: 3, padding: "2px 8px", letterSpacing: 1 }}>
              claude-opus-4.6
            </span>
          </div>
          {/* SNOW IS WATCHING */}
          <div style={{ marginTop: 8 }}>
            {pipelineStatus?.running ? (
              <div style={{ ...F, fontSize: 10, color: C.active, letterSpacing: 1.5,
                animation: "pulse 1.4s ease-in-out infinite" }}>
                ❄️ SNOW IS WATCHING {(pipelineStatus.active_agent || "").toUpperCase()} — {pipelineStatus.current_task || "processing..."}
              </div>
            ) : (
              <div style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 1.5 }}>
                ❄️ ALL AGENTS IDLE — AWAITING YOUR SIGNAL
              </div>
            )}
          </div>

        {/* Agent status row */}
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            {subAgents.map(a => {
              let dotColor = "#334433";
              if (a.last_run?.run_date) {
                const diff = (Date.now() - new Date(a.last_run.run_date)) / 86400000;
                dotColor = diff < 1 ? C.active : diff < 7 ? C.amber : "#334433";
              }
              return (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor,
                    display: "inline-block", boxShadow: dotColor === C.active ? `0 0 5px ${C.active}` : "none" }} />
                  <span style={{ ...F, fontSize: 9, color: dotColor === "#334433" ? C.muted : C.text,
                    letterSpacing: 1 }}>{a.name.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>AUTONOMY</div>
          <div style={{ ...F, fontSize: 22, fontWeight: 700, color: C.amber }}>
            {snowAgent?.autonomy_level ?? 5}<span style={{ fontSize: 10, color: C.muted }}>/10</span>
          </div>
        </div>
      </div>

      {/* Pending decisions */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ ...F, fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 2 }}>
            PENDING DECISIONS
          </div>
          {decisions.length > 0 && (
            <span style={{ ...F, fontSize: 10, color: C.danger, background: C.dangerDim,
              border: `1px solid ${C.danger}44`, borderRadius: 3, padding: "1px 8px", letterSpacing: 1 }}>
              {decisions.length}
            </span>
          )}
        </div>
        {decisions.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: "28px", textAlign: "center" }}>
            <div style={{ ...F, fontSize: 11, color: C.muted, letterSpacing: 2 }}>
              NO PENDING DECISIONS — SNOW IS WATCHING
            </div>
          </div>
        ) : (
          decisions.map(d => (
            <DecisionCard key={d.id} decision={d} onResolve={resolve} />
          ))
        )}
      </div>

      {/* Weekly meeting */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Label style={{ margin: 0 }}>WEEKLY MEETING</Label>
          <span style={{ ...F, fontSize: 9, color: C.muted, marginLeft: "auto" }}>Next: Monday 09:00 ({nextMondayStr})</span>
        </div>
        {lastMeeting ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>
              LAST MEETING — {String(lastMeeting.meeting_date || "").slice(0, 10)}
            </div>
            <div style={{ ...F, fontSize: 10, color: C.muted, lineHeight: 1.7, maxHeight: 56, overflow: "hidden" }}>
              {(lastMeeting.summary || "").slice(0, 220)}
            </div>
          </div>
        ) : (
          <div style={{ ...F, fontSize: 10, color: "#223322", marginBottom: 10 }}>No meetings yet</div>
        )}
        <GreenBtn onClick={callMeeting} disabled={meetingBusy}
          style={{ fontSize: 10, letterSpacing: 1 }}>
          {meetingBusy ? "CALLING MEETING..." : "[ CALL MEETING NOW ]"}
        </GreenBtn>
      </div>

      {/* Agent performance cards */}
      <Label style={{ marginBottom: 10 }}>AGENT PERFORMANCE</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
        {subAgents.map(a => (
          <AgentMiniCard key={a.name} agent={a}
            onClick={() => setActive(agentPageMap[a.name] || "overview")} />
        ))}
        {subAgents.length === 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState text="NO AGENT DATA YET — RUN THE PIPELINE" />
          </div>
        )}
      </div>

    </div>
  );
}

function AgentLog({ agentName, entries, isActive }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries, isActive]);

  const relevant = entries.filter(e => e.agent === agentName.toUpperCase()).slice(-5);
  return (
    <div style={{ margin: "0 26px 24px", background: "#050505",
      border: `1px solid ${isActive ? C.active + "44" : C.border}`,
      borderRadius: 6, overflow: "hidden", boxShadow: isActive ? C.glow : "none" }}>
      <div style={{ padding: "5px 12px", borderBottom: `1px solid ${isActive ? C.active + "22" : C.faint}`,
        display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 2 }}>AGENT LOG</span>
        {isActive && <StatusDot state="running" />}
      </div>
      <div ref={scrollRef} style={{ padding: "8px 12px", height: 110, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 1 }}>
        {relevant.length === 0 && !isActive && (
          <span style={{ ...F, fontSize: 10, color: "#2a3a2a" }}>No activity this session.</span>
        )}
        {relevant.map(entry => (
          <div key={entry.id} style={{ ...F, fontSize: 10, color: C.active, lineHeight: 1.7 }}>
            <span style={{ color: "#334433" }}>[{entry.time}]</span>
            <span style={{ marginLeft: 7, color: C.active }}>{entry.message}</span>
          </div>
        ))}
        {isActive && (
          <div style={{ ...F, fontSize: 10, color: C.active, lineHeight: 1.7 }}>
            processing<span style={{ animation: "blink 1s step-end infinite" }}>_</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Review page — Leon + Riko packages ───────────────────
function ReviewPage({ packages, reviewPackage, activeAgent, runStep2, entries }) {
  const [expanded, setExpanded] = useState(null);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const isActive = activeAgent === "Leon" || activeAgent === "Riko";

  const handleReview = async (pkg, status) => {
    await reviewPackage(pkg.id, status, {
      title:   pkg.title,
      niche:   pkg.niche,
      keyword: pkg.keyword,
    });
    setSessionReviewed(n => n + 1);
  };

  return (
    <div>
      <AgentPageHeader CatComp={ReviewCat} name="REVIEW" sub="Human approval — Leon + Riko packages" state={isActive ? "running" : packages.length > 0 ? "waiting" : "idle"} />
      <TermLine text={`${packages.length} package${packages.length !== 1 ? "s" : ""} awaiting your decision`}
        color={packages.length > 0 ? C.amber : C.muted} />
      <div style={{ padding: "20px 26px" }}>
        {packages.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "36px 24px", textAlign: "center" }}>
            {sessionReviewed > 0 ? (
              <>
                <div style={{ ...F, fontSize: 12, color: C.active, letterSpacing: 2, marginBottom: 12 }}>
                  ALL PACKAGES REVIEWED
                </div>
                <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 20, letterSpacing: 1 }}>
                  {sessionReviewed} package{sessionReviewed !== 1 ? "s" : ""} decided — approved packages are being sent to strategy review.
                </div>
                <GreenBtn onClick={runStep2} style={{ fontSize: 11, letterSpacing: 1 }}>
                  [ RUN STRATEGY REVIEW ]
                </GreenBtn>
              </>
            ) : (
              <EmptyState text="NO PACKAGES READY — RUN THE PIPELINE FIRST" />
            )}
          </div>
        ) : (
          <>
            <Label>PACKAGES AWAITING REVIEW ({packages.length})</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {packages.map(pkg => (
                <div key={pkg.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0 }}>
                    {/* Image */}
                    <div style={{ position: "relative", background: "#050505", minHeight: 280 }}>
                      {pkg.image_url ? (
                        <>
                          <img src={pkg.image_url} alt={pkg.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                            onClick={() => setExpanded(expanded === pkg.id ? null : pkg.id)} />
                          <button onClick={() => setExpanded(expanded === pkg.id ? null : pkg.id)} style={{
                            position: "absolute", top: 6, right: 6, ...F, fontSize: 9, color: C.text,
                            background: "rgba(0,0,0,0.75)", border: `1px solid ${C.border}`, borderRadius: 3,
                            padding: "3px 8px", cursor: "pointer", letterSpacing: 1 }}>[ EXPAND ]</button>
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          <span style={{ ...F, fontSize: 9, color: C.muted }}>NO IMAGE</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ ...F, fontSize: 14, color: C.text, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>{pkg.title}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px 12px", marginBottom: 14 }}>
                          <span style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1 }}>NICHE</span>
                          <span style={{ ...F, fontSize: 10, color: C.text }}>{pkg.niche}</span>
                          <span style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1 }}>KEYWORD</span>
                          <span style={{ ...F, fontSize: 10, color: C.active }}>{pkg.keyword}</span>
                          <span style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1 }}>WHY</span>
                          <span style={{ ...F, fontSize: 10, color: C.muted, lineHeight: 1.6 }}>{pkg.why_it_sells}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <GreenBtn onClick={() => handleReview(pkg, "strategy_review")}
                          style={{ flex: 1, padding: "8px 0", fontSize: 11, letterSpacing: 1 }}>
                          [ APPROVE ]
                        </GreenBtn>
                        <RedBtn onClick={() => handleReview(pkg, "rejected")}
                          style={{ flex: 1, padding: "8px 0", fontSize: 11, letterSpacing: 1 }}>
                          [ REJECT ]
                        </RedBtn>
                      </div>
                    </div>
                  </div>
                  {/* Fullscreen expand */}
                  {expanded === pkg.id && pkg.image_url && (
                    <div onClick={() => setExpanded(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)",
                      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
                      <img src={pkg.image_url} alt={pkg.title}
                        style={{ maxHeight: "90vh", maxWidth: "70vw", objectFit: "contain" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <AgentLog agentName="Leon" entries={entries} isActive={isActive} />
    </div>
  );
}

// ─── Agent history page (Leon / Riko) ─────────────────────
function AgentHistoryPage({ name, role, Cat, entries, activeAgent }) {
  const agentsStatus = useAgentsStatus();
  const agent        = agentsStatus.find(a => a.name === name);
  const isActive     = activeAgent === name;
  const state        = isActive ? "running" : "idle";

  return (
    <div>
      <AgentPageHeader CatComp={Cat} name={name} sub={role} state={state} />
      <TermLine text={isActive ? `${name} is currently running` : "Idle — metrics from last run"}
        color={isActive ? C.active : C.muted} />
      <div style={{ padding: "20px 26px" }}>
        {agent ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px" }}>
              <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>TOTAL RUNS</div>
              <div style={{ ...F, fontSize: 28, fontWeight: 700, color: C.text }}>{agent.run_count || 0}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px" }}>
              <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>AUTONOMY</div>
              <div style={{ ...F, fontSize: 28, fontWeight: 700, color: C.amber }}>
                {agent.autonomy_level || 0}<span style={{ fontSize: 12, color: C.muted }}>/10</span>
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px" }}>
              <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>LAST RUN</div>
              <div style={{ ...F, fontSize: 14, color: C.text }}>
                {agent.last_run?.run_date ? String(agent.last_run.run_date).slice(0, 10) : "never"}
              </div>
            </div>
            {Object.entries(agent.metrics || {}).map(([k, v]) => (
              <div key={k} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px" }}>
                <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 }}>{k.toUpperCase()}</div>
                <div style={{ ...F, fontSize: 24, fontWeight: 700, color: C.text }}>
                  {v != null ? (v < 1.5 ? (v * 100).toFixed(0) + "%" : v.toFixed(1)) : "—"}
                  <span style={{ fontSize: 12, marginLeft: 6, color: { up: C.active, down: C.danger, stable: C.muted }[agent.trends?.[k]] || C.muted }}>
                    {{ up: "↑", down: "↓", stable: "→" }[agent.trends?.[k]] || "→"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text={`NO DATA YET FOR ${name} — RUN THE PIPELINE`} />
        )}
      </div>
      <AgentLog agentName={name} entries={entries} isActive={isActive} />
    </div>
  );
}

// ─── Listing / Snoopy page ─────────────────────────────────
function ListingPage({ listings, activeAgent, onSelect, entries }) {
  const state = activeAgent === "Snoopy" ? "running" : listings.length > 0 ? "waiting" : "idle";
  return (
    <div>
      <AgentPageHeader CatComp={ListingCat} name="SNOOPY" sub="claude-haiku-4.5 — SEO & Listing Copywriter" state={state}
        rightSlot={
          <GhostBtn onClick={() => deleteByStatus(["ready_to_upload"])} style={{ fontSize: 10, letterSpacing: 1 }}>
            [ CLEAR UPLOADED ]
          </GhostBtn>
        }
      />
      <TermLine text={`${listings.length} listing${listings.length !== 1 ? "s" : ""} ready to upload`}
        color={state === "running" ? C.active : C.muted} />
      <div style={{ padding: "20px 26px" }}>
        {listings.length === 0
          ? <EmptyState text="NO LISTINGS READY — APPROVE DESIGNS FIRST" />
          : (
            <>
              <Label>READY TO UPLOAD ({listings.length})</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                {listings.map(l => (
                  <div key={l.id} onClick={() => onSelect(l)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.active; e.currentTarget.style.boxShadow = C.glow; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                    {l.image_url && (
                      <div style={{ position: "relative" }}>
                        <img src={l.image_url} alt={l.title} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", bottom: 6, left: 8 }}>
                          <span style={{ ...F, fontSize: 13, fontWeight: 700, color: C.active, background: "rgba(0,0,0,0.8)",
                            padding: "2px 7px", borderRadius: 3, letterSpacing: 1 }}>{l.price}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ ...F, fontSize: 10, color: C.text, marginBottom: 5, lineHeight: 1.4 }}>
                        {l.title?.slice(0, 56)}{l.title?.length > 56 ? "…" : ""}
                      </div>
                      <div style={{ ...F, fontSize: 9, color: C.muted, marginBottom: 8 }}>
                        {l.tags?.split(",").length || 0} tags
                      </div>
                      <GreenBtn onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "6px 0", fontSize: 10 }}>
                        [ POST TO ETSY ]
                      </GreenBtn>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </div>
      <AgentLog agentName="Snoopy" entries={entries} isActive={state === "running"} />
    </div>
  );
}

// ─── Strategy placeholder ──────────────────────────────────
function StrategyPage() {
  return (
    <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ opacity: 0.2, marginBottom: 20 }}><ListingCat color={C.active} size={60} /></div>
      <div style={{ ...F, fontSize: 18, color: C.muted, letterSpacing: 4, marginBottom: 10 }}>COMING SOON</div>
      <div style={{ ...F, fontSize: 11, color: "#334433", letterSpacing: 1, textAlign: "center", maxWidth: 320, lineHeight: 1.8 }}>
        The Strategy Agent will analyze market trends and competitor data to suggest long-term positioning.
      </div>
    </div>
  );
}

// ─── Feedback / Waffle page ────────────────────────────────
function FeedbackPage({ entries }) {
  return (
    <div>
      <AgentPageHeader CatComp={FeedbackCat} name="WAFFLE" sub="Performance Tracker — coming soon" state="idle" />
      <TermLine text="No active tracking — 0 listings monitored" />
      <div style={{ padding: "20px 26px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ ...F, fontSize: 10, color: C.muted }}>
            Next recap in <span style={{ color: C.text }}>6 days</span>
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "60px 24px", textAlign: "center" }}>
          <div style={{ ...F, fontSize: 14, color: "#334433", letterSpacing: 3 }}>NO DATA YET</div>
          <div style={{ ...F, fontSize: 10, color: "#222", marginTop: 8, letterSpacing: 1 }}>
            Requires active Etsy listings to populate charts
          </div>
        </div>
      </div>
      <AgentLog agentName="Waffle" entries={entries} isActive={false} />
    </div>
  );
}

// ─── Pipeline Logs ─────────────────────────────────────────
function LogsPage({ logs }) {
  const statusColor = (s) => {
    if (s === "success") return { color: C.active, bg: "#001a0d", border: C.dim };
    if (s === "failed")  return { color: C.danger, bg: C.dangerDim, border: "#330000" };
    return { color: C.amber, bg: "#1a1000", border: "#332200" };
  };
  return (
    <div style={{ padding: "24px 26px" }}>
      <div style={{ ...F, fontSize: 14, color: C.active, letterSpacing: 2, marginBottom: 4 }}>PIPELINE LOGS</div>
      <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 20 }}>All runs — newest first</div>
      {logs.length === 0 ? <EmptyState text="NO RUNS RECORDED YET" /> : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr 0.7fr 0.7fr 0.9fr",
            padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
            {["DATE", "DURATION", "PROPS", "DESIGNS", "LISTINGS", "STATUS"].map(h => (
              <div key={h} style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{h}</div>
            ))}
          </div>
          {logs.map((log, i) => {
            const s = statusColor(log.status);
            return (
              <div key={log.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.7fr 0.7fr 0.7fr 0.9fr",
                padding: "10px 16px", borderBottom: i < logs.length - 1 ? `1px solid ${C.faint}` : "none",
                alignItems: "center" }}>
                <div style={{ ...F, fontSize: 11, color: C.text }}>{log.date}</div>
                <div style={{ ...F, fontSize: 11, color: C.muted }}>{log.duration || "—"}</div>
                <div style={{ ...F, fontSize: 11, color: C.muted }}>{log.proposals}</div>
                <div style={{ ...F, fontSize: 11, color: C.muted }}>{log.designs}</div>
                <div style={{ ...F, fontSize: 11, color: C.muted }}>{log.listings}</div>
                <span style={{ ...F, fontSize: 8, padding: "2px 7px", borderRadius: 3, letterSpacing: 1,
                  textTransform: "uppercase", display: "inline-block",
                  color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>{log.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Snow Memory page ─────────────────────────────────────
function MemoryPage({ memory }) {
  const [filter, setFilter] = useState("all");
  const cats  = ["all", ...Array.from(new Set(memory.map(m => m.category)))];
  const shown = filter === "all" ? memory : memory.filter(m => m.category === filter);
  return (
    <div style={{ padding: "24px 26px" }}>
      <div style={{ ...F, fontSize: 14, color: C.active, letterSpacing: 2, marginBottom: 4 }}>SNOW MEMORY</div>
      <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 20 }}>Observations across all pipeline runs</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            ...F, fontSize: 9, padding: "4px 12px", borderRadius: 4, cursor: "pointer",
            letterSpacing: 1, textTransform: "uppercase",
            background: filter === cat ? "#001a0d" : C.card,
            color: filter === cat ? C.active : C.muted,
            border: `1px solid ${filter === cat ? C.active : C.border}`,
            boxShadow: filter === cat ? C.glow : "none",
          }}>{cat}</button>
        ))}
      </div>
      {shown.length === 0 ? <EmptyState text="NO ENTRIES" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shown.map(m => (
            <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: "11px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <CategoryBadge category={m.category} />
              <div style={{ ...F, fontSize: 11, color: C.muted, flex: 1, lineHeight: 1.6 }}>{m.observation}</div>
              <div style={{ ...F, fontSize: 9, color: "#333", whiteSpace: "nowrap" }}>{m.created_at?.slice(0, 10) || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────────
function ListingModal({ listing, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.active}`,
        borderRadius: 6, overflow: "hidden", maxWidth: 640, width: "92%", cursor: "default",
        display: "grid", gridTemplateColumns: "1fr 1fr", boxShadow: C.glowStrong }}>
        {listing.image_url && (
          <img src={listing.image_url} alt={listing.title}
            style={{ width: "100%", height: "100%", minHeight: 320, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: "20px 18px", overflowY: "auto", maxHeight: 480 }}>
          <div style={{ ...F, fontSize: 13, color: C.text, marginBottom: 6, lineHeight: 1.4 }}>{listing.title}</div>
          <div style={{ ...F, fontSize: 18, fontWeight: 700, color: C.active, marginBottom: 14, letterSpacing: 1 }}>{listing.price}</div>
          <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>DESCRIPTION</div>
          <div style={{ ...F, fontSize: 10, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
            {listing.description?.slice(0, 300)}{listing.description?.length > 300 ? "…" : ""}
          </div>
          <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>TAGS</div>
          <div style={{ ...F, fontSize: 9, color: "#334433", lineHeight: 2, marginBottom: 16 }}>{listing.tags}</div>
          <GreenBtn style={{ width: "100%", padding: "9px 0", fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>[ POST TO ETSY ]</GreenBtn>
          <GhostBtn onClick={onClose} style={{ width: "100%", padding: "8px 0", fontSize: 11, letterSpacing: 1 }}>[ CLOSE ]</GhostBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Lock screen ───────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);
  const inputRef          = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const attempt = () => {
    const correct = process.env.REACT_APP_DASHBOARD_PASSWORD;
    if (pw === correct) {
      localStorage.setItem("projectsnow_unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setPw("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...F }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.012) 3px, rgba(0,255,136,0.012) 4px)" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 28, filter: "drop-shadow(0 0 18px #00ff8866)", animation: "floatCat 4s ease-in-out infinite" }}>
          <LoafCat color={C.active} size={72} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.active, letterSpacing: 4, marginBottom: 6 }}>PROJECTSNOW</div>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 40 }}>AGENT OPS v2.0</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input ref={inputRef} type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && attempt()}
            placeholder="password"
            style={{ ...F, background: "#050505", border: `1px solid ${error ? C.danger : C.active}`,
              borderRadius: 4, padding: "8px 14px", color: C.text, fontSize: 12,
              width: 220, outline: "none", caretColor: C.active, letterSpacing: 2,
              boxShadow: error ? `0 0 10px ${C.danger}44` : `0 0 10px ${C.active}22` }} />
          <button onClick={attempt} style={{ ...F, background: "transparent", color: C.active,
            border: `1px solid ${C.active}`, borderRadius: 4, padding: "8px 18px",
            fontSize: 11, cursor: "pointer", letterSpacing: 1.5 }}>[ ENTER ]</button>
        </div>
        <div style={{ marginTop: 16, ...F, fontSize: 11, letterSpacing: 2, color: C.danger,
          height: 18, opacity: error ? 1 : 0 }}>ACCESS DENIED</div>
      </div>
      <style>{`@keyframes floatCat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }`}</style>
    </div>
  );
}

// ─── Page titles ───────────────────────────────────────────
const PAGE_TITLES = {
  overview: "SNOW — AGENT MANAGER",
  review:   "REVIEW — LEON + RIKO PACKAGES",
  research: "LEON — RESEARCH",
  design:   "RIKO — DESIGN",
  strategy: "STRATEGY",
  listing:  "SNOOPY — LISTING",
  feedback: "WAFFLE — FEEDBACK",
  logs:     "PIPELINE LOGS",
  memory:   "SNOW MEMORY",
};

// ─── Root ──────────────────────────────────────────────────
export default function Dashboard() {
  const [unlocked, setUnlocked] = useState(
    () => !!localStorage.getItem("projectsnow_unlocked")
  );

  const { packages, review: reviewPackage } = usePackages();
  const { listings } = useReadyListings();
  const { status: pipelineStatus } = usePipelineStatus();
  const { logs } = usePipelineLogs();
  const { memory } = useSnowMemory();

  const [activePage, setActivePage]         = useState("overview");
  const [keywords, setKeywords]             = useState("");
  const [launching, setLaunching]           = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const activeAgent = pipelineStatus?.active_agent;
  const isRunning   = pipelineStatus?.running;
  const pipelineStep = pipelineStatus?.status;

  const activityEntries = useActivityLog(pipelineStatus, logs);

  // Map pipeline agent names to sidebar page ids
  const agentNameToPage = {
    "Leon": "research", "Riko": "design",
    "Snoopy": "listing", "Waffle": "feedback",
    "Research Agent": "research", "Design Agent": "design",
    "Listing Agent": "listing", "Feedback Agent": "feedback",
  };
  const agentStates = Object.fromEntries(
    Object.keys(PAGE_TITLES).map(id => {
      const agentName = Object.keys(agentNameToPage).find(k => agentNameToPage[k] === id);
      const running = agentName && activeAgent === agentName && isRunning;
      return [id, running ? "running" : "idle"];
    })
  );
  if (isRunning) agentStates.overview = "running";

  const counts = {
    review:  packages.length,
    listing: listings.length,
  };

  const callEndpoint = async (url) => {
    setLaunching(true);
    try { await fetch(url, { method: "POST" }); } catch (_) {}
    setTimeout(() => setLaunching(false), 2000);
  };

  const launch   = () => callEndpoint(`${API}/launch?keywords=${encodeURIComponent(keywords)}`);
  const runStep2 = () => callEndpoint(`${API}/step2`);
  const runStep3 = () => callEndpoint(`${API}/step3`);
  const stopPipeline  = async () => { try { await fetch(`${API}/stop`,  { method: "POST" }); } catch (_) {} };
  const resetPipeline = async () => { try { await fetch(`${API}/reset`, { method: "POST" }); } catch (_) {} };
  const fullReset = async () => {
    if (!window.confirm("Delete ALL Airtable records and reset the pipeline?")) return;
    try { await fetch(`${API}/reset/airtable`, { method: "POST" }); } catch (_) {}
  };

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, overflow: "hidden" }}>
      <Sidebar active={activePage} setActive={setActivePage} agentStates={agentStates} counts={counts} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Header */}
        <div style={{ height: 48, borderBottom: `1px solid ${C.border}`, display: "flex",
          alignItems: "center", gap: 14, padding: "0 20px", flexShrink: 0, background: C.bg }}>
          <span style={{ ...F, fontSize: 12, color: C.active, letterSpacing: 2, minWidth: 200 }}>
            {PAGE_TITLES[activePage] || "OVERVIEW"}
          </span>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !isRunning && !launching && launch()}
            placeholder="keywords for snow..."
            style={{ ...F, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4,
              padding: "5px 10px", color: C.text, fontSize: 10, width: 200, outline: "none",
              caretColor: C.active }}
            onFocus={e => e.target.style.borderColor = C.active}
            onBlur={e => e.target.style.borderColor = C.border}
          />
          {isRunning ? (
            <RedBtn onClick={stopPipeline} style={{ fontSize: 11, letterSpacing: 1,
              animation: "pulse 1.4s ease-in-out infinite" }}>
              [ STOP ]
            </RedBtn>
          ) : launching ? (
            <GhostBtn disabled style={{ fontSize: 11, letterSpacing: 1, color: C.muted }}>LAUNCHING...</GhostBtn>
          ) : pipelineStep === "waiting_review" ? (
            <button onClick={() => setActivePage("review")} style={{ ...F, fontSize: 11, letterSpacing: 1, cursor: "pointer",
              background: "transparent", color: C.amber, border: `1px solid ${C.amber}88`,
              borderRadius: 4, padding: "5px 14px" }}>[ APPROVE PACKAGES ]</button>
          ) : pipelineStep === "waiting_listing" ? (
            <button onClick={runStep3} style={{ ...F, fontSize: 11, letterSpacing: 1, cursor: "pointer",
              background: "transparent", color: C.cyan, border: `1px solid ${C.cyan}88`,
              borderRadius: 4, padding: "5px 14px" }}>[ RUN SNOOPY ]</button>
          ) : (
            <GreenBtn onClick={launch} style={{ fontSize: 11, letterSpacing: 1 }}>[ GO WORK ]</GreenBtn>
          )}
          <GhostBtn onClick={resetPipeline} style={{ fontSize: 11, letterSpacing: 1 }}>[ RESET ]</GhostBtn>
          <RedBtn onClick={fullReset} style={{ fontSize: 11, letterSpacing: 1 }}>[ FULL RESET ]</RedBtn>
          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot state="running" />
              <span style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1 }}>{activeAgent}</span>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {[["Listings", listings.length], ["Views", 0], ["Sales", 0]].map(([label, val]) => (
            <div key={label} style={{ textAlign: "right", paddingLeft: 16, borderLeft: `1px solid ${C.border}` }}>
              <div style={{ ...F, fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1 }}>{val}</div>
              <div style={{ ...F, fontSize: 8, color: C.muted, marginTop: 2, letterSpacing: 1 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Status banners */}
        {!isRunning && pipelineStep === "waiting_review" && (
          <div style={{ padding: "7px 20px", background: "#1a1200", borderBottom: `1px solid ${C.amber}44`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}
            onClick={() => setActivePage("review")}>
            <StatusDot state="waiting" />
            <span style={{ ...F, fontSize: 10, color: C.amber, letterSpacing: 1.5 }}>
              {packages.length} PACKAGE{packages.length !== 1 ? "S" : ""} WAITING FOR YOUR REVIEW — CLICK TO REVIEW
            </span>
          </div>
        )}
        {!isRunning && pipelineStep === "waiting_listing" && (
          <div style={{ padding: "7px 20px", background: "#001a1f", borderBottom: `1px solid ${C.cyan}44`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot state="running" />
            <span style={{ ...F, fontSize: 10, color: C.cyan, letterSpacing: 1.5 }}>
              PACKAGES APPROVED — CLICK [ RUN SNOOPY ] TO WRITE LISTINGS
            </span>
          </div>
        )}
        {!isRunning && pipelineStep === "complete" && (
          <div style={{ padding: "7px 20px", background: "#001a0d", borderBottom: `1px solid ${C.active}44`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot state="running" />
            <span style={{ ...F, fontSize: 10, color: C.active, letterSpacing: 1.5 }}>
              PIPELINE COMPLETE — CHECK SNOOPY'S LISTINGS
            </span>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activePage === "overview"  && <OverviewPage setActive={setActivePage} pipelineStatus={pipelineStatus} />}
          {activePage === "review"    && <ReviewPage packages={packages} reviewPackage={reviewPackage} activeAgent={activeAgent} runStep2={runStep2} entries={activityEntries} />}
          {activePage === "research"  && <AgentHistoryPage name="LEON" role="Market Research Specialist" Cat={ResearchCat} entries={activityEntries} activeAgent={activeAgent} />}
          {activePage === "design"    && <AgentHistoryPage name="RIKO" role="Visual Design Specialist"    Cat={DesignCat}    entries={activityEntries} activeAgent={activeAgent} />}
          {activePage === "strategy"  && <StrategyPage />}
          {activePage === "listing"   && <ListingPage listings={listings} activeAgent={activeAgent} onSelect={setSelectedListing} entries={activityEntries} />}
          {activePage === "feedback"  && <FeedbackPage entries={activityEntries} />}
          {activePage === "logs"      && <LogsPage logs={logs} />}
          {activePage === "memory"    && <MemoryPage memory={memory} />}
        </div>
      </div>

      {/* Right column — Snow chat, always visible */}
      <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${C.border}`,
        height: "100vh", display: "flex", flexDirection: "column" }}>
        <SnowChat />
      </div>

      {selectedListing && <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.012) 3px, rgba(0,255,136,0.012) 4px);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        input::placeholder { color: #334433; }
        button:focus { outline: none; }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes termEntry { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatCat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
}
