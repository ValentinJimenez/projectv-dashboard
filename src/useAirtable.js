import { useState, useEffect } from "react";

const BASE_ID = "appsS6oYAVqgJhe7H";
const TABLE_ID = "tblIyWuFysf5Hxu8u";
const API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY;
const SNOW_TABLE = process.env.REACT_APP_SNOW_TABLE_ID;
const MEMORY_TABLE = process.env.REACT_APP_SNOW_MEMORY_TABLE_ID;
const LOGS_TABLE = process.env.REACT_APP_PIPELINE_LOGS_TABLE_ID;

const headers = { Authorization: `Bearer ${API_KEY}` };

async function airtableFetch(url) {
  const res = await fetch(url, { headers });
  return res.json();
}

async function airtablePatch(tableId, id, fields) {
  await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}/${id}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

export function useProposals() {
  const [proposals, setProposals] = useState([]);

  const fetch_ = async () => {
    const data = await airtableFetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=OR({status}="pending",{status}="approved")`
    );
    setProposals((data.records || []).map(r => ({
      id: r.id,
      title: r.fields.title,
      niche: r.fields.niche || "",
      competition: r.fields.competition || "",
      meta: `${r.fields.niche || ""} · ${r.fields.competition || ""}`,
      status: r.fields.status,
    })));
  };

  const decide = async (id, decision) => {
    await airtablePatch(TABLE_ID, id, { status: decision });
    fetch_();
  };

  const clearCompleted = async () => {
    const formula = encodeURIComponent('OR({status}="ready_to_upload",{status}="design_rejected",{status}="rejected",{status}="designed")');
    const data = await airtableFetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula=${formula}`
    );
    const ids = (data.records || []).map(r => r.id);
    if (ids.length === 0) return;
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const params = chunk.map(id => `records[]=${id}`).join("&");
      await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`, {
        method: "DELETE",
        headers,
      });
    }
    fetch_();
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, []);

  return { proposals, decide, clearCompleted };
}

export function useDesigns() {
  const [designs, setDesigns] = useState([]);

  const fetch_ = async () => {
    const data = await airtableFetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={status}="designed"`
    );
    setDesigns((data.records || []).map(r => ({
      id: r.id,
      title: r.fields.title,
      image_url: r.fields.image_url,
      status: r.fields.status,
    })));
  };

  const decideDesign = async (id, decision) => {
    await airtablePatch(TABLE_ID, id, { status: decision });
    fetch_();
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, []);

  return { designs, decideDesign };
}

export function useReadyListings() {
  const [listings, setListings] = useState([]);

  const fetch_ = async () => {
    const data = await airtableFetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={status}="ready_to_upload"`
    );
    setListings((data.records || []).map(r => ({
      id: r.id,
      title: r.fields.title,
      image_url: r.fields.image_url,
      price: r.fields.price,
      tags: r.fields.tags,
      description: r.fields.description,
    })));
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => clearInterval(t);
  }, []);

  return { listings };
}

export function useSnowReport() {
  const [report, setReport] = useState(null);

  const fetch_ = async () => {
    try {
      if (!SNOW_TABLE) return;
      const data = await airtableFetch(
        `https://api.airtable.com/v0/${BASE_ID}/${SNOW_TABLE}?sort[0][field]=created_at&sort[0][direction]=desc&maxRecords=1`
      );
      if (data.records?.[0]) setReport(data.records[0].fields);
    } catch (e) {}
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 60000);
    return () => clearInterval(t);
  }, []);

  return { report };
}

export function usePipelineStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("http://localhost:8000/status");
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        setStatus(null);
      }
    };
    fetch_();
    const t = setInterval(fetch_, 3000);
    return () => clearInterval(t);
  }, []);

  return { status };
}

export function usePipelineLogs() {
  const [logs, setLogs] = useState([]);

  const fetch_ = async () => {
    try {
      if (!LOGS_TABLE) return;
      const data = await airtableFetch(
        `https://api.airtable.com/v0/${BASE_ID}/${LOGS_TABLE}?sort[0][field]=date&sort[0][direction]=desc`
      );
      setLogs((data.records || []).map(r => ({
        id: r.id,
        date: r.fields.date,
        duration: r.fields.duration,
        proposals: r.fields.proposals_count || 0,
        designs: r.fields.designs_count || 0,
        listings: r.fields.listings_count || 0,
        status: r.fields.status || "unknown",
      })));
    } catch (e) {}
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 60000);
    return () => clearInterval(t);
  }, []);

  return { logs };
}

export function useSnowMemory() {
  const [memory, setMemory] = useState([]);

  const fetch_ = async () => {
    try {
      if (!MEMORY_TABLE) return;
      const data = await airtableFetch(
        `https://api.airtable.com/v0/${BASE_ID}/${MEMORY_TABLE}?sort[0][field]=created_at&sort[0][direction]=desc`
      );
      setMemory((data.records || []).map(r => ({
        id: r.id,
        observation: r.fields.observation,
        category: r.fields.category || "general",
        created_at: r.fields.created_at,
      })));
    } catch (e) {}
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 60000);
    return () => clearInterval(t);
  }, []);

  return { memory };
}

export function useSnowChat() {
  const [messages, setMessages] = useState([]);

  const fetch_ = async () => {
    try {
      const res  = await fetch("http://localhost:8000/conversations?last_n=50");
      const data = await res.json();
      setMessages((data.conversations || []).map(c => ({
        id:        c.id,
        role:      c.role,
        text:      c.message,
        timestamp: c.timestamp,
      })));
    } catch (e) {}
  };

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 3000);
    return () => clearInterval(t);
  }, []);

  return { messages, refresh: fetch_ };
}
