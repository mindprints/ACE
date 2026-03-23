import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, ClipboardList, Link2, X, Loader2 } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
}

interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description: string;
  createdAt: string;
}

type Tab = 'assignments' | 'links';

const CACHE_KEY = 'ace_sheets_cache';

function apiCall(params: Record<string, string>) {
  const url = new URL('/api/sheets', window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString()).then(r => r.json()).catch(() => null);
}

function readCache(): { assignments: Assignment[]; links: ResourceLink[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function Assignments() {
  const [tab, setTab] = useState<Tab>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>(() => readCache()?.assignments ?? []);
  const [links, setLinks] = useState<ResourceLink[]>(() => readCache()?.links ?? []);
  const [loading, setLoading] = useState(true);

  // Assignment form state
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aDue, setADue] = useState('');

  // Link form state
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [lTitle, setLTitle] = useState('');
  const [lUrl, setLUrl] = useState('');
  const [lDesc, setLDesc] = useState('');

  useEffect(() => {
    apiCall({ action: 'list' }).then(data => {
      if (data && !data.error) {
        setAssignments(data.assignments ?? []);
        setLinks(data.links ?? []);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
      setLoading(false);
    });
  }, []);

  const addAssignment = () => {
    if (!aTitle.trim()) return;
    const item: Assignment = {
      id: crypto.randomUUID(),
      title: aTitle.trim(),
      description: aDesc.trim(),
      dueDate: aDue,
      createdAt: new Date().toISOString(),
    };
    setAssignments(prev => [item, ...prev]);
    setATitle(''); setADesc(''); setADue('');
    setShowAssignmentForm(false);
    apiCall({ action: 'add', type: 'assignments', data: JSON.stringify(item) });
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    apiCall({ action: 'delete', type: 'assignments', id });
  };

  const addLink = () => {
    if (!lTitle.trim() || !lUrl.trim()) return;
    const url = lUrl.trim().startsWith('http') ? lUrl.trim() : `https://${lUrl.trim()}`;
    const item: ResourceLink = {
      id: crypto.randomUUID(),
      title: lTitle.trim(),
      url,
      description: lDesc.trim(),
      createdAt: new Date().toISOString(),
    };
    setLinks(prev => [item, ...prev]);
    setLTitle(''); setLUrl(''); setLDesc('');
    setShowLinkForm(false);
    apiCall({ action: 'add', type: 'links', data: JSON.stringify(item) });
  };

  const deleteLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
    apiCall({ action: 'delete', type: 'links', id });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-white">Assignments &amp; Links</h1>
          <p className="text-sm text-gray-500 mt-1">Post tasks and resources for your pupils</p>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />}
      </div>

      {/* Tab bar */}
      <div className="px-8 pt-4 flex gap-1 flex-shrink-0">
        <button
          onClick={() => setTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'assignments'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assignments
          {assignments.length > 0 && (
            <span className="bg-amber-500/30 text-amber-300 text-xs px-1.5 py-0.5 rounded-full">
              {assignments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('links')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'links'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Links &amp; Resources
          {links.length > 0 && (
            <span className="bg-sky-500/30 text-sky-300 text-xs px-1.5 py-0.5 rounded-full">
              {links.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === 'assignments' && (
          <div className="max-w-2xl space-y-4">
            {!showAssignmentForm ? (
              <button
                onClick={() => setShowAssignmentForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20 rounded-xl text-gray-500 hover:text-gray-300 hover:border-white/40 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add assignment
              </button>
            ) : (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">New Assignment</span>
                  <button onClick={() => setShowAssignmentForm(false)} className="text-gray-600 hover:text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Title *"
                  value={aTitle}
                  onChange={e => setATitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={aDesc}
                  onChange={e => setADesc(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Due date (optional)</label>
                    <input
                      type="date"
                      value={aDue}
                      onChange={e => setADue(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 [color-scheme:dark]"
                    />
                  </div>
                  <button
                    onClick={addAssignment}
                    disabled={!aTitle.trim()}
                    className="mt-5 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {assignments.length === 0 && !showAssignmentForm && !loading && (
              <div className="text-center py-16 text-gray-600 text-sm">
                No assignments yet. Add one above.
              </div>
            )}
            {assignments.map(a => (
              <div key={a.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-base leading-snug">{a.title}</h3>
                    {a.description && (
                      <p className="text-gray-400 text-sm mt-1.5 whitespace-pre-wrap leading-relaxed">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      {a.dueDate && (
                        <span className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Due {new Date(a.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        Posted {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAssignment(a.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'links' && (
          <div className="max-w-2xl space-y-4">
            {!showLinkForm ? (
              <button
                onClick={() => setShowLinkForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20 rounded-xl text-gray-500 hover:text-gray-300 hover:border-white/40 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add link
              </button>
            ) : (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">New Link</span>
                  <button onClick={() => setShowLinkForm(false)} className="text-gray-600 hover:text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Label *"
                  value={lTitle}
                  onChange={e => setLTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/50"
                  autoFocus
                />
                <input
                  type="url"
                  placeholder="URL * (e.g. docs.google.com/...)"
                  value={lUrl}
                  onChange={e => setLUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/50"
                />
                <div className="flex items-end gap-3">
                  <textarea
                    placeholder="Notes (optional)"
                    value={lDesc}
                    onChange={e => setLDesc(e.target.value)}
                    rows={2}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-500/50 resize-none"
                  />
                  <button
                    onClick={addLink}
                    disabled={!lTitle.trim() || !lUrl.trim()}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {links.length === 0 && !showLinkForm && !loading && (
              <div className="text-center py-16 text-gray-600 text-sm">
                No links yet. Add one above.
              </div>
            )}
            {links.map(l => (
              <div key={l.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium text-base transition-colors"
                    >
                      {l.title}
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{l.url}</p>
                    {l.description && (
                      <p className="text-gray-400 text-sm mt-2 leading-relaxed">{l.description}</p>
                    )}
                    <span className="text-xs text-gray-600 mt-2 block">
                      Posted {new Date(l.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteLink(l.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
