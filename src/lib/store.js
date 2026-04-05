import { useSyncExternalStore } from 'react';

let draftContent = '';
let jobs = [];
let cachedSnapshot = { draftContent, jobs };
const listeners = new Set();

function emitChange() {
  cachedSnapshot = { draftContent, jobs };
  listeners.forEach(listener => listener());
}

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('llmwiki-draft');
  if (saved) {
    draftContent = saved;
    cachedSnapshot = { draftContent, jobs };
  }
}

export const store = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  getSnapshot() {
    return cachedSnapshot;
  },

  setDraft(content) {
    draftContent = content;
    if (typeof window !== 'undefined') {
      localStorage.setItem('llmwiki-draft', content);
    }
    emitChange();
  },

  addJob(content) {
    const id = Date.now().toString();
    const newJob = {
      id,
      content,
      status: 'loading', // loading, success, error
      result: null,
      error: null
    };
    jobs = [newJob, ...jobs];
    emitChange();
    this.processJob(id);
  },

  dismissJob(id) {
    jobs = jobs.filter(j => j.id !== id);
    emitChange();
  },

  async processJob(id) {
    const jobIndex = jobs.findIndex(j => j.id === id);
    if (jobIndex === -1) return;
    
    const job = jobs[jobIndex];
    try {
      const res = await fetch('/api/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: job.content })
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
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
