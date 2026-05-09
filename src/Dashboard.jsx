import { useState } from "react";
import { useProposals, useDesigns, useReadyListings, useSnowReport, usePipelineStatus } from "./useAirtable";

const p = {
  bg: "#13100c", card: "#1c1610", border: "#2c2118", surface: "#100e08",
  text: "#ede0cc", muted: "#8a7660", faint: "#2c2118",
  accent: "#c4a06a", accentDim: "#281e10",
  green: "#7aaa7a", greenDim: "#162016",
  amber: "#d4905a", amberDim: "#2a1610",
  blue: "#7a9ab8", blueDim: "#101a26",
  terra: "#b87a6a", terraDim: "#261410",
};

// ── Cat SVGs ──────────────────────────────────────────────
const SleepingCat = ({ color = "#e8d4b8", size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 44 40" fill="none">
    <ellipse cx="18" cy="26" rx="14" ry="10" fill={color}/>
    <circle cx="32" cy="18" r="9" fill={color}/>
    <polygon points="26,11 28,5 32,11" fill={color}/>
    <polygon points="32,11 36,5 38,11" fill={color}/>
    <path d="M4,26 Q1,16 7,12 Q11,9 9,16" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M28,18 Q32,16.5 36,18" stroke={p.surface} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="14" cy="33" rx="4" ry="2.5" fill={color} opacity="0.6"/>
    <ellipse cx="23" cy="34" rx="4" ry="2.5" fill={color} opacity="0.6"/>
  </svg>
);

const AlertCat = ({ color = "#7a9ab8", size = 32, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
    <ellipse cx="20" cy="34" rx="10" ry="8" fill={color}/>
    <circle cx="20" cy="18" r="10" fill={color}/>
    <polygon points="13,11 10,3 17,9" fill={color}/>
    <polygon points="27,11 30,3 23,9" fill={color}/>
    <circle cx="16.5" cy="17" r={active ? 2.5 : 2} fill={p.surface}/>
    <circle cx="23.5" cy="17" r={active ? 2.5 : 2} fill={p.surface}/>
    <circle cx="17" cy="16.2" r="1" fill="white" opacity="0.7"/>
    <circle cx="24" cy="16.2" r="1" fill="white" opacity="0.7"/>
    <path d="M30,34 Q38,26 35,36" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const ArtistCat = ({ color = "#d4905a", size = 32, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
    <ellipse cx="20" cy="34" rx="9" ry="7" fill={color}/>
    <circle cx="22" cy="18" r="10" fill={color}/>
    <polygon points="15,11 12,4 18,9" fill={color}/>
    <polygon points="28,10 32,3 25,9" fill={color}/>
    <circle cx="18.5" cy="17" r={active ? 3 : 2.5} fill={p.surface}/>
    <circle cx="25.5" cy="16" r={active ? 2.5 : 2} fill={p.surface}/>
    <circle cx="19" cy="16" r="1.2" fill="white" opacity="0.7"/>
    <path d="M13,28 Q8,20 11,14" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <circle cx="11" cy="12.5" r="3" fill={color}/>
  </svg>
);

const ProudCat = ({ color = "#7aaa7a", size = 32, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
    <ellipse cx="20" cy="34" rx="9" ry="9" fill={color}/>
    <circle cx="20" cy="17" r="10" fill={color}/>
    <polygon points="13,10 11,3 17,9" fill={color}/>
    <polygon points="27,10 29,3 23,9" fill={color}/>
    <path d="M15,17 Q17,15.5 19,17" stroke={p.surface} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M21,17 Q23,15.5 25,17" stroke={p.surface} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M30,32 Q38,25 34,38 Q28,42 20,40" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const WatchfulCat = ({ color = "#b87a6a", size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
    <ellipse cx="20" cy="30" rx="13" ry="10" fill={color}/>
    <circle cx="20" cy="17" r="10" fill={color}/>
    <polygon points="13,10 11,3 17,9" fill={color}/>
    <polygon points="27,10 29,3 23,9" fill={color}/>
    <circle cx="16.5" cy="16" r="2.5" fill={p.surface}/>
    <circle cx="17" cy="15.2" r="1" fill="white" opacity="0.7"/>
    <path d="M21,16 Q23,14.5 25,16" stroke={p.surface} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <ellipse cx="13" cy="38" rx="3.5" ry="2" fill={color} opacity="0.6"/>
    <ellipse cx="27" cy="38" rx="3.5" ry="2" fill={color} opacity="0.6"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────
const Pill = ({ label, color, bg, border }) => (
  <span style={{ fontSize: 9, padding: "2px 9px", borderRadius: 20, background: bg, color, border: `1px solid ${border || color + "33"}`, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const CardHeader = ({ cat, name, model, statusLabel, statusColor, statusBg, active }) => (
  <div style={{ padding: "12px 14px", borderBottom: `1px solid ${p.faint}`, display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, background: statusBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: active ? `0 0 12px ${statusColor}44` : "none", transition: "box-shadow 0.5s" }}>
      {cat}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: p.text }}>{name}</div>
      <div style={{ fontSize: 10, color: p.muted, fontFamily: "monospace", marginTop: 1 }}>{model}</div>
    </div>
    <Pill label={statusLabel} color={statusColor} bg={statusBg} />
  </div>
);

const Terminal = ({ line1, line2, color }) => (
  <div style={{ padding: "7px 14px", background: p.surface, borderBottom: `1px solid ${p.faint}`, fontFamily: "monospace", fontSize: 10, color: p.muted, lineHeight: 1.9 }}>
    <span style={{ color }}>{line1}</span><br />
    <span style={{ color: p.faint }}>{line2}</span>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const { proposals, decide, clearCompleted } = useProposals();
  const { designs, decideDesign } = useDesigns();
  const { listings } = useReadyListings();
  const { report } = useSnowReport();
  const { status: pipelineStatus } = usePipelineStatus();

  const [keywords, setKeywords] = useState("");
  const [launching, setLaunching] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const pending = proposals.filter(q => q.status === "pending");
  const isRunning = pipelineStatus?.running;
  const activeAgent = pipelineStatus?.active_agent;

  const launch = async () => {
    setLaunching(true);
    try {
      await fetch(`http://localhost:8000/launch?keywords=${encodeURIComponent(keywords)}`, { method: "POST" });
    } catch (e) { console.error(e); }
    setTimeout(() => setLaunching(false), 4000);
  };

  return (
    <div style={{ background: p.bg, minHeight: "100vh", fontFamily: "'Segoe UI', Georgia, sans-serif", color: p.text, padding: "18px 22px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${p.border}` }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: p.muted, marginBottom: 3 }}>Agent Operations Center</div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: p.text }}>
            Project<span style={{ color: p.accent }}>S</span>now
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder="Keywords for Snow... (japandi, wabi sabi...)"
            style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 8, padding: "8px 13px", color: p.text, fontSize: 11, width: 260, outline: "none", fontFamily: "monospace" }} />
          <button onClick={launch} style={{ background: launching ? p.greenDim : p.accentDim, color: launching ? p.green : p.accent, border: `1px solid ${launching ? p.green : p.accent}44`, borderRadius: 8, padding: "8px 18px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.3s", letterSpacing: 0.5 }}>
            {launching ? "✓ Launched!" : "❄️ Launch Pipeline"}
          </button>
          <button onClick={clearCompleted} style={{ background: "#2a1010", color: "#f87171", border: "1px solid #4a2020", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>
            Clear
          </button>
          {isRunning && (
            <div style={{ fontSize: 10, color: p.amber, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: p.amber, animation: "pulse 1.5s infinite" }} />
              {activeAgent} running...
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {[["0", "Listings"], ["0", "Views"], ["0", "Sales"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: p.text, fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: p.muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Snow Orchestrator ── */}
      <div style={{ background: p.card, border: `1px solid ${p.accent}22`, borderRadius: 14, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${p.accent}55, transparent)` }} />
        <div style={{ width: 56, height: 56, borderRadius: 14, background: p.accentDim, border: `1px solid ${p.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <SleepingCat color="#e8d4b8" size={44} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: p.accent, marginBottom: 2 }}>Orchestrator</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: p.text, marginBottom: 1 }}>Snow</div>
          <div style={{ fontSize: 10, color: p.muted, fontFamily: "monospace" }}>claude-opus-4.6 · supervising all agents</div>
        </div>
        <div style={{ fontSize: 10, color: p.muted, lineHeight: 1.9, textAlign: "center", padding: "0 20px", borderLeft: `1px solid ${p.border}`, borderRight: `1px solid ${p.border}` }}>
          Reviews proposals<br />Directs design style<br />Filters off-brand ideas
        </div>
        <div style={{ textAlign: "right" }}>
          <Pill label="● Supervising" color={p.accent} bg={p.accentDim} />
          {report && <div style={{ fontSize: 10, color: p.muted, marginTop: 6, fontFamily: "monospace" }}>Last report: {report.created_at || "—"}</div>}
        </div>
      </div>

      {/* ── Main Grid: Research | Design ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>

        {/* Research Agent */}
        <div style={{ background: p.card, border: activeAgent === "Research Agent" ? `1px solid ${p.blue}55` : `1px solid ${p.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.4s" }}>
          <CardHeader
            cat={<AlertCat color={p.blue} size={30} active={activeAgent === "Research Agent"} />}
            name="Research Agent" model="haiku-4.5"
            statusLabel={activeAgent === "Research Agent" ? "Running" : "Idle"}
            statusColor={activeAgent === "Research Agent" ? p.blue : p.muted}
            statusBg={p.blueDim}
            active={activeAgent === "Research Agent"}
          />
          <Terminal
            line1={`→ Scanning Etsy trends...`}
            line2={`${pending.length} proposals queued`}
            color={p.blue}
          />
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: p.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Awaiting approval</span>
              {pending.length > 0 && <span style={{ background: "#8b2020", color: "#ffaaaa", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{pending.length}</span>}
            </div>
            {pending.length === 0 && <div style={{ fontSize: 11, color: p.faint, textAlign: "center", padding: "14px 0" }}>No pending proposals</div>}
            {proposals.map(pr => (
              <div key={pr.id} style={{ background: p.surface, border: pr.status === "approved" ? `1px solid ${p.green}44` : `1px solid ${p.faint}`, borderRadius: 9, padding: "9px 11px", marginBottom: 6, opacity: pr.status === "rejected" ? 0.4 : 1, transition: "all 0.3s" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: p.text, marginBottom: 2, lineHeight: 1.4 }}>{pr.title}</div>
                <div style={{ fontSize: 10, color: p.muted, fontFamily: "monospace", marginBottom: pr.status === "pending" ? 7 : 0 }}>{pr.meta}</div>
                {pr.status === "pending" && (
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decide(pr.id, "approved")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 6, cursor: "pointer", fontWeight: 700, background: p.greenDim, color: p.green, border: `1px solid ${p.green}44` }}>✓ Approve</button>
                    <button onClick={() => decide(pr.id, "rejected")} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 700, background: "#2a1010", color: "#f87171", border: "1px solid #4a2020" }}>✗</button>
                  </div>
                )}
                {pr.status !== "pending" && (
                  <div style={{ fontSize: 10, color: pr.status === "approved" ? p.green : "#f87171", fontFamily: "monospace" }}>
                    {pr.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Design Agent */}
        <div style={{ background: p.card, border: activeAgent === "Design Agent" ? `1px solid ${p.amber}55` : `1px solid ${p.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.4s" }}>
          <CardHeader
            cat={<ArtistCat color={p.amber} size={30} active={activeAgent === "Design Agent"} />}
            name="Design Agent" model="flux-schnell · replicate"
            statusLabel={activeAgent === "Design Agent" ? "Running" : designs.length > 0 ? "Review" : "Waiting"}
            statusColor={activeAgent === "Design Agent" ? p.amber : designs.length > 0 ? p.accent : p.muted}
            statusBg={p.amberDim}
            active={activeAgent === "Design Agent"}
          />
          <Terminal
            line1="⏳ Awaiting approved proposals..."
            line2={`${designs.length} design(s) ready for review`}
            color={p.amber}
          />
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: p.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Designs awaiting review</span>
              {designs.length > 0 && <span style={{ background: "#6b4a10", color: "#fbbf24", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{designs.length}</span>}
            </div>
            {designs.length === 0 && <div style={{ fontSize: 11, color: p.faint, textAlign: "center", padding: "20px 0" }}>No designs ready yet</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {designs.map(d => (
                <div key={d.id} style={{ background: p.surface, border: `1px solid ${p.faint}`, borderRadius: 10, overflow: "hidden" }}>
                  {d.image_url && (
                    <div style={{ position: "relative" }}>
                      <img src={d.image_url} alt={d.title} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                      <button onClick={() => setSelectedDesign(d)} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: 5, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>⛶</button>
                    </div>
                  )}
                  <div style={{ padding: "8px 9px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: p.text, marginBottom: 6, lineHeight: 1.3 }}>{d.title?.slice(0, 48)}{d.title?.length > 48 ? "…" : ""}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => decideDesign(d.id, "design_approved")} style={{ flex: 1, fontSize: 9, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: p.greenDim, color: p.green, border: `1px solid ${p.green}44` }}>✓</button>
                      <button onClick={() => decideDesign(d.id, "design_rejected")} style={{ flex: 1, fontSize: 9, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#2a1010", color: "#f87171", border: "1px solid #4a2020" }}>✗ Redo</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Bottom Grid: Listing | Feedback + Activity ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>

        {/* Listing Agent */}
        <div style={{ background: p.card, border: activeAgent === "Listing Agent" ? `1px solid ${p.green}55` : `1px solid ${p.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.4s" }}>
          <CardHeader
            cat={<ProudCat color={p.green} size={30} active={activeAgent === "Listing Agent"} />}
            name="Listing Agent" model={`haiku-4.5 · ${listings.length} ready`}
            statusLabel={activeAgent === "Listing Agent" ? "Running" : listings.length > 0 ? `${listings.length} Ready` : "Idle"}
            statusColor={activeAgent === "Listing Agent" ? p.green : listings.length > 0 ? p.accent : p.muted}
            statusBg={p.greenDim}
            active={activeAgent === "Listing Agent"}
          />
          <Terminal
            line1="→ Writes SEO titles · descriptions · tags"
            line2={`${listings.length} listing(s) ready to upload to Etsy`}
            color={p.green}
          />
          <div style={{ padding: 12 }}>
            {listings.length === 0 && <div style={{ fontSize: 11, color: p.faint, textAlign: "center", padding: "20px 0" }}>No listings ready yet</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
              {listings.map(l => (
                <div key={l.id} onClick={() => setSelectedListing(l)} style={{ background: p.surface, border: `1px solid ${p.accent}22`, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${p.accent}55`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = `${p.accent}22`}>
                  {l.image_url && (
                    <div style={{ position: "relative" }}>
                      <img src={l.image_url} alt={l.title} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(transparent, rgba(10,8,5,0.8))" }} />
                      <div style={{ position: "absolute", bottom: 6, left: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: p.accent, fontFamily: "monospace" }}>{l.price}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: p.text, marginBottom: 6, lineHeight: 1.3 }}>{l.title?.slice(0, 50)}{l.title?.length > 50 ? "…" : ""}</div>
                    <div style={{ fontSize: 9, color: p.muted, marginBottom: 7, fontFamily: "monospace" }}>{l.tags?.split(",").length || 0} tags · click to preview</div>
                    <button onClick={e => { e.stopPropagation(); }} style={{ width: "100%", fontSize: 10, padding: "5px", borderRadius: 6, cursor: "pointer", fontWeight: 700, background: p.accentDim, color: p.accent, border: `1px solid ${p.accent}44` }}>
                      📤 Upload to Etsy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Feedback + Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Feedback Agent */}
          <div style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 14, overflow: "hidden" }}>
            <CardHeader
              cat={<WatchfulCat color={p.terra} size={28} />}
              name="Feedback Agent" model="haiku-4.5"
              statusLabel="Idle"
              statusColor={p.muted}
              statusBg={p.terraDim}
              active={false}
            />
            <div style={{ padding: 12 }}>
              <div style={{ background: p.surface, borderRadius: 8, padding: "9px 11px", fontFamily: "monospace", fontSize: 10, color: p.muted, lineHeight: 1.9 }}>
                → Next recap in 6 days<br />
                <span style={{ color: p.faint }}>0 listings tracked</span>
              </div>
            </div>
          </div>

          {/* Activity — collapsible */}
          <div style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 14, overflow: "hidden" }}>
            <button onClick={() => setActivityOpen(!activityOpen)}
              style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: p.muted }}>
              <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Activity Log</span>
              <span style={{ fontSize: 14, transition: "transform 0.2s", transform: activityOpen ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            {activityOpen && (
              <div style={{ padding: "0 12px 12px" }}>
                {[
                  { icon: "🔍", text: "3 proposals sent to Airtable", time: "2m" },
                  { icon: "📤", text: "Listing uploaded", time: "3h" },
                  { icon: "🎨", text: "3 images generated", time: "3h" },
                  { icon: "📊", text: "Weekly recap sent", time: "1d" },
                ].map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i < 3 ? `1px solid ${p.faint}` : "none", alignItems: "center" }}>
                    <span style={{ fontSize: 12 }}>{a.icon}</span>
                    <span style={{ flex: 1, fontSize: 11, color: p.muted }}>{a.text}</span>
                    <span style={{ fontSize: 9, color: p.faint, fontFamily: "monospace" }}>{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Snow Report — collapsible ── */}
      <div style={{ background: p.card, border: `1px solid ${p.accent}22`, borderRadius: 14, overflow: "hidden" }}>
        <button onClick={() => setReportOpen(!reportOpen)}
          style={{ width: "100%", padding: "13px 18px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, color: p.text }}>
          <SleepingCat color="#c4a06a" size={24} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>Snow's Last Report</span>
          {report?.priority_niche && <span style={{ fontSize: 10, color: p.muted, fontFamily: "monospace" }}>Priority: {report.priority_niche}</span>}
          <span style={{ marginLeft: "auto", fontSize: 14, color: p.muted, transition: "transform 0.2s", transform: reportOpen ? "rotate(180deg)" : "none" }}>▾</span>
        </button>
        {reportOpen && (
          <div style={{ padding: "0 18px 16px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: p.muted, marginBottom: 6 }}>Summary</div>
              <div style={{ fontSize: 12, color: p.text, lineHeight: 1.7, background: p.surface, borderRadius: 8, padding: "10px 12px" }}>
                {report?.summary || "No report yet — run the pipeline to generate Snow's first report."}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: p.muted, marginBottom: 6 }}>Design Direction</div>
              <div style={{ fontSize: 11, color: p.muted, lineHeight: 1.7, background: p.surface, borderRadius: 8, padding: "10px 12px" }}>
                {report?.design_direction || "Pending first run"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Design Modal ── */}
      {selectedDesign && (
        <div onClick={() => setSelectedDesign(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 16, overflow: "hidden", maxWidth: 540, width: "90%", cursor: "default" }}>
            <img src={selectedDesign.image_url} alt={selectedDesign.title} style={{ width: "100%", maxHeight: 460, objectFit: "contain", background: p.surface, display: "block" }} />
            <div style={{ padding: "14px 16px", borderTop: `1px solid ${p.faint}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.text, marginBottom: 10 }}>{selectedDesign.title}</div>
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={() => { decideDesign(selectedDesign.id, "design_approved"); setSelectedDesign(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: p.greenDim, color: p.green, border: `1px solid ${p.green}44` }}>✓ Approve</button>
                <button onClick={() => { decideDesign(selectedDesign.id, "design_rejected"); setSelectedDesign(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "#2a1010", color: "#f87171", border: "1px solid #4a2020" }}>✗ Redo</button>
                <button onClick={() => setSelectedDesign(null)} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, background: p.faint, color: p.muted, border: "none" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Listing Modal ── */}
      {selectedListing && (
        <div onClick={() => setSelectedListing(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: p.card, border: `1px solid ${p.border}`, borderRadius: 16, overflow: "hidden", maxWidth: 600, width: "90%", cursor: "default", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {selectedListing.image_url && (
              <img src={selectedListing.image_url} alt={selectedListing.title} style={{ width: "100%", height: "100%", minHeight: 280, objectFit: "cover", display: "block" }} />
            )}
            <div style={{ padding: "18px 16px", overflowY: "auto", maxHeight: 420 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.text, marginBottom: 5, lineHeight: 1.4 }}>{selectedListing.title}</div>
              <div style={{ fontSize: 15, color: p.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 10 }}>{selectedListing.price}</div>
              <div style={{ fontSize: 10, color: p.muted, lineHeight: 1.7, marginBottom: 8 }}>{selectedListing.description?.slice(0, 220)}...</div>
              <div style={{ fontSize: 10, color: p.faint, fontFamily: "monospace", marginBottom: 12, lineHeight: 1.6 }}>🏷️ {selectedListing.tags}</div>
              <button style={{ width: "100%", padding: "9px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: p.accentDim, color: p.accent, border: `1px solid ${p.accent}44`, marginBottom: 6 }}>📤 Upload to Etsy</button>
              <button onClick={() => setSelectedListing(null)} style={{ width: "100%", padding: "7px", borderRadius: 8, cursor: "pointer", fontSize: 11, background: p.faint, color: p.muted, border: "none" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}