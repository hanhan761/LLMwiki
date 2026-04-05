"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LookPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages')
      .then(res => res.json())
      .then(data => {
        if(data.pages) setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <h2>看 (Look)</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        知识库全貌浏览：在这里查看所有经过整合与提炼的知识卡片。
      </p>
      
      {loading ? (
        <p>加载中...</p>
      ) : pages.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>知识库目前为空，快去“放”一些资料吧。</p>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem"
        }}>
          {pages.map((p) => (
            <Link key={p.slug} href={`/look/${p.slug}`} style={{ display: 'block' }}>
              <div style={{
                padding: "1.5rem", background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-color)", borderRadius: "8px",
                cursor: "pointer", height: "100%", transition: "border 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-color)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
              >
                <h3 style={{ marginTop: 0, fontSize: "1.2rem", color: "white" }}>{p.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 0, lineHeight: 1.5 }}>
                  {p.summary || "暂无摘要"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
