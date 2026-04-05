"use client";

import { useState, useRef } from 'react';
import { store, useDropStore } from '@/lib/store';

// 纯文本可以直接在前端读取的文件类型
const PLAIN_TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
const PLAIN_TEXT_EXTS = ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.py', '.html', '.css', '.xml', '.yaml', '.yml'];

function isPlainText(file) {
  if (PLAIN_TEXT_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return PLAIN_TEXT_EXTS.some(ext => lower.endsWith(ext));
}

export default function Home() {
  const { draftContent, jobs } = useDropStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // 必须阻止，否则 drop 不触发
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const setContent = (val) => {
    store.setDraft(typeof val === 'function' ? val(draftContent) : val);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    dragCounter.current = 0;  // 重置计数器
    setIsDragging(false);
    setParseError(null);

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const file = e.dataTransfer.files[0];

    // 纯文本直接读取，无需后端
    if (isPlainText(file)) {
      try {
        const text = await file.text();
        setContent((prev) => (prev ? prev + '\n\n' + text : text));
      } catch (err) {
        setParseError('文本文件读取失败: ' + err.message);
      }
      return;
    }

    // PDF / DOCX / 图片 → 上传后端解析
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解析失败');

      setContent((prev) => (prev ? prev + '\n\n' + data.text : data.text));
    } catch (err) {
      console.error('File parse error:', err);
      setParseError(`"${file.name}" 解析失败: ${err.message}`);
    } finally {
      setIsParsing(false);
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
        极简输入器：粘贴文本、URL，或拖入任意文件（<strong>PDF、Word、图片、代码文件等</strong>）。AI 将自动提炼核心结构并写入维基。
      </p>
      
      <div 
        style={{ 
          display: "flex", flexDirection: "column", gap: "1rem",
          position: "relative"
        }}
        onDragEnter={handleDragEnter}
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
            📂 松开鼠标，投入文件（PDF/Word/图片/代码均可）
          </div>
        )}

        {isParsing && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: "8px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "0.75rem", zIndex: 20,
            backdropFilter: "blur(4px)"
          }}>
            <div style={{ fontSize: "2rem" }}>⚙️</div>
            <div style={{ color: "var(--accent-color)", fontWeight: "600" }}>正在解析文件，请稍候...</div>
          </div>
        )}

        <textarea 
          placeholder="在这里输入、粘贴文本或 URL，或拖入文件..."
          value={draftContent}
          onChange={e => setContent(e.target.value)}
          onDragOver={e => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{
            width: "100%", minHeight: "200px", padding: "1rem",
            backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)",
            borderRadius: "8px", color: "var(--text-color)", fontSize: "1rem",
            resize: "vertical", fontFamily: "inherit"
          }}
        />

        {parseError && (
          <div style={{ padding: "0.75rem 1rem", backgroundColor: "rgba(255,0,0,0.1)", borderRadius: "8px", color: "#ff8888", fontSize: "0.9rem" }}>
            ❌ {parseError}
          </div>
        )}

        <button 
          onClick={handleDrop}
          disabled={!draftContent.trim() || isParsing}
          style={{
            alignSelf: "flex-end", padding: "0.75rem 2rem",
            backgroundColor: "var(--accent-color)", color: "white",
            border: "none", borderRadius: "6px", fontSize: "1rem",
            cursor: (!draftContent.trim() || isParsing) ? 'not-allowed' : 'pointer', 
            fontWeight: "600", transition: "background 0.2s",
            opacity: (!draftContent.trim() || isParsing) ? 0.5 : 1
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
