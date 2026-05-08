import { useState } from "react";
import { useProposals, useDesigns, useReadyListings } from "./useAirtable";

const ACTIVITY = [
  { icon: "🔍", text: "3 proposals sent to Airtable", time: "2m" },
  { icon: "📤", text: "Listing uploaded", time: "3h" },
  { icon: "🎨", text: "3 images generated", time: "3h" },
  { icon: "📊", text: "Weekly recap sent", time: "1d" },
];

const SnowIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="10" r="6" fill="white" opacity="0.95"/>
    <ellipse cx="14" cy="22" rx="8" ry="5" fill="white" opacity="0.85"/>
    <circle cx="12" cy="9" r="1" fill="#7c6aff"/>
    <circle cx="16" cy="9" r="1" fill="#7c6aff"/>
    <path d="M12 12 Q14 13.5 16 12" stroke="#7c6aff" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <circle cx="8" cy="6" r="1.5" fill="white" opacity="0.6"/>
    <circle cx="20" cy="4" r="1" fill="white" opacity="0.5"/>
    <circle cx="22" cy="10" r="1" fill="white" opacity="0.4"/>
  </svg>
);

export default function Dashboard() {
  const { proposals, decide } = useProposals();
  const { designs, decideDesign } = useDesigns();
  const { listings } = useReadyListings();
  const [keywords, setKeywords] = useState("");
  const [launching, setLaunching] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);

  const pending = proposals.filter(p => p.status === "pending");

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => setLaunching(false), 3000);
  };

  const soft = {
    bg: "#0c0c14",
    card: "#12121e",
    cardBorder: "#1e1e30",
    screen: "#0a0a12",
    text: "#d4d4e8",
    muted: "#6b6b8a",
    faint: "#2a2a40",
  };

  return (
    <div style={{ background: soft.bg, minHeight: "100vh", fontFamily: "Segoe UI, sans-serif", color: soft.text, padding: "20px 24px" }}>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${soft.cardBorder}` }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: soft.muted, marginBottom: 4 }}>Agent Operations Center</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#fff" }}>
            Project<span style={{ color: "#9d8fff" }}>S</span>now
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="Keywords for Snow... (e.g. japandi, wabi sabi)"
            style={{ background: soft.card, border: `1px solid ${soft.faint}`, borderRadius: 8, padding: "9px 14px", color: soft.text, fontSize: 12, width: 300, outline: "none", fontFamily: "monospace" }}
          />
          <button
            onClick={handleLaunch}
            style={{ background: launching ? "#1e3a2a" : "#2d2550", color: launching ? "#6ee7a0" : "#c4b5fd", border: launching ? "1px solid #2d5a3d" : "1px solid #4a3a8a", borderRadius: 8, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 1, transition: "all 0.3s" }}>
            {launching ? "✓ Launched!" : "❄️ Launch Pipeline"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {[["0", "Listings"], ["0", "Views"], ["0", "Sales"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: soft.muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Snow */}
      <div style={{ background: soft.card, border: "1px solid #2d2550", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #6d5acd, transparent)" }} />
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1e1830", border: "1px solid #3d3070", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <SnowIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#9d8fff", marginBottom: 3 }}>Orchestrator</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Snow</div>
          <div style={{ fontSize: 11, color: soft.muted, fontFamily: "monospace" }}>claude-opus-4.6 · supervising all agents</div>
        </div>
        <div style={{ fontSize: 11, color: soft.muted, lineHeight: 1.8, textAlign: "right" }}>
          Reviews proposals · Directs design style<br />
          Filters off-brand ideas · Weekly reports
        </div>
        <div style={{ background: "#1e1830", border: "1px solid #3d3070", color: "#9d8fff", fontSize: 10, letterSpacing: 1, padding: "5px 14px", borderRadius: 20 }}>● Supervising</div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        {/* Research Agent */}
        <div style={{ background: soft.card, border: "1px solid #1a2e1a", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${soft.faint}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#141a14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative" }}>
              🔍
              <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "#4ade80", border: `2px solid ${soft.card}` }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: soft.text }}>Research Agent</div>
              <div style={{ fontSize: 10, color: soft.muted, fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>Running</span>
          </div>
          <div style={{ padding: "10px 16px", background: soft.screen, borderBottom: `1px solid ${soft.faint}`, fontFamily: "monospace", fontSize: 10, color: soft.muted, lineHeight: 1.8 }}>
            <span style={{ color: "#4ade80" }}>→</span> Scanning Etsy trends...<br />
            <span style={{ color: soft.faint }}>{pending.length} proposals in queue</span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: soft.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Proposals awaiting approval</span>
              {pending.length > 0 && <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{pending.length}</span>}
            </div>
            {pending.length === 0 && <div style={{ fontSize: 11, color: soft.faint, textAlign: "center", padding: "12px 0" }}>No pending proposals</div>}
            {proposals.map(p => (
              <div key={p.id} style={{ background: soft.screen, border: p.status === "approved" ? "1px solid #2d4a2d" : `1px solid ${soft.faint}`, borderRadius: 8, padding: "10px 12px", marginBottom: 6, opacity: p.status === "rejected" ? 0.4 : 1, transition: "all 0.3s" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: soft.text, marginBottom: 2, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: 10, color: soft.muted, fontFamily: "monospace", marginBottom: p.status === "pending" ? 8 : 4 }}>{p.meta}</div>
                {p.status === "pending" ? (
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decide(p.id, "approved")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>✓ Approve</button>
                    <button onClick={() => decide(p.id, "rejected")} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#2e1a1a", color: "#f87171", border: "1px solid #4a2d2d" }}>✗</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: p.status === "approved" ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                    {p.status === "approved" ? "✓ Approved — sent to Design Agent" : "✗ Rejected"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Design Agent */}
        <div style={{ background: soft.card, border: "1px solid #2e2a1a", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${soft.faint}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1814", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative" }}>
              🎨
              <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "#fbbf24", border: `2px solid ${soft.card}` }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: soft.text }}>Design Agent</div>
              <div style={{ fontSize: 10, color: soft.muted, fontFamily: "monospace" }}>flux-schnell · replicate</div>
            </div>
            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: "#2e2a1a", color: "#fbbf24", border: "1px solid #4a421a" }}>Waiting</span>
          </div>
          <div style={{ padding: "10px 16px", background: soft.screen, borderBottom: `1px solid ${soft.faint}`, fontFamily: "monospace", fontSize: 10, color: soft.muted, lineHeight: 1.8 }}>
            <span style={{ color: "#fbbf24" }}>⏳</span> Awaiting approved proposals...<br />
            <span style={{ color: soft.faint }}>{designs.length} design(s) ready for review</span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: soft.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Designs awaiting review</span>
              {designs.length > 0 && <span style={{ background: "#fbbf24", color: "#000", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{designs.length}</span>}
            </div>
            {designs.length === 0 && <div style={{ fontSize: 11, color: soft.faint, textAlign: "center", padding: "12px 0" }}>No designs ready yet</div>}
            {designs.map(d => (
              <div key={d.id} style={{ background: soft.screen, border: `1px solid ${soft.faint}`, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                {d.image_url && <img src={d.image_url} alt={d.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: soft.text, marginBottom: 8, lineHeight: 1.4 }}>{d.title}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decideDesign(d.id, "design_approved")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>✓ Approve</button>
                    <button onClick={() => decideDesign(d.id, "design_rejected")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#2e1a1a", color: "#f87171", border: "1px solid #4a2d2d" }}>✗ Redo</button>
                    <button onClick={() => setSelectedDesign(d)} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, cursor: "pointer", background: soft.faint, color: soft.muted, border: `1px solid ${soft.faint}` }}>⛶</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* Listing Agent */}
        <div style={{ background: soft.card, border: `1px solid ${soft.cardBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${soft.faint}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#141418", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: soft.text }}>Listing Agent</div>
              <div style={{ fontSize: 10, color: soft.muted, fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: soft.faint, color: soft.muted, border: `1px solid ${soft.faint}` }}>Idle</span>
          </div>
          <div style={{ padding: "10px 16px", background: soft.screen, borderBottom: `1px solid ${soft.faint}`, fontFamily: "monospace", fontSize: 10, color: soft.muted, lineHeight: 1.8 }}>
            → Writes SEO titles + tags<br />
            <span style={{ color: soft.faint }}>{listings.length} listing(s) ready to upload</span>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: soft.muted, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Ready to upload</span>
              {listings.length > 0 && <span style={{ background: "#9d8fff", color: "#fff", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{listings.length}</span>}
            </div>
            {listings.length === 0 && <div style={{ fontSize: 11, color: soft.faint, textAlign: "center", padding: "12px 0" }}>No listings ready yet</div>}
            {listings.map(l => (
              <div key={l.id} style={{ background: soft.screen, border: "1px solid #2d2550", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                {l.image_url && <img src={l.image_url} alt={l.title} style={{ width: "100%", height: 90, objectFit: "cover" }} />}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: soft.text, marginBottom: 4, lineHeight: 1.4 }}>{l.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#9d8fff", fontFamily: "monospace", fontWeight: 700 }}>{l.price}</span>
                    <span style={{ fontSize: 9, color: soft.muted, fontFamily: "monospace" }}>{l.tags?.split(",").length || 0} tags</span>
                  </div>
                  <button style={{ width: "100%", fontSize: 10, padding: "5px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#1e1830", color: "#9d8fff", border: "1px solid #3d3070" }}>
                    📤 Upload to Etsy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Agent */}
        <div style={{ background: soft.card, border: `1px solid ${soft.cardBorder}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#141a14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: soft.text }}>Feedback Agent</div>
              <div style={{ fontSize: 10, color: soft.muted, fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: soft.faint, color: soft.muted, border: `1px solid ${soft.faint}` }}>Idle</span>
          </div>
          <div style={{ background: soft.screen, borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: soft.muted, lineHeight: 1.8 }}>
            → Next recap in 6 days<br />
            <span style={{ color: soft.faint }}>0 listings tracked</span>
          </div>
        </div>

        {/* Activity */}
        <div style={{ background: soft.card, border: `1px solid ${soft.cardBorder}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: soft.muted, marginBottom: 10 }}>Activity</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${soft.faint}` : "none", alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 11, color: soft.muted }}>{a.text}</span>
              <span style={{ fontSize: 9, color: soft.faint, fontFamily: "monospace" }}>{a.time}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Modal */}
      {selectedDesign && (
        <div onClick={() => setSelectedDesign(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: soft.card, border: `1px solid ${soft.faint}`, borderRadius: 16, overflow: "hidden", maxWidth: 600, width: "90%", cursor: "default" }}>
            <img src={selectedDesign.image_url} alt={selectedDesign.title} style={{ width: "100%", maxHeight: 500, objectFit: "contain", background: soft.screen }} />
            <div style={{ padding: "16px 20px", borderTop: `1px solid ${soft.faint}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>{selectedDesign.title}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { decideDesign(selectedDesign.id, "design_approved"); setSelectedDesign(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "#1a2e1a", color: "#4ade80", border: "1px solid #2d4a2d" }}>✓ Approve</button>
                <button onClick={() => { decideDesign(selectedDesign.id, "design_rejected"); setSelectedDesign(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "#2e1a1a", color: "#f87171", border: "1px solid #4a2d2d" }}>✗ Redo</button>
                <button onClick={() => setSelectedDesign(null)} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, background: soft.faint, color: soft.muted, border: `1px solid ${soft.faint}` }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}