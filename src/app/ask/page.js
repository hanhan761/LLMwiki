"use client";
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if(!question.trim() || loading) return;
    
    const currQ = question;
    setQuestion('');
    setHistory(prev => [...prev, { role: 'user', content: currQ }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currQ })
      });
      const data = await res.json();
      
      if(data.error) throw new Error(data.error);

      setHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch(err) {
      setHistory(prev => [...prev, { role: 'error', content: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <h2>问 (Ask)</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
        向您的知识库提问：基于本地 Wiki 内容进行有依据的推断与解答。
      </p>
      
      <div style={{
        flex: 1, backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)",
        borderRadius: "8px", marginBottom: "1rem", padding: "1rem",
        overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem"
      }}>
        {history.length === 0 && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            尝试问诸如“昨天加入了什么记录？” 或搜索某个实体名词。
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%', background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : (msg.role === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
            padding: '1rem', borderRadius: '8px', border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-color)',
            color: msg.role === 'error' ? '#ef4444' : 'inherit'
          }}>
            {msg.role === 'user' ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            ) : msg.role === 'error' ? (
              <div>发生错误: {msg.content}</div>
            ) : (
              <div className="markdown-body" style={{ lineHeight: 1.6 }}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
            )}
          </div>
        ))}
        {loading && <div style={{ color: "var(--text-muted)" }}>DeepSeek 正在翻阅本地维基...</div>}
      </div>
      
      <div style={{ display: "flex", gap: "1rem" }}>
        <input 
          type="text" 
          placeholder="询问知识库..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          style={{
            flex: 1, padding: "1rem", backgroundColor: "rgba(0,0,0,0.2)", 
            border: "1px solid var(--border-color)", borderRadius: "8px", 
            color: "var(--text-color)", fontSize: "1rem"
          }}
        />
        <button 
          onClick={handleAsk}
          disabled={loading}
          style={{
            padding: "0 2rem", backgroundColor: "var(--accent-color)", 
            color: "white", border: "none", borderRadius: "6px", 
            cursor: loading ? "not-allowed" : "pointer", fontWeight: "600"
          }}>
            发送
        </button>
      </div>
    </div>
  );
}
