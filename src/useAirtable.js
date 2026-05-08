import { useEffect, useState } from "react";

const BASE_ID = "appsS6oYAVqgJhe7H";
const TABLE_ID = "tblIyWuFysf5Hxu8u";
const API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY;

export function useProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?filterByFormula={status}="pending"`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );
      const data = await res.json();
      const mapped = data.records.map(r => ({
        id: r.id,
        title: r.fields.title,
        meta: `${r.fields.niche} · ${r.fields.competition}`,
        status: r.fields.status,
      }));
      setProposals(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id, decision) => {
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { status: decision } }),
    });
    fetchProposals();
  };

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 30000);
    return () => clearInterval(interval);
  }, []);

  return { proposals, loading, decide };
}