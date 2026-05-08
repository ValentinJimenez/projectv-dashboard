import { useProposals } from "./useAirtable";

const AGENTS = [
  { id: 1, name: "Research Agent", icon: "🔍", model: "haiku-4.5", color: "#1a1530", status: "running", task: "Scanning Etsy trends...", detail: "3 proposals queued" },
  { id: 2, name: "Design Agent", icon: "🎨", model: "flux-replicate", color: "#1a1520", status: "waiting", task: "Awaiting approval...", detail: "No brief received yet" },
  { id: 3, name: "Listing Agent", icon: "📤", model: "haiku-4.5", color: "#1a1515", status: "idle", task: "Last: 1 listing live", detail: "Awaiting design..." },
  { id: 4, name: "Feedback Agent", icon: "📊", model: "haiku-4.5", color: "#0f1a15", status: "idle", task: "Next recap in 6d", detail: "3 listings tracked" },
  { id: 5, name: "A/B Test Agent", icon: "+", model: "coming soon", color: "#111", status: "soon", task: "", detail: "" },
  { id: 6, name: "Pricing Agent", icon: "+", model: "coming soon", color: "#111", status: "soon", task: "", detail: "" },
];

const ACTIVITY = [
  { icon: "🔍", text: "3 proposals sent to Airtable", time: "2m" },
  { icon: "📤", text: "Listing uploaded", time: "3h" },
  { icon: "🎨", text: "3 images generated", time: "3h" },
  { icon: "📊", text: "Weekly recap sent", time: "1d" },
];

const MOCK_PROPOSALS = [
  { id: "p1", title: "Minimalist Graduation Wall Art", meta: "seasonal · medium", status: "pending" },
  { id: "p2", title: "Mental Health SVG Bundle", meta: "evergreen · low", status: "pending" },
  { id: "p3", title: "Spring Garden Planning Print", meta: "seasonal · medium", status: "pending" },
];

export default function Dashboard() {
  const { proposals, loading, decide } = useProposals();
const pending = proposals.filter(p => p.status === "pending");

  const getDeskStyle = (status) => {
    const base = {
      background: "#0d0d1a",
      border: "1px solid #1a1a2e",
      borderRadius: 10,
      padding: 13,
    };
    if (status === "running") return { ...base, borderColor: "#22c55e33" };
    if (status === "waiting") return { ...base, borderColor: "#f59e0b33" };
    if (status === "soon") return { ...base, border: "1px dashed #1a1a2e", opacity: 0.5 };
    return base;
  };

  const getPillStyle = (status) => {
    const base = { fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap" };
    if (status === "running") return { ...base, background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e33" };
    if (status === "waiting") return { ...base, background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b33" };
    if (status === "idle") return { ...base, background: "#1a1a2e", color: "#555", border: "1px solid #222" };
    return { ...base, background: "#1a1a2e", color: "#333", border: "1px solid #1a1a2e" };
  };

  const getDotColor = (status) => {
    if (status === "running") return "#22c55e";
    if (status === "waiting") return "#f59e0b";
    return "#333";
  };

  const getStatusLabel = (status) => {
    if (status === "running") return "Running";
    if (status === "waiting") return "Waiting";
    if (status === "idle") return "Idle";
    return "Soon";
  };

  return (
    <div style={{ background: "#080810", minHeight: "100vh", fontFamily: "Segoe UI, sans-serif", color: "#e2e2f0", padding: 20 }}>

      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>
          Project<span style={{ color: "#7c6aff" }}>V</span> — Agent HQ
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[["3", "Live listings"], ["442", "Views"], ["7", "Sales"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{v}</div>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#444" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 14 }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Orchestrator */}
          <div style={{ background: "#0d0d1a", border: "1px solid #7c6aff44", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1a1530", border: "2px solid #7c6aff66", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              🧠
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#7c6aff", marginBottom: 3 }}>Orchestrator</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 2 }}>Director Agent</div>
              <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>Claude Opus 4.6</div>
            </div>
            <div style={{ fontSize: 12, color: "#888", textAlign: "right", lineHeight: 1.5 }}>Overseeing 4 agents<br />Next review in 6h</div>
            <div style={{ background: "#7c6aff22", border: "1px solid #7c6aff44", color: "#7c6aff", fontSize: 10, letterSpacing: 1, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
              ● Supervising
            </div>
          </div>

          {/* Agents Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {AGENTS.map(agent => (
              <div key={agent.id} style={getDeskStyle(agent.status)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: agent.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, position: "relative" }}>
                    {agent.icon}
                    <span style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: getDotColor(agent.status), border: "2px solid #080810" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e2f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace", marginTop: 1 }}>{agent.model}</div>
                  </div>
                  <span style={getPillStyle(agent.status)}>{getStatusLabel(agent.status)}</span>
                </div>
                {agent.status !== "soon" ? (
                  <div style={{ background: "#060610", border: "1px solid #111", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: "#555", lineHeight: 1.8, minHeight: 44 }}>
                    <span style={{ color: agent.status === "running" ? "#22c55e" : "#555" }}>→</span> {agent.task}<br />
                    <span style={{ color: "#333" }}>{agent.detail}</span>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "10px 0", fontSize: 11, color: "#2a2a3a" }}>Not yet built</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Queue */}
          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: 13 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#555" }}>Approval queue</span>
              <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, borderRadius: 20, padding: "1px 6px", fontFamily: "monospace" }}>{pending.length}</span>
            </div>
            {proposals.map(p => (
              <div key={p.id} style={{ background: "#060610", border: p.status === "approved" ? "1px solid #22c55e44" : "1px solid #141424", borderRadius: 8, padding: 10, marginBottom: 7, opacity: p.status === "rejected" ? 0.4 : 1, transition: "all 0.3s" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ccc", marginBottom: 2, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: 10, color: "#444", marginBottom: 8, fontFamily: "monospace" }}>{p.meta}</div>
                {p.status === "pending" ? (
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => decide(p.id, "approved")} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e44" }}>✓ Ok</button>
                    <button onClick={() => decide(p.id, "rejected")} style={{ fontSize: 10, padding: "4px 9px", borderRadius: 5, cursor: "pointer", fontWeight: 700, background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}>✗</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: p.status === "approved" ? "#22c55e" : "#ef4444", fontFamily: "monospace" }}>
                    {p.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Activity */}
          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: 13 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Activity</div>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid #111" : "none", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13 }}>{a.icon}</span>
                <span style={{ flex: 1, fontSize: 11, color: "#555", lineHeight: 1.5 }}>{a.text}</span>
                <span style={{ fontSize: 9, color: "#333", fontFamily: "monospace", whiteSpace: "nowrap" }}>{a.time}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}