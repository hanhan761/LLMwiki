"use client";

import { useState } from 'react';
import { store, useDropStore } from '@/lib/store';

export default function Home() {
  const { draftContent, jobs } = useDropStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const setContent = (val) => {
    store.setDraft(typeof val === 'function' ? val(draftContent) : val);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      try {
        const text = await file.text();
        setContent((prev) => (prev ? prev + '\n\n' + text : text));
      } catch (err) {
        console.error("Failed to read file", err);
      }
    }
  };

  const handleDrop = () => {
    if (!draftContent.trim()) return;
    store.addJob(draftContent);
    store.setDraft('');
  };

  return (
    <div className="page-container">
      <h2>放 (Drop)</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        极简输入器：你可以粘贴任何文本、链接、内容，或者<strong>直接将文本文件拖入此区域</strong>。DeepSeek将自动为你提炼核心结构并构建维基。
      </p>
      
      <div 
        style={{ 
          display: "flex", flexDirection: "column", gap: "1rem",
          position: "relative"
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleFileDrop}
      >
        {isDragging && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(50, 150, 255, 0.1)",
            border: "2px dashed var(--accent-color)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent-color)", fontSize: "1.2rem", fontWeight: "bold",
            pointerEvents: "none", zIndex: 10,
            backdropFilter: "blur(2px)"
          }}>
            松开鼠标，将文件内容填入
          </div>
        )}

        <textarea 
          placeholder="在这里输入、粘贴文本或 URL，或拖入文件..."
          value={draftContent}
          onChange={e => setContent(e.target.value)}
          style={{
            width: "100%", minHeight: "200px", padding: "1rem",
            backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)",
            borderRadius: "8px", color: "var(--text-color)", fontSize: "1rem",
            resize: "vertical", fontFamily: "inherit"
          }}
        />

        <button 
          onClick={handleDrop}
          disabled={!draftContent.trim()}
          style={{
            alignSelf: "flex-end", padding: "0.75rem 2rem",
            backgroundColor: "var(--accent-color)", color: "white",
            border: "none", borderRadius: "6px", fontSize: "1rem",
            cursor: !draftContent.trim() ? 'not-allowed' : 'pointer', 
            fontWeight: "600", transition: "background 0.2s",
            opacity: !draftContent.trim() ? 0.5 : 1
          }}>
          丢入知识库
        </button>
      </div>

      {/* 进度与历史队列展示区 */}
      {jobs.length > 0 && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>处理队列</h3>
          {jobs.map(job => (
            <div key={job.id} style={{
              padding: "1rem", 
              backgroundColor: job.status === 'loading' ? "rgba(255,255,255,0.05)" : 
                              job.status === 'success' ? "rgba(0,255,0,0.1)" : "rgba(255,0,0,0.1)", 
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{flex: 1, overflow: "hidden"}}>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.5rem" }}>
                  {job.content.substring(0, 80)}...
                </div>
                {job.status === 'loading' && <div style={{color: "var(--accent-color)"}}>⏳ 正在进行LLM提炼...</div>}
                {job.status === 'success' && <div style={{color: "#aaddaa"}}>✅ 成功提取实体写入本地: <strong>{job.result.title}</strong></div>}
                {job.status === 'error' && <div style={{color: "#ff8888"}}>❌ 发生错误: {job.error}</div>}
              </div>
              {job.status !== 'loading' && (
                <button onClick={() => store.dismissJob(job.id)} style={{
                  background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.5rem"
                }}>
                  清除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
