"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function SinglePage() {
  const params = useParams();
  const slug = params.slug;
  const router = useRouter();

  const [content, setContent] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pages/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setContent(data.content);
        setRawContent(data.content);
      })
      .catch(() => {
        setContent('# 页面未找到或已被删除');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    // extract frontmatter simplisticly
    let extractTitle = slug;
    let extractSummary = "";
    
    // a very naive parser for frontmatter
    const titleMatch = rawContent.match(/title:\s*(.*)/);
    if(titleMatch) extractTitle = titleMatch[1];
    
    const summaryMatch = rawContent.match(/summary:\s*(.*)/);
    if(summaryMatch) extractSummary = summaryMatch[1];

    // we only need to pass markdown for now, the backend overwrites everything
    const contentToSave = rawContent.replace(/---[\s\S]*?---/, '').trim(); // Remove frontmatter block to resynthesize, or just override completely.
    // wait, we designed saveWikiPage to wrap it in frontmatter. Let's just save rawContent as markdown and backend wraps it.
    // But then frontmatter stacks!
    // So let's extract the markdown body:
    const bodyMatch = rawContent.match(/---[\s\S]*?---([\s\S]*)/);
    const body = bodyMatch ? bodyMatch[1].trim() : rawContent;

    await fetch(`/api/pages/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: extractTitle, summary: extractSummary, markdown: body })
    });
    setContent(rawContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if(!confirm('确定删除这个 Wiki 概念页吗？')) return;
    await fetch(`/api/pages/${slug}`, { method: 'DELETE' });
    router.push('/look');
  };

  if (loading) return <div className="page-container">加载中...</div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem'}}>
        <button onClick={() => router.push('/look')} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          ← 返回
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} style={{ background: 'var(--accent-color)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
            </>
          ) : (
             <>
              <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>编辑</button>
              <button onClick={handleDelete} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>删除</button>
             </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={rawContent}
          onChange={e => setRawContent(e.target.value)}
          style={{
            width: '100%', minHeight: '60vh', background: 'rgba(0,0,0,0.3)', color: '#fff',
            border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px',
            fontFamily: 'monospace', fontSize: '0.9rem', resize: 'vertical'
          }}
        />
      ) : (
        <div className="markdown-body" style={{ lineHeight: 1.6, color: '#eaeaea' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
