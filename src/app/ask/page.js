"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('llmwiki-ask-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (_) {}
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('llmwiki-ask-history', JSON.stringify(history));
    } catch (_) {}
  }, [history]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  // Auto-resize textarea
  const handleInput = (e) => {
    setQuestion(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const clearHistory = () => {
    if(confirm('清空所有对话记录？')){
       setHistory([]);
       localStorage.removeItem('llmwiki-ask-history');
    }
  }

  const handleAsk = async () => {
    if(!question.trim() || loading) return;
    
    const currQ = question;
    setQuestion('');
    if(inputRef.current) {
        inputRef.current.style.height = 'auto'; // reset height
    }

    const newHistory = [...history, { role: 'user', content: currQ }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", margin: "0 auto", maxWidth: "900px", padding: "1rem" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
        <h2 style={{ margin: 0 }}>问 (Ask)</h2>
        {history.length > 0 && (
          <button onClick={clearHistory} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
             🗑️ 清空历史
          </button>
        )}
      </div>
      
      {/* Messages Area */}
      <div style={{
        flex: 1, 
        overflowY: "auto", 
        display: "flex", 
        flexDirection: "column", 
        gap: "1.5rem",
        padding: "1rem",
        scrollBehavior: 'smooth'
      }} className="chat-container">
        
        {history.length === 0 && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "1rem" }}>
            <div style={{ fontSize: "3rem", background: "linear-gradient(90deg, #4285f4, #d96570)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✨</div>
            <h3 style={{ margin: 0, fontWeight: 500, color: "var(--text-color)" }}>今天想查点什么？</h3>
            <p>基于本地维基的高级逻辑推理与连贯对话体验。</p>
          </div>
        )}
        
        {history.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            width: '100%'
          }}>
            <div style={{ 
              maxWidth: '85%', 
              background: msg.role === 'user' ? 'var(--panel-bg)' : 'transparent',
              padding: msg.role === 'user' ? '0.75rem 1.25rem' : '0 0.5rem', 
              borderRadius: '24px', 
              border: msg.role === 'user' ? '1px solid var(--border-color)' : 'none',
              color: msg.role === 'error' ? '#ef4444' : 'inherit',
              lineHeight: 1.6,
              fontSize: '1rem'
            }}>
              {msg.role === 'user' ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              ) : msg.role === 'error' ? (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>发生错误: {msg.content}</div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 0.5rem' }}>
             <div style={{ 
                background: 'linear-gradient(90deg, #4285f4, #d96570)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                animation: 'pulse 1.5s infinite' 
             }}>
                ✨ AI 正在查阅维基...
             </div>
          </div>
        )}
        <div ref={bottomRef} style={{ height: "20px" }} />
      </div>
      
      {/* Input Area */}
      <div style={{ padding: "0.5rem 1rem 1rem", background: "var(--bg-color)" }}>
        <div style={{
          display: "flex", 
          alignItems: "flex-end",
          gap: "1rem",
          background: "var(--panel-bg)",
          border: "1px solid var(--border-color)", 
          borderRadius: "24px",
          padding: "0.75rem 1.25rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          transition: "border 0.3s ease",
        }}>
          <textarea 
            ref={inputRef}
            placeholder="询问知识库 (Shift+Enter 换行)..."
            value={question}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              flex: 1, 
              background: "transparent", 
              border: "none", 
              color: "var(--text-color)", 
              fontSize: "1rem",
              resize: "none", 
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
              maxHeight: "200px"
            }}
          />
          <button 
            onClick={handleAsk}
            disabled={!question.trim() || loading}
            style={{
              background: (!question.trim() || loading) ? "transparent" : "var(--accent-color)", 
              color: (!question.trim() || loading) ? "var(--border-color)" : "white", 
              border: "none", 
              borderRadius: "50%", 
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: (!question.trim() || loading) ? "not-allowed" : "pointer", 
              transition: "all 0.2s ease"
            }}>
              ➤
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
           基于本地维基的内容可能存在不完整性，请结合原文判断。
        </div>
      </div>
    </div>
  );
}
