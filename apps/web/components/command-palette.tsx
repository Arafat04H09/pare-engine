'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to admin dashboard', category: 'Navigation', action: () => router.push('/admin') },
    { id: 'nav-clients', label: 'Clients', description: 'View all clients', category: 'Navigation', action: () => router.push('/admin/clients') },
    { id: 'nav-audits', label: 'Audits', description: 'View all audits', category: 'Navigation', action: () => router.push('/admin/audits') },
    { id: 'nav-pipeline', label: 'Pipeline', description: 'Pipeline status dashboard', category: 'Navigation', action: () => router.push('/admin/pipeline') },
    { id: 'nav-settings', label: 'Settings', description: 'API keys and branding', category: 'Navigation', action: () => router.push('/admin/settings') },
    { id: 'nav-onboarding', label: 'New Client', description: 'Client onboarding form', category: 'Navigation', action: () => router.push('/admin/clients/onboarding') },
    // Actions
    { id: 'act-quick-audit', label: 'Quick Audit', description: 'Run a quick mini audit', category: 'Actions', action: () => router.push('/admin/quick-audit') },
    { id: 'act-export-clients', label: 'Export Clients CSV', description: 'Download client list', category: 'Actions', action: () => { window.location.href = '/api/admin/export?type=clients'; } },
    { id: 'act-export-audits', label: 'Export Audits CSV', description: 'Download audit history', category: 'Actions', action: () => { window.location.href = '/api/admin/export?type=audits'; } },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  // Group by category
  const grouped = new Map<string, CommandItem[]>();
  for (const cmd of filtered) {
    const existing = grouped.get(cmd.category) ?? [];
    existing.push(cmd);
    grouped.set(cmd.category, existing);
  }

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation within palette
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        setOpen(false);
      }
    },
    [filtered, selectedIndex],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Search input */}
        <div className="border-b border-gray-200 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command..."
            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No commands found
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                  {category}
                </div>
                {items.map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                        isSelected ? 'bg-navy-50 text-navy' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="ml-2 text-gray-400">{item.description}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="rounded border border-gray-200 px-1.5 py-0.5 font-mono">
              &uarr;&darr;
            </span>
            <span>Navigate</span>
            <span className="rounded border border-gray-200 px-1.5 py-0.5 font-mono">
              Enter
            </span>
            <span>Select</span>
            <span className="rounded border border-gray-200 px-1.5 py-0.5 font-mono">
              Esc
            </span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
