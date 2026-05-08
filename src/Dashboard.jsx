import { useState } from "react";
import { useProposals, useDesigns } from "./useAirtable";

const ACTIVITY = [
  { icon: "🔍", text: "3 proposals sent to Airtable", time: "2m" },
  { icon: "📤", text: "Listing uploaded", time: "3h" },
  { icon: "🎨", text: "3 images generated", time: "3h" },
  { icon: "📊", text: "Weekly recap sent", time: "1d" },
];

export default function Dashboard() {
  const { proposals, decide } = useProposals();
  const { designs, decideDesign } = useDesigns();
  const [keywords, setKeywords] = useState("");
  const [launching, setLaunching] = useState(false);

  const pending = proposals.filter(p => p.status === "pending");

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => setLaunching(false), 3000);
  };

  return (
    <div style={{ background: "#080810", minHeight: "100vh", fontFamily: "Segoe UI, sans-serif", color: "#e2e2f0", padding: "20px 24px" }}>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #1a1a2e" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Agent Operations Center</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#fff" }}>
            Project<span style={{ color: "#7c6aff" }}>S</span>now
          </div>
        </div>

        {/* Launch Pipeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="Keywords for Snow... (e.g. japandi, wabi sabi)"
            style={{ background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 8, padding: "9px 14px", color: "#ccc", fontSize: 12, width: 300, outline: "none", fontFamily: "monospace" }}
          />
          <button
            onClick={handleLaunch}
            style={{ background: launching ? "#22c55e22" : "#7c6aff", color: launching ? "#22c55e" : "#fff", border: launching ? "1px solid #22c55e44" : "none", borderRadius: 8, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 1, transition: "all 0.3s" }}>
            {launching ? "✓ Launched!" : "❄️ Launch Pipeline"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 24 }}>
          {[["0", "Listings"], ["0", "Views"], ["0", "Sales"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Snow Orchestrator */}
      <div style={{ background: "#0d0d1a", border: "1px solid #7c6aff33", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #7c6aff, transparent)" }} />
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1a1530", border: "2px solid #7c6aff44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#7c6aff", marginBottom: 3 }}>Orchestrator</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Snow</div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>claude-opus-4.6 · supervising all agents</div>
        </div>
        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, textAlign: "right" }}>
          Reviews proposals · Directs design style<br />
          Filters off-brand ideas · Weekly reports
        </div>
        <div style={{ background: "#7c6aff22", border: "1px solid #7c6aff33", color: "#7c6aff", fontSize: 10, letterSpacing: 1, padding: "5px 14px", borderRadius: 20 }}>● Supervising</div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        {/* Research Agent */}
        <div style={{ background: "#0d0d1a", border: "1px solid #22c55e22", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1530", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative" }}>
              🔍
              <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "#22c55e", border: "2px solid #0d0d1a" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e2f0" }}>Research Agent</div>
              <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e33" }}>Running</span>
          </div>
          <div style={{ padding: "10px 16px", background: "#060610", borderBottom: "1px solid #111", fontFamily: "monospace", fontSize: 10, color: "#555", lineHeight: 1.8 }}>
            <span style={{ color: "#22c55e" }}>→</span> Scanning Etsy trends...<br />
            <span style={{ color: "#333" }}>{pending.length} proposals in queue</span>
          </div>

          {/* Research proposals */}
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Proposals awaiting your approval</span>
              {pending.length > 0 && <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{pending.length}</span>}
            </div>
            {pending.length === 0 && (
              <div style={{ fontSize: 11, color: "#333", textAlign: "center", padding: "12px 0" }}>No pending proposals</div>
            )}
            {proposals.map(p => (
              <div key={p.id} style={{ background: "#060610", border: p.status === "approved" ? "1px solid #22c55e33" : "1px solid #111", borderRadius: 8, padding: "10px 12px", marginBottom: 6, opacity: p.status === "rejected" ? 0.4 : 1, transition: "all 0.3s" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 2, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace", marginBottom: p.status === "pending" ? 8 : 4 }}>{p.meta}</div>
                {p.status === "pending" ? (
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decide(p.id, "approved")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e33" }}>✓ Approve</button>
                    <button onClick={() => decide(p.id, "rejected")} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433" }}>✗</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: p.status === "approved" ? "#22c55e" : "#ef4444", fontFamily: "monospace" }}>
                    {p.status === "approved" ? "✓ Approved — sent to Design Agent" : "✗ Rejected"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Design Agent */}
        <div style={{ background: "#0d0d1a", border: "1px solid #f59e0b22", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1520", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative" }}>
              🎨
              <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "#f59e0b", border: "2px solid #0d0d1a" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e2f0" }}>Design Agent</div>
              <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>flux-schnell · replicate</div>
            </div>
            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b33" }}>Waiting</span>
          </div>
          <div style={{ padding: "10px 16px", background: "#060610", borderBottom: "1px solid #111", fontFamily: "monospace", fontSize: 10, color: "#555", lineHeight: 1.8 }}>
            <span style={{ color: "#f59e0b" }}>⏳</span> Awaiting approved proposals...<br />
            <span style={{ color: "#333" }}>{designs.length} design(s) ready for review</span>
          </div>

          {/* Design Review */}
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Designs awaiting your review</span>
              {designs.length > 0 && <span style={{ background: "#f59e0b", color: "#000", fontSize: 9, borderRadius: 20, padding: "1px 7px" }}>{designs.length}</span>}
            </div>
            {designs.length === 0 && (
              <div style={{ fontSize: 11, color: "#333", textAlign: "center", padding: "12px 0" }}>No designs ready yet</div>
            )}
            {designs.map(d => (
              <div key={d.id} style={{ background: "#060610", border: "1px solid #111", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                {d.image_url && <img src={d.image_url} alt={d.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc", marginBottom: 8, lineHeight: 1.4 }}>{d.title}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decideDesign(d.id, "design_approved")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e33" }}>✓ Approve</button>
                    <button onClick={() => decideDesign(d.id, "design_rejected")} style={{ flex: 1, fontSize: 10, padding: "4px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#ef444422", color: "#ef4444", border: "1px solid #ef444433" }}>✗ Redo</button>
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
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1515", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e2f0" }}>Listing Agent</div>
              <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#1a1a2e", color: "#555", border: "1px solid #222" }}>Idle</span>
          </div>
          <div style={{ background: "#060610", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: "#555", lineHeight: 1.8 }}>
            → Writes SEO titles + tags<br />
            <span style={{ color: "#333" }}>Awaiting approved designs</span>
          </div>
        </div>

        {/* Feedback Agent */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0f1a15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e2f0" }}>Feedback Agent</div>
              <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>haiku-4.5</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#1a1a2e", color: "#555", border: "1px solid #222" }}>Idle</span>
          </div>
          <div style={{ background: "#060610", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: "#555", lineHeight: 1.8 }}>
            → Next recap in 6 days<br />
            <span style={{ color: "#333" }}>0 listings tracked</span>
          </div>
        </div>

        {/* Activity */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 10 }}>Activity</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid #0f0f18" : "none", alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: 11, color: "#555" }}>{a.text}</span>
              <span style={{ fontSize: 9, color: "#333", fontFamily: "monospace" }}>{a.time}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}