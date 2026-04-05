import { useSyncExternalStore } from 'react';

let draftContent = '';
let jobs = [];
let initialized = false;
let cachedSnapshot = { draftContent, jobs };
const listeners = new Set();

function init() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    const saved = localStorage.getItem('llmwiki-draft');
    if (saved) {
      draftContent = saved;
      cachedSnapshot = { draftContent, jobs };
    }
  } catch (_) {}
}

function emitChange() {
  cachedSnapshot = { draftContent, jobs };
  listeners.forEach(listener => listener());
}

const serverSnapshot = { draftContent: '', jobs: [] };

export const store = {
  subscribe(listener) {
    init();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // 服务端快照：使用固定的引用，避免 hydration 期间产生无限循环
  getServerSnapshot() {
    return serverSnapshot;
  },

  getSnapshot() {
    init();
    return cachedSnapshot;
  },

  setDraft(content) {
    draftContent = content;
    try {
      if (typeof window !== 'undefined') localStorage.setItem('llmwiki-draft', content);
    } catch (_) {}
    emitChange();
  },

  addJob(content) {
    const id = Date.now().toString();
    const newJob = { id, content, status: 'loading', result: null, error: null };
    jobs = [newJob, ...jobs];
    emitChange();
    this.processJob(id);
  },

  dismissJob(id) {
    jobs = jobs.filter(j => j.id !== id);
    emitChange();
  },

  async processJob(id) {
    if (!jobs.find(j => j.id === id)) return;
    try {
      const res = await fetch('/api/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: jobs.find(j => j.id === id).content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to drop');
      jobs = jobs.map(j => j.id === id ? { ...j, status: 'success', result: data } : j);
    } catch (err) {
      console.error(err);
      jobs = jobs.map(j => j.id === id ? { ...j, status: 'error', error: err.message } : j);
    }
    emitChange();
  }
};

export function useDropStore() {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot  // 单独的 SSR 快照，防止 hydration mismatch
  );
}
