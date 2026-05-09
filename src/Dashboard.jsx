import { useState, useEffect, useRef } from "react";
import {
  useProposals, useDesigns, useReadyListings,
  useSnowReport, usePipelineStatus, usePipelineLogs, useSnowMemory
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
  dim:         "#00ff8833",
  glow:        "0 0 8px #00ff8844",
  glowStrong:  "0 0 14px #00ff8866",
};
const F = { fontFamily: "'Courier New', Courier, monospace" };

// ─── Airtable delete helpers (not in useAirtable.js) ─────
const BASE_ID = "appsS6oYAVqgJhe7H";
const TABLE_ID = "tblIyWuFysf5Hxu8u";
const atHeaders = () => ({ Authorization: `Bearer ${process.env.REACT_APP_AIRTABLE_API_KEY}` });

async function deleteByStatus(statuses, onDone) {
  const formula = encodeURIComponent(`OR(${statuses.map(s => `{status}="${s}"`).join(",")})`);
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${formula}`,
    { headers: atHeaders() }
  );
  const data = await res.json();
  const ids = (data.records || []).map(r => r.id);
  if (ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const params = chunk.map(id => `records[]=${id}`).join("&");
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`, {
      method: "DELETE", headers: atHeaders(),
    });
  }
  onDone?.();
}

// ─── Cat SVGs — simple filled silhouette, no outlines ────
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
    <circle cx="17.8" cy="19.2" r="1.1" fill="rgba(255,255,255,0.5)" />
    <circle cx="27.8" cy="19.2" r="1.1" fill="rgba(255,255,255,0.5)" />
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

const FeedbackCat = ({ color = "#00aa55", size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 42 48" fill="none">
    <ellipse cx="21" cy="36" rx="14" ry="11" fill={color} />
    <ellipse cx="21" cy="20" rx="13" ry="13" fill={color} />
    <polygon points="11,10 9,2 16,9" fill={color} />
    <polygon points="31,10 33,2 26,9" fill={color} />
    <circle cx="16.5" cy="19" r="3.2" fill={C.bg} />
    <circle cx="25.5" cy="19" r="3.2" fill={C.bg} />
    <circle cx="17.3" cy="18" r="1.3" fill="rgba(255,255,255,0.55)" />
    <circle cx="26.3" cy="18" r="1.3" fill="rgba(255,255,255,0.55)" />
  </svg>
);

// ─── Base UI atoms ────────────────────────────────────────
const GreenBtn = ({ children, onClick, style: ex = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...F, background: "transparent", color: C.active, border: `1px solid ${C.active}`,
    borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: disabled ? "default" : "pointer",
    letterSpacing: 1, transition: "all 0.15s", opacity: disabled ? 0.4 : 1,
    ...ex,
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

const GhostBtn = ({ children, onClick, style: ex = {} }) => (
  <button onClick={onClick} style={{
    ...F, background: "transparent", color: C.muted, border: `1px solid #333`,
    borderRadius: 4, padding: "5px 14px", fontSize: 11, cursor: "pointer",
    letterSpacing: 1, ...ex,
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
    approved: { color: C.active, bg: "#001a0d", border: C.dim },
    rejected: { color: "#aa3333", bg: C.dangerDim, border: "#330000" },
    trend:    { color: C.cyan, bg: "#001a22", border: "#003344" },
    avoid:    { color: C.amber, bg: "#1a1000", border: "#332200" },
    general:  { color: C.muted, bg: C.faint, border: "#222" },
  };
  const s = map[category] || map.general;
  return (
    <span style={{ ...F, fontSize: 8, padding: "2px 7px", borderRadius: 3, letterSpacing: 0.8,
      textTransform: "uppercase", color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      flexShrink: 0, whiteSpace: "nowrap" }}>{category}</span>
  );
};

// ─── Sidebar ──────────────────────────────────────────────
const NAV = [
  { id: "overview",  label: "OVERVIEW",  sub: "Snow's command center",  Cat: LoafCat },
  { id: "research",  label: "RESEARCH",  sub: "Etsy trend scanner",     Cat: ResearchCat },
  { id: "design",    label: "DESIGN",    sub: "Image generator",        Cat: DesignCat },
  { id: "strategy",  label: "STRATEGY",  sub: "Coming soon",            Cat: ListingCat, disabled: true },
  { id: "listing",   label: "LISTING",   sub: "SEO & Etsy uploader",    Cat: ListingCat },
  { id: "feedback",  label: "FEEDBACK",  sub: "Performance tracker",    Cat: FeedbackCat },
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

      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <LoafCat color={C.active} size={30} />
          <div>
            <div style={{ ...F, fontSize: 14, fontWeight: 700, color: C.active, letterSpacing: 2 }}>PROJECTSNOW</div>
            <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1.5 }}>AGENT OPS v0.1</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding: "10px 10px 4px" }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          const state = agentStates[item.id] || "idle";
          const count = counts[item.id] || 0;
          return (
            <button key={item.id} onClick={() => !item.disabled && setActive(item.id)} disabled={item.disabled}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                background: isActive ? "#0d150d" : C.card,
                border: isActive ? `1px solid ${C.active}` : `1px solid ${C.border}`,
                borderLeft: isActive ? `3px solid ${C.active}` : `3px solid transparent`,
                borderRadius: 4, padding: "10px 10px", marginBottom: 5, cursor: item.disabled ? "default" : "pointer",
                opacity: item.disabled ? 0.3 : 1,
                boxShadow: isActive ? C.glow : "none",
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

// ─── Page-level agent header ──────────────────────────────
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

// ─── Activity log hook ────────────────────────────────────
// Accumulates pipeline events from polling + seeds from Airtable run history
function useActivityLog(pipelineStatus, logs) {
  const [entries, setEntries] = useState([]);
  const lastTs   = useRef(null);
  const lastTask = useRef(null);
  const seeded   = useRef(false);

  // Seed from PipelineLogs once
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

  // Append whenever pipelineStatus changes meaningfully
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

// ─── System log terminal (Overview) ──────────────────────
function SystemLog({ entries }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries]);

  const lineColor = (type) => {
    if (type === "success") return C.active;
    if (type === "error")   return C.danger;
    if (type === "warning") return C.amber;
    return C.cyan;
  };

  const shown = entries.slice(-10);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
      overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "7px 14px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...F, fontSize: 9, color: C.active, letterSpacing: 2 }}>SYSTEM LOG</span>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.active,
          display: "inline-block", animation: "pulse 1.4s ease-in-out infinite",
          boxShadow: `0 0 5px ${C.active}` }} />
      </div>
      <div ref={scrollRef} style={{ background: "#050505", padding: "10px 14px", height: 190,
        overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
        {shown.length === 0 && (
          <span style={{ ...F, fontSize: 10, color: C.muted }}>Waiting for pipeline activity...</span>
        )}
        {shown.map(entry => (
          <div key={entry.id} style={{ ...F, fontSize: 10, lineHeight: 1.8,
            animation: "termEntry 0.2s ease forwards" }}>
            <span style={{ color: "#334433" }}>[{entry.time}]</span>
            <span style={{ color: C.active, margin: "0 7px" }}>{entry.agent}</span>
            <span style={{ color: "#223322" }}>—</span>
            <span style={{ marginLeft: 7, color: lineColor(entry.type) }}>{entry.message}</span>
          </div>
        ))}
        <div style={{ ...F, fontSize: 10, color: C.active, animation: "blink 1.1s step-end infinite",
          marginTop: 2, lineHeight: 1 }}>_</div>
      </div>
    </div>
  );
}

// ─── Agent log terminal (per-agent pages) ─────────────────
function AgentLog({ agentName, entries, isActive }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries, isActive]);

  const relevant = entries
    .filter(e => e.agent === agentName.toUpperCase())
    .slice(-5);

  return (
    <div style={{ margin: "0 26px 24px", background: "#050505",
      border: `1px solid ${isActive ? C.active + "44" : C.border}`,
      borderRadius: 6, overflow: "hidden",
      boxShadow: isActive ? C.glow : "none", transition: "border-color 0.3s" }}>
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
          <div key={entry.id} style={{ ...F, fontSize: 10, color: C.active,
            lineHeight: 1.7, animation: "termEntry 0.2s ease forwards" }}>
            <span style={{ color: "#334433" }}>[{entry.time}]</span>
            <span style={{ marginLeft: 7, color: C.active }}>{entry.message}</span>
          </div>
        ))}
        {isActive && (
          <div style={{ ...F, fontSize: 10, color: C.active, lineHeight: 1.7 }}>
            processing
            <span style={{ animation: "blink 1s step-end infinite" }}>_</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview page ────────────────────────────────────────
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d) ? "" : d.toTimeString().slice(0, 5);
};

function SnowChat() {
  const [input, setInput]   = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending]   = useState(false);
  const scrollRef = useRef(null);

  // Poll /messages every 3 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch("http://localhost:8000/messages");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (_) {}
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll to bottom on new messages or thinking state
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setSending(true);
    setInput("");
    try {
      await fetch(`http://localhost:8000/telegram?message=${encodeURIComponent(msg)}`);
    } catch (_) {}
    // Keep sending=true until the next poll brings Snow's reply
    setTimeout(() => setSending(false), 15000);
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8 }}>
        <LoafCat color={C.active} size={20} />
        <span style={{ ...F, fontSize: 11, color: C.active, letterSpacing: 2 }}>DIRECT LINE — SNOW</span>
        <span style={{ ...F, fontSize: 9, color: C.muted, marginLeft: "auto", letterSpacing: 1 }}>
          claude-opus-4.6
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        height: 320, overflowY: "auto", padding: "14px 14px 8px",
        display: "flex", flexDirection: "column", gap: 12,
        background: "#060606",
      }}>
        {messages.length === 0 && !sending && (
          <div style={{ ...F, fontSize: 10, color: "#223322", textAlign: "center",
            marginTop: 100, letterSpacing: 1 }}>
            NO MESSAGES YET — SAY SOMETHING TO SNOW
          </div>
        )}

        {messages.map((m, i) => m.role === "user" ? (
          /* User bubble — right */
          <div key={i} style={{ display: "flex", justifyContent: "flex-end",
            gap: 8, alignItems: "flex-end" }}>
            <span style={{ ...F, fontSize: 8, color: "#334433", flexShrink: 0 }}>
              {fmtTime(m.timestamp)}
            </span>
            <div>
              <div style={{ ...F, fontSize: 8, color: C.muted, textAlign: "right",
                marginBottom: 4, letterSpacing: 1 }}>YOU</div>
              <div style={{
                ...F, fontSize: 11, color: C.active,
                background: "#001a0d", border: `1px solid ${C.dim}`,
                borderRadius: "6px 6px 2px 6px",
                padding: "8px 12px", maxWidth: 320, lineHeight: 1.65,
                wordBreak: "break-word",
              }}>{m.text}</div>
            </div>
          </div>
        ) : (
          /* Snow bubble — left */
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0, marginTop: 18 }}>
              <LoafCat color={C.active} size={20} />
            </div>
            <div>
              <div style={{ ...F, fontSize: 8, color: C.muted, marginBottom: 4, letterSpacing: 1 }}>
                SNOW <span style={{ color: "#334433" }}>{fmtTime(m.timestamp)}</span>
              </div>
              <div style={{
                ...F, fontSize: 11, color: C.text,
                background: "#0a0a0a", border: `1px solid ${C.border}`,
                borderRadius: "6px 6px 6px 2px",
                padding: "9px 13px", maxWidth: 400, lineHeight: 1.75,
                wordBreak: "break-word",
                boxShadow: C.glow,
              }}>{m.text}</div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {sending && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LoafCat color={C.muted} size={20} />
            <span style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 2,
              animation: "blink 1s step-end infinite" }}>
              SNOW IS THINKING...
            </span>
          </div>
        )}
      </div>

      {/* Input row */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !sending && send()}
          placeholder="Message Snow..."
          style={{ ...F, flex: 1, background: "#080808", border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "7px 10px", color: C.text, fontSize: 11,
            outline: "none", caretColor: C.active }}
        />
        <GreenBtn onClick={send} disabled={sending} style={{ padding: "7px 18px", fontSize: 11 }}>
          {sending ? "SENDING..." : "[ SEND ]"}
        </GreenBtn>
      </div>
    </div>
  );
}

function OverviewPage({ report, pipelineStatus, proposals, designs, listings, memory, entries }) {
  const steps = ["INIT", "SNOW", "RESEARCH", "DESIGN", "LISTING", "FEEDBACK"];
  const agentToStep = { "Snow": 1, "Research Agent": 2, "Design Agent": 3, "Listing Agent": 4, "Feedback Agent": 5 };
  const activeIdx = pipelineStatus?.running ? (agentToStep[pipelineStatus?.active_agent] ?? 0) : -1;

  const approved = proposals.filter(p => p.status === "approved");
  const rate = proposals.length ? `${Math.round(approved.length / proposals.length * 100)}%` : "—";

  return (
    <div style={{ padding: "24px 26px" }}>

      {/* Snow identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 6, background: C.card, border: `1px solid ${C.active}44`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: C.glowStrong }}>
          <LoafCat color={C.active} size={46} />
        </div>
        <div>
          <div style={{ ...F, fontSize: 22, fontWeight: 700, color: C.active, letterSpacing: 3, marginBottom: 3 }}>SNOW</div>
          <div style={{ ...F, fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 6 }}>RUTHLESS MARKET ANALYST</div>
          <span style={{ ...F, fontSize: 9, color: C.active, background: "#001a0d", border: `1px solid ${C.dim}`,
            borderRadius: 3, padding: "2px 8px", letterSpacing: 1 }}>claude-opus-4.6</span>
        </div>
      </div>

      {/* Pipeline status bar */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px", marginBottom: 18 }}>
        <Label>Pipeline Status</Label>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 6 }}>
          {steps.map((s, i) => {
            const isActive = i === activeIdx;
            const isDone = i < activeIdx && activeIdx >= 0;
            return (
              <div key={s} style={{
                background: isActive ? "#001a0d" : isDone ? "#060d06" : "#0a0a0a",
                border: `1px solid ${isActive ? C.active : isDone ? C.active + "44" : "#1a1a1a"}`,
                borderRadius: 4, padding: "7px 6px", textAlign: "center",
                boxShadow: isActive ? C.glow : "none", transition: "all 0.3s",
              }}>
                <div style={{ ...F, fontSize: 9, color: isActive ? C.active : isDone ? C.active + "88" : C.muted,
                  letterSpacing: 1, whiteSpace: "nowrap" }}>
                  {isActive && <span style={{ marginRight: 4 }}>&#9679;</span>}{s}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System log */}
      <SystemLog entries={entries} />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "PROPOSALS REVIEWED", value: proposals.length },
          { label: "APPROVAL RATE", value: rate },
          { label: "DESIGNS GENERATED", value: designs.length },
          { label: "LISTINGS READY", value: listings.length },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px" }}>
            <div style={{ ...F, fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 5 }}>{s.value}</div>
            <div style={{ ...F, fontSize: 8, color: C.muted, letterSpacing: 1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Snow report */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px", marginBottom: 18 }}>
        <Label>Last Snow Report</Label>
        {report ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <div>
              <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRIORITY NICHE</div>
              <div style={{ ...F, fontSize: 14, color: C.active, letterSpacing: 1 }}>{report.priority_niche || "—"}</div>
            </div>
            <div>
              <div style={{ ...F, fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>SUMMARY</div>
              <div style={{ ...F, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>{report.summary?.slice(0, 240) || "—"}</div>
            </div>
          </div>
        ) : (
          <EmptyState text="NO REPORT YET — RUN THE PIPELINE" />
        )}
      </div>

      {/* Memory preview */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px", marginBottom: 18 }}>
        <Label>Memory Preview</Label>
        {memory.length === 0
          ? <EmptyState text="NO MEMORY ENTRIES YET" />
          : memory.slice(0, 5).map(m => (
            <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0",
              borderBottom: `1px solid ${C.faint}` }}>
              <CategoryBadge category={m.category} />
              <div style={{ ...F, fontSize: 11, color: C.muted, flex: 1, lineHeight: 1.6 }}>{m.observation}</div>
              <div style={{ ...F, fontSize: 9, color: "#333", whiteSpace: "nowrap" }}>{m.created_at?.slice(0, 10)}</div>
            </div>
          ))
        }
      </div>

      {/* Snow chat */}
      <SnowChat />
    </div>
  );
}

// ─── Research page ────────────────────────────────────────
function ResearchPage({ proposals, decide, activeAgent, refresh, entries }) {
  const state = activeAgent === "Research Agent" ? "running" : proposals.filter(p => p.status === "pending").length > 0 ? "waiting" : "idle";
  const pending = proposals.filter(p => p.status === "pending");
  const decided = proposals.filter(p => p.status !== "pending");

  return (
    <div>
      <AgentPageHeader CatComp={ResearchCat} name="RESEARCH AGENT" sub="claude-haiku-4.5 — Etsy trend scanner & niche researcher" state={state}
        rightSlot={
          <GhostBtn onClick={() => deleteByStatus(["rejected"], refresh)} style={{ fontSize: 10, letterSpacing: 1 }}>
            [ CLEAR REJECTED ]
          </GhostBtn>
        }
      />
      <TermLine text={`${pending.length} proposal${pending.length !== 1 ? "s" : ""} pending review`} color={state === "running" ? C.active : C.muted} />
      <div style={{ padding: "20px 26px" }}>

        {pending.length > 0 && (
          <>
            <Label>AWAITING APPROVAL ({pending.length})</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {pending.map(pr => (
                <div key={pr.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ ...F, fontSize: 12, color: C.text, marginBottom: 4 }}>{pr.title}</div>
                  <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 10 }}>{pr.meta}</div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <GreenBtn onClick={() => decide(pr.id, "approved")} style={{ flex: 1, padding: "6px", fontSize: 11 }}>[ APPROVE ]</GreenBtn>
                    <RedBtn onClick={() => decide(pr.id, "rejected")} style={{ padding: "6px 18px", fontSize: 11 }}>[ REJECT ]</RedBtn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {decided.length > 0 && (
          <>
            <Label>DECIDED</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {decided.map(pr => (
                <div key={pr.id} style={{ background: C.card, border: `1px solid #111`, borderRadius: 6,
                  padding: "9px 14px", opacity: 0.5, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...F, fontSize: 9, color: pr.status === "approved" ? C.active : C.danger,
                    letterSpacing: 1, width: 56 }}>{pr.status === "approved" ? "approved" : "rejected"}</span>
                  <span style={{ ...F, fontSize: 11, color: C.muted, flex: 1 }}>{pr.title}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {proposals.length === 0 && <EmptyState text="NO PROPOSALS — LAUNCH THE PIPELINE" />}
      </div>
      <AgentLog agentName="Research Agent" entries={entries} isActive={state === "running"} />
    </div>
  );
}

// ─── Design page ──────────────────────────────────────────
function DesignPage({ designs, decideDesign, activeAgent, onSelect, refresh, entries }) {
  const state = activeAgent === "Design Agent" ? "running" : designs.length > 0 ? "waiting" : "idle";
  return (
    <div>
      <AgentPageHeader CatComp={DesignCat} name="DESIGN AGENT" sub="flux-schnell via Replicate — Image generator" state={state}
        rightSlot={
          <GhostBtn onClick={() => deleteByStatus(["design_rejected"], refresh)} style={{ fontSize: 10, letterSpacing: 1 }}>
            [ CLEAR REJECTED ]
          </GhostBtn>
        }
      />
      <TermLine text={`${designs.length} design${designs.length !== 1 ? "s" : ""} awaiting review`} color={state === "running" ? C.active : C.muted} />
      <div style={{ padding: "20px 26px" }}>
        {designs.length === 0
          ? <EmptyState text="NO DESIGNS READY YET — APPROVE PROPOSALS TO GENERATE" />
          : (
            <>
              <Label>DESIGNS AWAITING REVIEW ({designs.length})</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {designs.map(d => (
                  <div key={d.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden",
                    transition: "border-color 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.active; e.currentTarget.style.boxShadow = C.glow; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                    {d.image_url && (
                      <div style={{ position: "relative" }}>
                        <img src={d.image_url} alt={d.title} style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
                        <button onClick={() => onSelect(d)} style={{
                          position: "absolute", top: 6, right: 6, ...F, fontSize: 9, color: C.text,
                          background: "rgba(0,0,0,0.75)", border: `1px solid ${C.border}`, borderRadius: 3,
                          padding: "3px 8px", cursor: "pointer", letterSpacing: 1,
                        }}>[ EXPAND ]</button>
                      </div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ ...F, fontSize: 10, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>
                        {d.title?.slice(0, 60)}{d.title?.length > 60 ? "…" : ""}
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <GreenBtn onClick={() => decideDesign(d.id, "design_approved")} style={{ flex: 1, padding: "5px 0", fontSize: 10 }}>[ OK ]</GreenBtn>
                        <RedBtn onClick={() => decideDesign(d.id, "design_rejected")} style={{ flex: 1, padding: "5px 0", fontSize: 10 }}>[ REDO ]</RedBtn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </div>
      <AgentLog agentName="Design Agent" entries={entries} isActive={state === "running"} />
    </div>
  );
}

// ─── Listing page ─────────────────────────────────────────
function ListingPage({ listings, activeAgent, onSelect, refresh, entries }) {
  const state = activeAgent === "Listing Agent" ? "running" : listings.length > 0 ? "waiting" : "idle";
  return (
    <div>
      <AgentPageHeader CatComp={ListingCat} name="LISTING AGENT" sub="claude-haiku-4.5 — SEO writer & Etsy uploader" state={state}
        rightSlot={
          <GhostBtn onClick={() => deleteByStatus(["ready_to_upload"], refresh)} style={{ fontSize: 10, letterSpacing: 1 }}>
            [ CLEAR UPLOADED ]
          </GhostBtn>
        }
      />
      <TermLine text={`${listings.length} listing${listings.length !== 1 ? "s" : ""} ready to upload`} color={state === "running" ? C.active : C.muted} />
      <div style={{ padding: "20px 26px" }}>
        {listings.length === 0
          ? <EmptyState text="NO LISTINGS READY — APPROVE DESIGNS FIRST" />
          : (
            <>
              <Label>READY TO UPLOAD ({listings.length})</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                {listings.map(l => (
                  <div key={l.id} onClick={() => onSelect(l)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden",
                      cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
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
                      <GreenBtn onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "6px 0", fontSize: 10, letterSpacing: 1 }}>
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
      <AgentLog agentName="Listing Agent" entries={entries} isActive={state === "running"} />
    </div>
  );
}

// ─── Strategy page ────────────────────────────────────────
function StrategyPage() {
  return (
    <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ opacity: 0.2, marginBottom: 20 }}><ListingCat color={C.active} size={60} /></div>
      <div style={{ ...F, fontSize: 18, color: C.muted, letterSpacing: 4, marginBottom: 10 }}>COMING SOON</div>
      <div style={{ ...F, fontSize: 11, color: "#334433", letterSpacing: 1, textAlign: "center", maxWidth: 320, lineHeight: 1.8 }}>
        The Strategy Agent will analyze market trends and competitor data to suggest long-term positioning, seasonal opportunities, and pricing strategies.
      </div>
    </div>
  );
}

// ─── Feedback page ────────────────────────────────────────
function FeedbackPage({ entries }) {
  return (
    <div>
      <AgentPageHeader CatComp={FeedbackCat} name="FEEDBACK AGENT" sub="claude-haiku-4.5 — Performance tracker & weekly recap" state="idle" />
      <TermLine text="No active tracking — 0 listings monitored" />
      <div style={{ padding: "20px 26px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ ...F, fontSize: 10, color: C.muted }}>
            Next recap in <span style={{ color: C.text }}>6 days</span>
            <span style={{ color: C.faint, marginLeft: 16 }}>{`// 0 listings tracked`}</span>
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "60px 24px", textAlign: "center" }}>
          <div style={{ ...F, fontSize: 14, color: "#334433", letterSpacing: 3 }}>NO DATA YET</div>
          <div style={{ ...F, fontSize: 10, color: "#222", marginTop: 8, letterSpacing: 1 }}>Requires active Etsy listings to populate charts</div>
        </div>
      </div>
      <AgentLog agentName="Feedback Agent" entries={entries} isActive={false} />
    </div>
  );
}

// ─── Pipeline Logs page ───────────────────────────────────
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
                  textTransform: "uppercase", display: "inline-block", color: s.color,
                  background: s.bg, border: `1px solid ${s.border}` }}>{log.status}</span>
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
  const cats = ["all", ...Array.from(new Set(memory.map(m => m.category)))];
  const shown = filter === "all" ? memory : memory.filter(m => m.category === filter);

  return (
    <div style={{ padding: "24px 26px" }}>
      <div style={{ ...F, fontSize: 14, color: C.active, letterSpacing: 2, marginBottom: 4 }}>SNOW MEMORY</div>
      <div style={{ ...F, fontSize: 10, color: C.muted, marginBottom: 20 }}>Observations stored across all pipeline runs</div>

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

// ─── Modals ───────────────────────────────────────────────
function DesignModal({ design, onClose, decideDesign }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.active}`,
        borderRadius: 6, overflow: "hidden", maxWidth: 560, width: "92%", cursor: "default",
        boxShadow: C.glowStrong }}>
        <img src={design.image_url} alt={design.title}
          style={{ width: "100%", maxHeight: 480, objectFit: "contain", background: "#050505", display: "block" }} />
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ ...F, fontSize: 12, color: C.text, marginBottom: 12 }}>{design.title}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <GreenBtn onClick={() => { decideDesign(design.id, "design_approved"); onClose(); }} style={{ flex: 1, padding: "8px", fontSize: 11 }}>[ OK ]</GreenBtn>
            <RedBtn onClick={() => { decideDesign(design.id, "design_rejected"); onClose(); }} style={{ flex: 1, padding: "8px", fontSize: 11 }}>[ REDO ]</RedBtn>
            <GhostBtn onClick={onClose} style={{ padding: "8px 16px", fontSize: 11 }}>[ CLOSE ]</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

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

// ─── Page title map ───────────────────────────────────────
const PAGE_TITLES = {
  overview: "OVERVIEW",
  research: "RESEARCH AGENT",
  design:   "DESIGN AGENT",
  strategy: "STRATEGY AGENT",
  listing:  "LISTING AGENT",
  feedback: "FEEDBACK AGENT",
  logs:     "PIPELINE LOGS",
  memory:   "SNOW MEMORY",
};

// ─── Root ─────────────────────────────────────────────────
export default function Dashboard() {
  const { proposals, decide } = useProposals();
  const { designs, decideDesign } = useDesigns();
  const { listings } = useReadyListings();
  const { report } = useSnowReport();
  const { status: pipelineStatus } = usePipelineStatus();
  const { logs } = usePipelineLogs();
  const { memory } = useSnowMemory();

  const [activePage, setActivePage] = useState("overview");
  const [keywords, setKeywords] = useState("");
  const [launching, setLaunching] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  const activeAgent = pipelineStatus?.active_agent;
  const isRunning = pipelineStatus?.running;
  const pipelineStep = pipelineStatus?.status;

  const activityEntries = useActivityLog(pipelineStatus, logs);

  const agentNameToPage = { "Research Agent": "research", "Design Agent": "design", "Listing Agent": "listing", "Feedback Agent": "feedback" };
  const agentStates = Object.fromEntries(
    Object.keys(PAGE_TITLES).map(id => {
      const agentName = Object.keys(agentNameToPage).find(k => agentNameToPage[k] === id);
      const running = agentName && activeAgent === agentName && isRunning;
      return [id, running ? "running" : "idle"];
    })
  );
  if (isRunning) agentStates.overview = "running";

  const counts = {
    research: proposals.filter(p => p.status === "pending").length,
    design:   designs.length,
    listing:  listings.length,
  };

  const callEndpoint = async (url) => {
    setLaunching(true);
    try { await fetch(url, { method: "POST" }); } catch (e) {}
    setTimeout(() => setLaunching(false), 2000);
  };

  const launch   = () => callEndpoint(`http://localhost:8000/launch?keywords=${encodeURIComponent(keywords)}`);
  const runStep2 = () => callEndpoint("http://localhost:8000/step2");
  const runStep3 = () => callEndpoint("http://localhost:8000/step3");

  const noop = () => {};

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, overflow: "hidden" }}>

      <Sidebar active={activePage} setActive={setActivePage} agentStates={agentStates} counts={counts} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ height: 48, borderBottom: `1px solid ${C.border}`, display: "flex",
          alignItems: "center", gap: 14, padding: "0 20px", flexShrink: 0, background: C.bg }}>
          <span style={{ ...F, fontSize: 12, color: C.active, letterSpacing: 2, minWidth: 160 }}>
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
            // Pipeline actively running — disable all actions
            <GhostBtn disabled style={{ fontSize: 11, letterSpacing: 1,
              animation: "pulse 1.4s ease-in-out infinite", borderColor: C.active + "44", color: C.muted }}>
              [ GO NAP ]
            </GhostBtn>
          ) : launching ? (
            <GhostBtn disabled style={{ fontSize: 11, letterSpacing: 1, color: C.muted }}>LAUNCHING...</GhostBtn>
          ) : pipelineStep === "waiting_approval" ? (
            // Step 1 done — user approved proposals in dashboard, ready to generate designs
            <button onClick={runStep2} style={{ ...F, fontSize: 11, letterSpacing: 1, cursor: "pointer",
              background: "transparent", color: C.amber, border: `1px solid ${C.amber}88`,
              borderRadius: 4, padding: "5px 14px",
              boxShadow: "0 0 8px rgba(255,187,68,0.25)" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 14px rgba(255,187,68,0.45)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 8px rgba(255,187,68,0.25)"}>
              [ RUN DESIGN ]
            </button>
          ) : pipelineStep === "waiting_review" ? (
            // Step 2 done — user approved designs in dashboard, ready to write listings
            <button onClick={runStep3} style={{ ...F, fontSize: 11, letterSpacing: 1, cursor: "pointer",
              background: "transparent", color: C.cyan, border: `1px solid ${C.cyan}88`,
              borderRadius: 4, padding: "5px 14px",
              boxShadow: "0 0 8px rgba(68,221,255,0.25)" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 14px rgba(68,221,255,0.45)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 8px rgba(68,221,255,0.25)"}>
              [ RUN LISTING ]
            </button>
          ) : (
            // No status, status="complete", or any unknown state — start fresh
            <GreenBtn onClick={launch} style={{ fontSize: 11, letterSpacing: 1 }}>
              [ GO WORK ]
            </GreenBtn>
          )}
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

        {/* Status banner */}
        {!isRunning && pipelineStep === "waiting_approval" && (
          <div style={{ padding: "7px 20px", background: "#1a1200", borderBottom: `1px solid ${C.amber}44`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot state="waiting" />
            <span style={{ ...F, fontSize: 10, color: C.amber, letterSpacing: 1.5 }}>
              WAITING — {proposals.filter(p => p.status === "pending").length} PROPOSAL{proposals.filter(p => p.status === "pending").length !== 1 ? "S" : ""} NEED YOUR APPROVAL
            </span>
          </div>
        )}
        {!isRunning && pipelineStep === "waiting_review" && (
          <div style={{ padding: "7px 20px", background: "#001a1f", borderBottom: `1px solid ${C.cyan}44`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot state="running" />
            <span style={{ ...F, fontSize: 10, color: C.cyan, letterSpacing: 1.5 }}>
              WAITING — {designs.length} DESIGN{designs.length !== 1 ? "S" : ""} NEED YOUR REVIEW
            </span>
          </div>
        )}
        {!isRunning && pipelineStep === "complete" && (
          <div style={{ padding: "7px 20px", background: "#001a0d", borderBottom: `1px solid ${C.active}44`,
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <StatusDot state="running" />
            <span style={{ ...F, fontSize: 10, color: C.active, letterSpacing: 1.5 }}>
              STEP 3 COMPLETE — CHECK LISTINGS
            </span>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activePage === "overview"  && <OverviewPage report={report} pipelineStatus={pipelineStatus} proposals={proposals} designs={designs} listings={listings} memory={memory} entries={activityEntries} />}
          {activePage === "research"  && <ResearchPage proposals={proposals} decide={decide} activeAgent={activeAgent} refresh={noop} entries={activityEntries} />}
          {activePage === "design"    && <DesignPage designs={designs} decideDesign={decideDesign} activeAgent={activeAgent} onSelect={setSelectedDesign} refresh={noop} entries={activityEntries} />}
          {activePage === "strategy"  && <StrategyPage />}
          {activePage === "listing"   && <ListingPage listings={listings} activeAgent={activeAgent} onSelect={setSelectedListing} refresh={noop} entries={activityEntries} />}
          {activePage === "feedback"  && <FeedbackPage entries={activityEntries} />}
          {activePage === "logs"      && <LogsPage logs={logs} />}
          {activePage === "memory"    && <MemoryPage memory={memory} />}
        </div>
      </div>

      {selectedDesign  && <DesignModal  design={selectedDesign}  onClose={() => setSelectedDesign(null)}  decideDesign={decideDesign} />}
      {selectedListing && <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,255,136,0.012) 3px,
            rgba(0,255,136,0.012) 4px
          );
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        input::placeholder { color: #334433; }
        button:focus { outline: none; }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes termEntry { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
