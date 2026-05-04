'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Check, Users } from 'lucide-react'

type Creator = { id: string; name: string; niche?: string | null; slot?: string | null }

type Props = {
  creators: Creator[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function CreatorMultiSelect({ creators, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = creators.filter(c => selectedIds.includes(c.id))
  const filtered = creators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.niche ?? '').toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(selectedIds.filter(x => x !== id))
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex min-h-9 w-full items-start gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left"
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Select creators</span>
          ) : (
            selected.map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-medium"
              >
                {c.name}
                <button
                  type="button"
                  onClick={e => remove(c.id, e)}
                  className="hover:text-primary/60 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search creators..."
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground text-center">No creators found</p>
            )}
            {filtered.map(creator => {
              const isSelected = selectedIds.includes(creator.id)
              return (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => toggle(creator.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{creator.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[creator.niche, creator.slot].filter(Boolean).join(' · ') || 'No niche set'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          {selectedIds.length > 0 && (
            <div className="px-3 py-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
