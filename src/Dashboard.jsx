import { useState } from "react";
import { useProposals, useDesigns, useReadyListings } from "./useAirtable";

const ACTIVITY = [
  { icon: "🔍", text: "3 proposals sent to Airtable", time: "2m" },
  { icon: "📤", text: "Listing uploaded", time: "3h" },
  { icon: "🎨", text: "3 images generated", time: "3h" },
  { icon: "📊", text: "Weekly recap sent", time: "1d" },
];

const c = {
  bg: "#141009",
  card: "#1c1610",
  cardBorder: "#2a2018",
  screen: "#110e08",
  text: "#e8ddd0",
  muted: "#8a7a6a",
  faint: "#2e2418",
  accent: "#c4a882",
  accentDim: "#3d2e1e",
};

const SnowIcon = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="10" r="6" fill="#f5ede0" opacity="0.95"/>
    <ellipse cx="14" cy="22" rx="8" ry="5" fill="#f5ede0" opacity="0.85"/>
    <circle cx="12" cy="9" r="1" fill="#8a6a4a"/>
    <circle cx="16" cy="9" r="1" fill="#8a6a4a"/>
    <path d="M12 12 Q14 13.5 16 12" stroke="#8a6a4a" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <circle cx="8" cy="5" r="1.5" fill="#f5ede0" opacity="0.5"/>
    <circle cx="21" cy="4" r="1" fill="#f5ede0" opacity="0.4"/>
  </svg>
);

const Tag = ({ label, color = c.muted, bg = c.faint }) => (
  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: bg, color, border: `1px solid ${color}22`, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
);

export default function Dashboard() {
  const { proposals, decide } = useProposals();
  const { designs, decideDesign } = useDesigns();
  const { listings } = useReadyListings();
  const [keywords, setKeywords] = useState("");
  const [launching, setLaunching] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  const pending = proposals.filter(p => p.status === "pending");

  return (
    <div style={{ background: c.bg, minHeight: "100vh", fontFamily: "Segoe UI, sans-serif", color: c.text, padding: "20px 24px" }}>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${c.cardBorder}` }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: c.muted, marginBottom: 4 }}>Agent Operations Center</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: c.text }}>
            Project<span style={{ color: c.accent }}>S</span>now
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="Keywords for Snow... (japandi, wabi sabi...)"
            style={{ background: c.card, border: `1px solid ${c.faint}`, borderRadius: 8, padding: "9px 14px", color: c.text, fontSize: 12, width: 280, outline: "none", fontFamily: "monospace" }}
          />
          <button onClick={() => { setLaunching(true); setTimeout(() => setLaunching(false), 3000); }}
            style={{ background: launching ? c.faint : c.accentDim, color: launching ? "#a0c080" : c.accent, border: `1px solid ${launching ? "#4a6a30" : c.accent}44`, borderRadius: 8, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.3s" }}>
            {launching ? "✓ Launched!" : "❄️ Launch Pipeline"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["0", "Listings"], ["0", "Views"], ["0", "Sales"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.text, fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: c.muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Snow */}
      <div style={{ background: c.card, border: `1px solid ${c.accent}22`, borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${c.accent}66, transparent)` }} />
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: c.accentDim, border: `1px solid ${c.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <SnowIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: c.accent, marginBottom: 2 }}>Orchestrator</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Snow</div>
          <div style={{ fontSize: 11, color: c.muted, fontFamily: "monospace" }}>claude-opus-4.6 · supervising all agents</div>
        </div>
        <div style={{ fontSize: 11, color: c.muted, lineHeight: 1.8, textAlign: "right" }}>
          Reviews proposals · Directs design style<br/>Filters off-brand ideas · Weekly reports
        </div>
        <Tag label="● Supervising" color={c.accent} bg={c.accentDim} />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        {/* Research Agent */}
        <div style={{ background: c.card, border: `1px solid #1e2e1e`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.faint}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#141a14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, position: "relative" }}>
              🔍<span style={{ position: "absolute", bottom: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", border: `2px solid ${c.card}` }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Research Agent</div>
              <div style={{ fontSize: 10, color: c.muted, fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <Tag label="Running" color="#4ade80" bg="#1a2e1a" />
          </div>
          <div style={{ padding: "8px 16px", background: c.screen, borderBottom: `1px solid ${c.faint}`, fontFamily: "monospace", fontSize: 10, color: c.muted, lineHeight: 1.8 }}>
            <span style={{ color: "#4ade80" }}>→</span> Scanning Etsy trends · {pending.length} proposals queued
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: c.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Proposals awaiting approval</span>
              {pending.length > 0 && <span style={{ background: "#c0392b", color: "#fff", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{pending.length}</span>}
            </div>
            {pending.length === 0 && <div style={{ fontSize: 11, color: c.faint, textAlign: "center", padding: "10px 0" }}>No pending proposals</div>}
            {proposals.map(p => (
              <div key={p.id} style={{ background: c.screen, border: p.status === "approved" ? "1px solid #2d4a2d" : `1px solid ${c.faint}`, borderRadius: 8, padding: "10px 12px", marginBottom: 6, opacity: p.status === "rejected" ? 0.4 : 1, transition: "all 0.3s" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 2, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: 10, color: c.muted, fontFamily: "monospace", marginBottom: p.status === "pending" ? 8 : 0 }}>{p.meta}</div>
                {p.status === "pending" && (
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decide(p.id, "approved")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>✓ Approve</button>
                    <button onClick={() => decide(p.id, "rejected")} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#2e1a1a", color: "#f87171", border: "1px solid #4a2d2d" }}>✗</button>
                  </div>
                )}
                {p.status !== "pending" && (
                  <div style={{ fontSize: 10, color: p.status === "approved" ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                    {p.status === "approved" ? "✓ Approved — sent to Design Agent" : "✗ Rejected"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Design Agent */}
        <div style={{ background: c.card, border: "1px solid #2e2810", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.faint}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1c1a10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, position: "relative" }}>
              🎨<span style={{ position: "absolute", bottom: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", border: `2px solid ${c.card}` }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Design Agent</div>
              <div style={{ fontSize: 10, color: c.muted, fontFamily: "monospace" }}>flux-schnell · replicate</div>
            </div>
            <Tag label="Waiting" color="#fbbf24" bg="#2e2810" />
          </div>
          <div style={{ padding: "8px 16px", background: c.screen, borderBottom: `1px solid ${c.faint}`, fontFamily: "monospace", fontSize: 10, color: c.muted, lineHeight: 1.8 }}>
            <span style={{ color: "#fbbf24" }}>⏳</span> Awaiting approved proposals · {designs.length} design(s) to review
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: c.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Designs awaiting review</span>
              {designs.length > 0 && <span style={{ background: "#b8860b", color: "#fff", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{designs.length}</span>}
            </div>
            {designs.length === 0 && <div style={{ fontSize: 11, color: c.faint, textAlign: "center", padding: "10px 0" }}>No designs ready yet</div>}
            <div style={{ display: "grid", gridTemplateColumns: designs.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
              {designs.map(d => (
                <div key={d.id} style={{ background: c.screen, border: `1px solid ${c.faint}`, borderRadius: 8, overflow: "hidden" }}>
                  {d.image_url && (
                    <div style={{ position: "relative" }}>
                      <img src={d.image_url} alt={d.title} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                      <button onClick={() => setSelectedDesign(d)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "3px 7px", fontSize: 10, cursor: "pointer" }}>⛶</button>
                    </div>
                  )}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: c.text, marginBottom: 6, lineHeight: 1.3 }}>{d.title?.slice(0, 50)}{d.title?.length > 50 ? "..." : ""}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => decideDesign(d.id, "design_approved")} style={{ flex: 1, fontSize: 9, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>✓</button>
                      <button onClick={() => decideDesign(d.id, "design_rejected")} style={{ flex: 1, fontSize: 9, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#2e1a1a", color: "#f87171", border: "1px solid #4a2d2d" }}>✗ Redo</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>

        {/* Listing Agent — bigger */}
        <div style={{ background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.faint}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#18141a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Listing Agent</div>
              <div style={{ fontSize: 10, color: c.muted, fontFamily: "monospace" }}>haiku-4.5 · {listings.length} ready</div>
            </div>
            <Tag label="Idle" color={c.muted} bg={c.faint} />
          </div>
          <div style={{ padding: 12 }}>
            {listings.length === 0 && (
              <div style={{ fontSize: 11, color: c.faint, textAlign: "center", padding: "20px 0" }}>No listings ready yet</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {listings.map(l => (
                <div key={l.id} style={{ background: c.screen, border: `1px solid ${c.accent}22`, borderRadius: 10, overflow: "hidden", cursor: "pointer" }} onClick={() => setSelectedListing(l)}>
                  {l.image_url && (
                    <div style={{ position: "relative" }}>
                      <img src={l.image_url} alt={l.title} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)" }} />
                      <div style={{ position: "absolute", bottom: 6, left: 8, right: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{l.price}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: c.text, marginBottom: 6, lineHeight: 1.3 }}>{l.title?.slice(0, 45)}{l.title?.length > 45 ? "..." : ""}</div>
                    <div style={{ fontSize: 9, color: c.muted, marginBottom: 8, fontFamily: "monospace" }}>{l.tags?.split(",").length || 0} tags</div>
                    <button style={{ width: "100%", fontSize: 10, padding: "5px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: c.accentDim, color: c.accent, border: `1px solid ${c.accent}44` }}>
                      📤 Upload to Etsy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Agent */}
        <div style={{ background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#141a14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>Feedback Agent</div>
              <div style={{ fontSize: 10, color: c.muted, fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <Tag label="Idle" color={c.muted} bg={c.faint} />
          </div>
          <div style={{ background: c.screen, borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: c.muted, lineHeight: 1.8 }}>
            → Next recap in 6 days<br/>
            <span style={{ color: c.faint }}>0 listings tracked</span>
          </div>
        </div>

        {/* Activity */}
        <div style={{ background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: c.muted, marginBottom: 10 }}>Activity</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${c.faint}` : "none", alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 11, color: c.muted }}>{a.text}</span>
              <span style={{ fontSize: 9, color: c.faint, fontFamily: "monospace" }}>{a.time}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Design Modal */}
      {selectedDesign && (
        <div onClick={() => setSelectedDesign(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: c.card, border: `1px solid ${c.faint}`, borderRadius: 16, overflow: "hidden", maxWidth: 560, width: "90%", cursor: "default" }}>
            <img src={selectedDesign.image_url} alt={selectedDesign.title} style={{ width: "100%", maxHeight: 480, objectFit: "contain", background: c.screen, display: "block" }} />
            <div style={{ padding: "14px 18px", borderTop: `1px solid ${c.faint}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>{selectedDesign.title}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { decideDesign(selectedDesign.id, "design_approved"); setSelectedDesign(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>✓ Approve</button>
                <button onClick={() => { decideDesign(selectedDesign.id, "design_rejected"); setSelectedDesign(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "#2e1a1a", color: "#f87171", border: "1px solid #4a2d2d" }}>✗ Redo</button>
                <button onClick={() => setSelectedDesign(null)} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, background: c.faint, color: c.muted, border: `1px solid ${c.faint}` }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing Modal */}
      {selectedListing && (
        <div onClick={() => setSelectedListing(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: c.card, border: `1px solid ${c.faint}`, borderRadius: 16, overflow: "hidden", maxWidth: 620, width: "90%", cursor: "default", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {selectedListing.image_url && (
              <img src={selectedListing.image_url} alt={selectedListing.title} style={{ width: "100%", height: "100%", minHeight: 300, objectFit: "cover", display: "block" }} />
            )}
            <div style={{ padding: "20px 18px", overflowY: "auto", maxHeight: 480 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 6, lineHeight: 1.4 }}>{selectedListing.title}</div>
              <div style={{ fontSize: 14, color: c.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 12 }}>{selectedListing.price}</div>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 8, lineHeight: 1.6 }}>{selectedListing.description?.slice(0, 200)}...</div>
              <div style={{ fontSize: 10, color: c.muted, fontFamily: "monospace", marginBottom: 14 }}>🏷️ {selectedListing.tags}</div>
              <button style={{ width: "100%", padding: "9px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: c.accentDim, color: c.accent, border: `1px solid ${c.accent}44`, marginBottom: 6 }}>
                📤 Upload to Etsy
              </button>
              <button onClick={() => setSelectedListing(null)} style={{ width: "100%", padding: "7px", borderRadius: 8, cursor: "pointer", fontSize: 11, background: c.faint, color: c.muted, border: "none" }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}