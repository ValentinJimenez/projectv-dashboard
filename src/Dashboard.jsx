import { useState } from "react";
import {
  useProposals, useDesigns, useReadyListings,
  useSnowReport, usePipelineStatus, usePipelineLogs, useSnowMemory
} from "./useAirtable";

// ── Color tokens ──────────────────────────────────────────
const c = {
  bg: "#0a0a0a",
  card: "#111111",
  border: "#1a1a1a",
  text: "#e8e8e8",
  muted: "#555555",
  faint: "#222222",
  accent: "#ffffff",
  glow: "#333333",
  green: "#4ade80",
  greenDim: "#0a1f12",
  red: "#f87171",
  redDim: "#1f0a0a",
  amber: "#fbbf24",
  amberDim: "#1f1500",
};

const mono = { fontFamily: "ui-monospace, 'Cascadia Code', monospace" };
const sys = { fontFamily: "system-ui, -apple-system, sans-serif" };

// ── Cat SVGs ──────────────────────────────────────────────
// Sleeping loaf cat — 3 paths max
const LoafCat = ({ size = 36, dotColor = null }) => (
  <svg width={size} height={size} viewBox="0 0 40 36" fill="none" style={{ display: "block" }}>
    <ellipse cx="20" cy="24" rx="16" ry="11" fill={c.accent} opacity="0.9" />
    <polygon points="9,14 7,7 13,13" fill={c.accent} opacity="0.9" />
    <polygon points="27,13 31,7 33,13" fill={c.accent} opacity="0.9" />
    <path d="M14,22 Q17,20.5 20,22 Q23,20.5 26,22" stroke={c.bg} strokeWidth="1.6" fill="none" strokeLinecap="round" />
    {dotColor && <circle cx="36" cy="6" r="4" fill={dotColor} />}
  </svg>
);

// Upright cat — for agents
const AgentCat = ({ size = 32, color = c.accent, dotColor = null }) => (
  <svg width={size} height={size} viewBox="0 0 36 40" fill="none" style={{ display: "block" }}>
    <ellipse cx="18" cy="32" rx="11" ry="7" fill={color} />
    <circle cx="18" cy="17" r="11" fill={color} />
    <polygon points="10,9 8,2 14,8" fill={color} />
    <polygon points="26,9 28,2 22,8" fill={color} />
    <circle cx="14.5" cy="16" r="2.2" fill={c.bg} />
    <circle cx="21.5" cy="16" r="2.2" fill={c.bg} />
    <circle cx="15" cy="15.2" r="0.9" fill="rgba(255,255,255,0.6)" />
    <circle cx="22" cy="15.2" r="0.9" fill="rgba(255,255,255,0.6)" />
    {dotColor && <circle cx="32" cy="4" r="4" fill={dotColor} />}
  </svg>
);

// ── Shared UI atoms ───────────────────────────────────────
const Badge = ({ label, style: extra = {} }) => (
  <span style={{
    ...mono, fontSize: 9, padding: "2px 8px", borderRadius: 4,
    border: `1px solid ${c.border}`, color: c.muted,
    letterSpacing: 0.8, textTransform: "uppercase",
    ...extra,
  }}>{label}</span>
);

const StatusDot = ({ state }) => {
  const color = state === "running" ? c.green : state === "waiting" ? c.amber : c.muted;
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      background: color, flexShrink: 0,
      boxShadow: state === "running" ? `0 0 6px ${c.green}` : "none",
    }} />
  );
};

const SectionLabel = ({ children }) => (
  <div style={{ ...mono, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: c.muted, marginBottom: 10 }}>
    {children}
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ ...mono, fontSize: 11, color: c.muted, textAlign: "center", padding: "28px 0" }}>{text}</div>
);

const Btn = ({ onClick, children, variant = "default", style: extra = {}, ...rest }) => {
  const variants = {
    default: { background: c.faint, color: c.muted, border: `1px solid ${c.border}` },
    approve: { background: c.greenDim, color: c.green, border: `1px solid ${c.green}33` },
    reject: { background: c.redDim, color: c.red, border: `1px solid ${c.red}33` },
    primary: { background: c.glow, color: c.accent, border: `1px solid ${c.border}` },
  };
  return (
    <button onClick={onClick} style={{
      ...mono, fontSize: 10, fontWeight: 600, padding: "5px 12px",
      borderRadius: 8, cursor: "pointer", letterSpacing: 0.4,
      transition: "all 0.15s",
      ...variants[variant],
      ...extra,
    }} {...rest}>{children}</button>
  );
};

// ── Agent page header ─────────────────────────────────────
const AgentHeader = ({ name, model, state, catColor = c.accent, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px 16px", borderBottom: `1px solid ${c.border}` }}>
    <div style={{ width: 52, height: 52, borderRadius: 12, background: c.card, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <AgentCat size={34} color={catColor} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ ...sys, fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 2 }}>{name}</div>
      <div style={{ ...mono, fontSize: 10, color: c.muted }}>{subtitle || model}</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <StatusDot state={state} />
      <span style={{ ...mono, fontSize: 10, color: c.muted, textTransform: "capitalize" }}>{state}</span>
    </div>
  </div>
);

const TerminalLine = ({ text, color = c.muted }) => (
  <div style={{ padding: "8px 24px", background: "#0d0d0d", borderBottom: `1px solid ${c.border}`, ...mono, fontSize: 10, color }}>
    <span style={{ color: c.muted, marginRight: 8 }}>$</span>{text}
  </div>
);

// ── Sidebar ───────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", sub: "Snow's view" },
  { id: "research", label: "Research Agent", sub: "Trend scanner" },
  { id: "design", label: "Design Agent", sub: "Image generator" },
  { id: "strategy", label: "Strategy Agent", sub: "Coming soon", disabled: true },
  { id: "listing", label: "Listing Agent", sub: "SEO writer" },
  { id: "feedback", label: "Feedback Agent", sub: "Performance" },
];

const SECONDARY = [
  { id: "logs", label: "Pipeline Logs" },
  { id: "memory", label: "Snow Memory" },
];

function Sidebar({ active, setActive, agentStates, counts }) {
  return (
    <div style={{
      width: 220, flexShrink: 0, background: c.card, borderRight: `1px solid ${c.border}`,
      display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${c.border}` }}>
        <div style={{ ...mono, fontSize: 9, color: c.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Agent Ops</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LoafCat size={28} />
          <span style={{ ...sys, fontSize: 15, fontWeight: 700, color: c.text, letterSpacing: 0.5 }}>ProjectSnow</span>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding: "10px 8px", flex: 1 }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          const state = agentStates[item.id] || "idle";
          const count = counts[item.id];
          return (
            <button key={item.id}
              onClick={() => !item.disabled && setActive(item.id)}
              disabled={item.disabled}
              style={{
                width: "100%", textAlign: "left", background: isActive ? c.glow : "transparent",
                border: isActive ? `1px solid ${c.border}` : "1px solid transparent",
                borderRadius: 8, padding: "8px 10px", cursor: item.disabled ? "default" : "pointer",
                marginBottom: 2, display: "flex", alignItems: "center", gap: 9,
                opacity: item.disabled ? 0.35 : 1, transition: "all 0.12s",
              }}>
              <StatusDot state={item.disabled ? "idle" : state} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...sys, fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? c.text : c.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                <div style={{ ...mono, fontSize: 9, color: "#333", marginTop: 1 }}>{item.sub}</div>
              </div>
              {count > 0 && (
                <span style={{ ...mono, fontSize: 9, background: c.faint, color: c.muted, borderRadius: 4, padding: "1px 5px", border: `1px solid ${c.border}` }}>{count}</span>
              )}
            </button>
          );
        })}

        <div style={{ height: 1, background: c.border, margin: "12px 4px" }} />

        {SECONDARY.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              width: "100%", textAlign: "left", background: isActive ? c.glow : "transparent",
              border: isActive ? `1px solid ${c.border}` : "1px solid transparent",
              borderRadius: 8, padding: "8px 10px", cursor: "pointer", marginBottom: 2,
              transition: "all 0.12s",
            }}>
              <span style={{ ...sys, fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? c.text : c.muted }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Overview page ─────────────────────────────────────────
function OverviewPage({ report, pipelineStatus, proposals, designs, listings, memory }) {
  const steps = ["Research Agent", "Design Agent", "Listing Agent", "Feedback Agent"];
  const activeAgent = pipelineStatus?.active_agent;
  const isRunning = pipelineStatus?.running;
  const activeIdx = steps.indexOf(activeAgent);

  const approved = proposals.filter(p => p.status === "approved");

  return (
    <div style={{ padding: "24px 28px", maxWidth: 860 }}>

      {/* Snow identity */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: c.card, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <LoafCat size={42} />
        </div>
        <div style={{ paddingTop: 4 }}>
          <div style={{ ...sys, fontSize: 22, fontWeight: 700, color: c.text, marginBottom: 2 }}>Snow</div>
          <div style={{ ...mono, fontSize: 11, color: c.muted, marginBottom: 6 }}>Ruthless Market Analyst</div>
          <Badge label="claude-opus-4.6" style={{ color: c.accent, borderColor: c.border }} />
        </div>
      </div>

      {/* Pipeline status bar */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
        <SectionLabel>Pipeline Status</SectionLabel>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {steps.map((step, i) => {
            const isActive = activeIdx === i && isRunning;
            const isDone = activeIdx > i && isRunning;
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <div style={{
                  flex: 1, background: isActive ? c.glow : isDone ? "#1a2a1a" : c.faint,
                  border: `1px solid ${isActive ? c.accent : isDone ? c.green + "44" : c.border}`,
                  borderRadius: 8, padding: "7px 10px", transition: "all 0.4s",
                }}>
                  <div style={{ ...mono, fontSize: 9, color: isActive ? c.text : isDone ? c.green : c.muted, whiteSpace: "nowrap" }}>
                    {isActive && <span style={{ marginRight: 5 }}>&#9679;</span>}{step}
                  </div>
                </div>
                {i < steps.length - 1 && <span style={{ color: c.border, ...mono, fontSize: 10 }}>›</span>}
              </div>
            );
          })}
          {!isRunning && (
            <div style={{ ...mono, fontSize: 9, color: c.muted, marginLeft: 8, whiteSpace: "nowrap" }}>idle</div>
          )}
        </div>
      </div>

      {/* Quick stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Proposals Reviewed", value: proposals.length },
          { label: "Approval Rate", value: proposals.length ? `${Math.round(approved.length / proposals.length * 100)}%` : "—" },
          { label: "Designs Generated", value: designs.length },
          { label: "Listings Ready", value: listings.length },
        ].map(stat => (
          <div key={stat.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ ...sys, fontSize: 10, color: c.muted }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Snow report card */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <SectionLabel>Last Report</SectionLabel>
        {report ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ ...sys, fontSize: 10, color: c.muted, marginBottom: 6 }}>Priority Niche</div>
              <div style={{ ...mono, fontSize: 13, color: c.text, fontWeight: 600 }}>{report.priority_niche || "—"}</div>
            </div>
            <div>
              <div style={{ ...sys, fontSize: 10, color: c.muted, marginBottom: 6 }}>Summary</div>
              <div style={{ ...sys, fontSize: 11, color: c.muted, lineHeight: 1.6 }}>{report.summary?.slice(0, 200) || "No summary yet."}</div>
            </div>
          </div>
        ) : (
          <EmptyState text="No report yet — run the pipeline to generate Snow's first analysis." />
        )}
      </div>

      {/* Memory preview */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "16px 18px" }}>
        <SectionLabel>Memory Preview</SectionLabel>
        {memory.slice(0, 5).length === 0
          ? <EmptyState text="No memory entries yet." />
          : memory.slice(0, 5).map(m => (
            <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${c.faint}` }}>
              <MemoryCategoryBadge category={m.category} />
              <div style={{ ...sys, fontSize: 11, color: c.muted, flex: 1, lineHeight: 1.5 }}>{m.observation}</div>
              <div style={{ ...mono, fontSize: 9, color: "#333", whiteSpace: "nowrap" }}>{m.created_at?.slice(0, 10) || ""}</div>
            </div>
          ))
        }
      </div>

    </div>
  );
}

// ── Research page ─────────────────────────────────────────
function ResearchPage({ proposals, decide, activeAgent }) {
  const pending = proposals.filter(p => p.status === "pending");
  const decided = proposals.filter(p => p.status !== "pending");
  const state = activeAgent === "Research Agent" ? "running" : pending.length > 0 ? "waiting" : "idle";

  return (
    <div>
      <AgentHeader name="Research Agent" model="claude-haiku-4.5" state={state} subtitle="Etsy trend scanner · Niche researcher" />
      <TerminalLine text={`Scanning Etsy trends — ${pending.length} proposal${pending.length !== 1 ? "s" : ""} pending review`} color={state === "running" ? c.green : c.muted} />
      <div style={{ padding: "20px 24px" }}>

        {pending.length > 0 && (
          <>
            <SectionLabel>Awaiting Approval ({pending.length})</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {pending.map(pr => (
                <div key={pr.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ ...sys, fontSize: 12, fontWeight: 500, color: c.text, marginBottom: 4 }}>{pr.title}</div>
                  <div style={{ ...mono, fontSize: 10, color: c.muted, marginBottom: 10 }}>{pr.meta}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="approve" onClick={() => decide(pr.id, "approved")} style={{ flex: 1 }}>Approve</Btn>
                    <Btn variant="reject" onClick={() => decide(pr.id, "rejected")}>Reject</Btn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {decided.length > 0 && (
          <>
            <SectionLabel>Decided</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {decided.map(pr => (
                <div key={pr.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 14px", opacity: 0.5, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ ...mono, fontSize: 9, color: pr.status === "approved" ? c.green : c.red, width: 52 }}>{pr.status === "approved" ? "approved" : "rejected"}</div>
                  <div style={{ ...sys, fontSize: 12, color: c.muted, flex: 1 }}>{pr.title}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {proposals.length === 0 && <EmptyState text="No proposals — launch the pipeline to scan trends." />}
      </div>
    </div>
  );
}

// ── Design page ───────────────────────────────────────────
function DesignPage({ designs, decideDesign, activeAgent, onSelectDesign }) {
  const state = activeAgent === "Design Agent" ? "running" : designs.length > 0 ? "waiting" : "idle";

  return (
    <div>
      <AgentHeader name="Design Agent" model="flux-schnell · replicate" state={state} catColor="#fbbf24" subtitle="Image generator · Art director" />
      <TerminalLine text={`${designs.length} design${designs.length !== 1 ? "s" : ""} awaiting review`} color={state === "running" ? c.amber : c.muted} />
      <div style={{ padding: "20px 24px" }}>
        {designs.length === 0
          ? <EmptyState text="No designs ready — approve proposals to trigger image generation." />
          : (
            <>
              <SectionLabel>Designs Awaiting Review ({designs.length})</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {designs.map(d => (
                  <div key={d.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: "hidden" }}>
                    {d.image_url && (
                      <div style={{ position: "relative" }}>
                        <img src={d.image_url} alt={d.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                        <button onClick={() => onSelectDesign(d)} style={{ position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,0.7)", color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", ...mono }}>expand</button>
                      </div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ ...sys, fontSize: 11, color: c.text, marginBottom: 8, lineHeight: 1.4 }}>{d.title?.slice(0, 56)}{d.title?.length > 56 ? "…" : ""}</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <Btn variant="approve" onClick={() => decideDesign(d.id, "design_approved")} style={{ flex: 1, padding: "5px 8px" }}>Approve</Btn>
                        <Btn variant="reject" onClick={() => decideDesign(d.id, "design_rejected")} style={{ flex: 1, padding: "5px 8px" }}>Redo</Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </div>
    </div>
  );
}

// ── Listing page ──────────────────────────────────────────
function ListingPage({ listings, activeAgent, onSelectListing }) {
  const state = activeAgent === "Listing Agent" ? "running" : listings.length > 0 ? "waiting" : "idle";

  return (
    <div>
      <AgentHeader name="Listing Agent" model="claude-haiku-4.5" state={state} catColor={c.green} subtitle="SEO writer · Etsy uploader" />
      <TerminalLine text={`${listings.length} listing${listings.length !== 1 ? "s" : ""} ready to upload`} color={state === "running" ? c.green : c.muted} />
      <div style={{ padding: "20px 24px" }}>
        {listings.length === 0
          ? <EmptyState text="No listings ready — approve designs to generate listings." />
          : (
            <>
              <SectionLabel>Ready to Upload ({listings.length})</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {listings.map(l => (
                  <div key={l.id} onClick={() => onSelectListing(l)} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = c.glow}
                    onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
                    {l.image_url && (
                      <div style={{ position: "relative" }}>
                        <img src={l.image_url} alt={l.title} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", bottom: 6, left: 10 }}>
                          <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: c.text, background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 4 }}>{l.price}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ ...sys, fontSize: 11, color: c.text, marginBottom: 5, lineHeight: 1.4 }}>{l.title?.slice(0, 54)}{l.title?.length > 54 ? "…" : ""}</div>
                      <div style={{ ...mono, fontSize: 9, color: c.muted, marginBottom: 8 }}>{l.tags?.split(",").length || 0} tags · click to preview</div>
                      <Btn onClick={e => e.stopPropagation()} variant="primary" style={{ width: "100%", textAlign: "center" }}>Upload to Etsy</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </div>
    </div>
  );
}

// ── Feedback page ─────────────────────────────────────────
function FeedbackPage() {
  return (
    <div>
      <AgentHeader name="Feedback Agent" model="claude-haiku-4.5" state="idle" catColor="#a78bfa" subtitle="Performance tracker · Weekly recap" />
      <TerminalLine text="Awaiting listing data — no active tracking" />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 10, color: c.muted }}>Next recap in <span style={{ color: c.text }}>6 days</span></div>
          <div style={{ ...mono, fontSize: 10, color: c.muted, marginTop: 4 }}>0 listings tracked</div>
        </div>
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ ...sys, fontSize: 12, color: c.muted }}>Performance charts coming soon</div>
          <div style={{ ...mono, fontSize: 10, color: "#333", marginTop: 6 }}>Requires active Etsy listings</div>
        </div>
      </div>
    </div>
  );
}

// ── Pipeline Logs page ────────────────────────────────────
function LogsPage({ logs }) {
  const statusStyle = (s) => {
    if (s === "success") return { color: c.green, background: c.greenDim, border: `1px solid ${c.green}33` };
    if (s === "failed") return { color: c.red, background: c.redDim, border: `1px solid ${c.red}33` };
    return { color: c.amber, background: c.amberDim, border: `1px solid ${c.amber}33` };
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ ...sys, fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 6 }}>Pipeline Logs</div>
      <div style={{ ...mono, fontSize: 10, color: c.muted, marginBottom: 20 }}>All pipeline runs, newest first</div>

      {logs.length === 0
        ? <EmptyState text="No pipeline runs recorded yet." />
        : (
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: 0, padding: "8px 16px", borderBottom: `1px solid ${c.border}` }}>
              {["Date", "Duration", "Proposals", "Designs", "Listings", "Status"].map(h => (
                <div key={h} style={{ ...mono, fontSize: 9, color: c.muted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {logs.map((log, i) => (
              <div key={log.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: 0, padding: "10px 16px", borderBottom: i < logs.length - 1 ? `1px solid ${c.faint}` : "none", alignItems: "center" }}>
                <div style={{ ...mono, fontSize: 11, color: c.text }}>{log.date}</div>
                <div style={{ ...mono, fontSize: 11, color: c.muted }}>{log.duration || "—"}</div>
                <div style={{ ...mono, fontSize: 11, color: c.muted }}>{log.proposals}</div>
                <div style={{ ...mono, fontSize: 11, color: c.muted }}>{log.designs}</div>
                <div style={{ ...mono, fontSize: 11, color: c.muted }}>{log.listings}</div>
                <span style={{ ...mono, fontSize: 9, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase", display: "inline-block", width: "fit-content", ...statusStyle(log.status) }}>{log.status}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Memory category badge ─────────────────────────────────
function MemoryCategoryBadge({ category }) {
  const styles = {
    approved: { color: c.text, background: "#1a1a1a", border: `1px solid ${c.border}` },
    rejected: { color: c.muted, background: "#151515", border: `1px solid ${c.faint}` },
    trend: { color: "#888", background: "#141414", border: `1px solid ${c.faint}` },
    avoid: { color: "#c84040", background: "#150a0a", border: "1px solid #2a1010" },
    general: { color: c.muted, background: c.faint, border: `1px solid ${c.border}` },
  };
  const s = styles[category] || styles.general;
  return (
    <span style={{ ...mono, fontSize: 8, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0, ...s }}>{category}</span>
  );
}

// ── Snow Memory page ──────────────────────────────────────
function MemoryPage({ memory }) {
  const [filter, setFilter] = useState("all");
  const categories = ["all", ...Array.from(new Set(memory.map(m => m.category)))];
  const shown = filter === "all" ? memory : memory.filter(m => m.category === filter);

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ ...sys, fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 6 }}>Snow Memory</div>
      <div style={{ ...mono, fontSize: 10, color: c.muted, marginBottom: 20 }}>Observations and decisions stored across pipeline runs</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            ...mono, fontSize: 9, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
            background: filter === cat ? c.glow : c.faint,
            color: filter === cat ? c.text : c.muted,
            border: `1px solid ${filter === cat ? c.border : c.faint}`,
            textTransform: "uppercase", letterSpacing: 0.6,
          }}>{cat}</button>
        ))}
      </div>

      {shown.length === 0
        ? <EmptyState text="No memory entries." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {shown.map(m => (
              <div key={m.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <MemoryCategoryBadge category={m.category} />
                <div style={{ ...sys, fontSize: 12, color: c.muted, flex: 1, lineHeight: 1.6 }}>{m.observation}</div>
                <div style={{ ...mono, fontSize: 9, color: "#333", whiteSpace: "nowrap" }}>{m.created_at?.slice(0, 10) || ""}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Design modal ──────────────────────────────────────────
function DesignModal({ design, onClose, decideDesign }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: "hidden", maxWidth: 540, width: "92%", cursor: "default" }}>
        <img src={design.image_url} alt={design.title} style={{ width: "100%", maxHeight: 460, objectFit: "contain", background: "#0d0d0d", display: "block" }} />
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${c.border}` }}>
          <div style={{ ...sys, fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 12 }}>{design.title}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="approve" onClick={() => { decideDesign(design.id, "design_approved"); onClose(); }} style={{ flex: 1, padding: "7px" }}>Approve</Btn>
            <Btn variant="reject" onClick={() => { decideDesign(design.id, "design_rejected"); onClose(); }} style={{ flex: 1, padding: "7px" }}>Redo</Btn>
            <Btn onClick={onClose} style={{ padding: "7px 14px" }}>Close</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Listing modal ─────────────────────────────────────────
function ListingModal({ listing, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 14, overflow: "hidden", maxWidth: 620, width: "92%", cursor: "default", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {listing.image_url && (
          <img src={listing.image_url} alt={listing.title} style={{ width: "100%", height: "100%", minHeight: 300, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: "20px 18px", overflowY: "auto", maxHeight: 460 }}>
          <div style={{ ...sys, fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6, lineHeight: 1.4 }}>{listing.title}</div>
          <div style={{ ...mono, fontSize: 16, color: c.text, fontWeight: 700, marginBottom: 14 }}>{listing.price}</div>
          <div style={{ ...sys, fontSize: 10, color: c.muted, marginBottom: 4 }}>Description</div>
          <div style={{ ...sys, fontSize: 11, color: c.muted, lineHeight: 1.7, marginBottom: 12 }}>{listing.description?.slice(0, 300)}{listing.description?.length > 300 ? "…" : ""}</div>
          <div style={{ ...sys, fontSize: 10, color: c.muted, marginBottom: 4 }}>Tags</div>
          <div style={{ ...mono, fontSize: 9, color: "#444", lineHeight: 1.9, marginBottom: 16 }}>{listing.tags}</div>
          <Btn variant="primary" style={{ width: "100%", textAlign: "center", padding: "8px", marginBottom: 6 }}>Upload to Etsy</Btn>
          <Btn onClick={onClose} style={{ width: "100%", textAlign: "center", padding: "7px" }}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────
export default function Dashboard() {
  const { proposals, decide, clearCompleted } = useProposals();
  const { designs, decideDesign } = useDesigns();
  const { listings } = useReadyListings();
  const { report } = useSnowReport();
  const { status: pipelineStatus } = usePipelineStatus();
  const { logs } = usePipelineLogs();
  const { memory } = useSnowMemory();

  const [activePage, setActivePage] = useState("overview");
  const [keywords, setKeywords] = useState("");
  const [launchState, setLaunchState] = useState("idle"); // idle | launching | done
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  const activeAgent = pipelineStatus?.active_agent;
  const isRunning = pipelineStatus?.running;

  const agentPageState = (agentName) => {
    if (activeAgent === agentName && isRunning) return "running";
    return "idle";
  };

  const agentStates = {
    overview: isRunning ? "running" : "idle",
    research: agentPageState("Research Agent"),
    design: agentPageState("Design Agent"),
    listing: agentPageState("Listing Agent"),
    feedback: agentPageState("Feedback Agent"),
    strategy: "idle",
    logs: "idle",
    memory: "idle",
  };

  const counts = {
    research: proposals.filter(p => p.status === "pending").length,
    design: designs.length,
    listing: listings.length,
  };

  const launch = async () => {
    setLaunchState("launching");
    try {
      await fetch(`http://localhost:8000/launch?keywords=${encodeURIComponent(keywords)}`, { method: "POST" });
    } catch (e) {}
    setLaunchState("done");
    setTimeout(() => setLaunchState("idle"), 3500);
  };

  const totalStats = [
    { label: "Listings", value: listings.length },
    { label: "Views", value: 0 },
    { label: "Sales", value: 0 },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: c.bg, color: c.text, overflow: "hidden" }}>

      <Sidebar active={activePage} setActive={setActivePage} agentStates={agentStates} counts={counts} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top header bar */}
        <div style={{ height: 52, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", flexShrink: 0, background: c.card }}>
          <div style={{ ...sys, fontSize: 13, fontWeight: 700, color: c.text, letterSpacing: 0.3, marginRight: 4 }}>ProjectSnow</div>
          <div style={{ width: 1, height: 18, background: c.border }} />

          {/* Launch input */}
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === "Enter" && launchState === "idle" && launch()}
            placeholder="Keywords for Snow..."
            style={{ ...mono, background: "transparent", border: `1px solid ${c.border}`, borderRadius: 6, padding: "5px 10px", color: c.text, fontSize: 10, width: 220, outline: "none", caretColor: c.text }}
          />
          <button onClick={launch} disabled={launchState !== "idle"} style={{
            ...mono, fontSize: 10, fontWeight: 600, padding: "5px 14px", borderRadius: 6, cursor: launchState === "idle" ? "pointer" : "default",
            background: launchState === "done" ? c.greenDim : c.faint,
            color: launchState === "done" ? c.green : launchState === "launching" ? c.muted : c.text,
            border: `1px solid ${launchState === "done" ? c.green + "44" : c.border}`,
            transition: "all 0.2s",
          }}>
            {launchState === "launching" ? "Launching..." : launchState === "done" ? "Launched" : "Launch Pipeline"}
          </button>

          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot state="running" />
              <span style={{ ...mono, fontSize: 10, color: c.muted }}>{activeAgent}</span>
            </div>
          )}

          <Btn onClick={clearCompleted} style={{ marginLeft: 4, padding: "4px 10px", color: "#c84040", borderColor: "#2a1010" }}>Clear</Btn>

          <div style={{ flex: 1 }} />

          {totalStats.map(s => (
            <div key={s.label} style={{ textAlign: "right", paddingLeft: 16, borderLeft: `1px solid ${c.border}` }}>
              <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: c.text, lineHeight: 1 }}>{s.value}</div>
              <div style={{ ...sys, fontSize: 9, color: c.muted, marginTop: 2, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activePage === "overview" && (
            <OverviewPage report={report} pipelineStatus={pipelineStatus} proposals={proposals} designs={designs} listings={listings} memory={memory} />
          )}
          {activePage === "research" && (
            <ResearchPage proposals={proposals} decide={decide} activeAgent={activeAgent} />
          )}
          {activePage === "design" && (
            <DesignPage designs={designs} decideDesign={decideDesign} activeAgent={activeAgent} onSelectDesign={setSelectedDesign} />
          )}
          {activePage === "listing" && (
            <ListingPage listings={listings} activeAgent={activeAgent} onSelectListing={setSelectedListing} />
          )}
          {activePage === "feedback" && <FeedbackPage />}
          {activePage === "logs" && <LogsPage logs={logs} />}
          {activePage === "memory" && <MemoryPage memory={memory} />}
          {activePage === "strategy" && (
            <div style={{ padding: "24px 28px" }}>
              <div style={{ ...sys, fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 6 }}>Strategy Agent</div>
              <div style={{ ...mono, fontSize: 10, color: c.muted }}>Coming soon</div>
            </div>
          )}
        </div>
      </div>

      {selectedDesign && (
        <DesignModal design={selectedDesign} onClose={() => setSelectedDesign(null)} decideDesign={decideDesign} />
      )}
      {selectedListing && (
        <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        button:focus { outline: none; }
        input::placeholder { color: #333; }
      `}</style>
    </div>
  );
}
