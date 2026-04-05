"use client";
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [permissions, setPermissions] = useState({ read: true, write: true, delete: false });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
        if(d.permissions) setPermissions(d.permissions);
    });
  }, []);

  const handleChange = async (key) => {
    const newPerm = { ...permissions, [key]: !permissions[key] };
    setPermissions(newPerm);
    await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPerm })
    });
  };

  return (
    <div className="page-container">
      <h2>设置中心</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        配置系统参数以及控制外部 MCP AI Agent 的访问权限。
      </p>
      
      <div style={{ marginBottom: "2rem" }}>
        <h3>MCP 权限配置</h3>
        <p style={{ color: "#aaa", fontSize: "0.9rem" }}>勾选以授予外部编程辅助机器人（如 Cursor）对应的知识库操作权。</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={permissions.read} onChange={() => handleChange('read')} />
            <span><strong>Read</strong> - 允许读取并搜索 Wiki 页面</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={permissions.write} onChange={() => handleChange('write')} />
            <span><strong>Write</strong> - 允许通过放入资料或修改直接写入知识库</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" checked={permissions.delete} onChange={() => handleChange('delete')} />
            <span><strong>Delete</strong> - 允许删除已存在的页面 (高风险)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
