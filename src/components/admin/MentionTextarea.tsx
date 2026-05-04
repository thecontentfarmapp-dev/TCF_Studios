'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Film, Eye, Move, Package } from 'lucide-react'

const SHOT_TYPES = [
  { value: 'establishing', label: 'Establishing' },
  { value: 'wide', label: 'Wide' },
  { value: 'medium_wide', label: 'Medium Wide' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium_close', label: 'Medium Close' },
  { value: 'close_up', label: 'Close Up' },
  { value: 'extreme_close_up', label: 'Extreme Close Up' },
  { value: 'over_the_shoulder', label: 'Over The Shoulder' },
  { value: 'pov', label: 'POV' },
  { value: 'insert', label: 'Insert' },
  { value: 'cutaway', label: 'Cutaway' },
]

const CAMERA_ANGLES = [
  { value: 'eye_level', label: 'Eye Level' },
  { value: 'high_angle', label: 'High Angle' },
  { value: 'low_angle', label: 'Low Angle' },
  { value: 'dutch', label: 'Dutch Tilt' },
  { value: 'birds_eye', label: "Bird's Eye" },
  { value: 'worms_eye', label: "Worm's Eye" },
]

const CAMERA_MOVEMENTS = [
  { value: 'static', label: 'Static' },
  { value: 'dolly_in', label: 'Dolly In' },
  { value: 'dolly_out', label: 'Dolly Out' },
  { value: 'push_in', label: 'Push In' },
  { value: 'pull_out', label: 'Pull Out' },
  { value: 'pan_left', label: 'Pan Left' },
  { value: 'pan_right', label: 'Pan Right' },
  { value: 'tilt_up', label: 'Tilt Up' },
  { value: 'tilt_down', label: 'Tilt Down' },
  { value: 'orbit_left', label: 'Orbit Left' },
  { value: 'orbit_right', label: 'Orbit Right' },
  { value: 'crane_up', label: 'Crane Up' },
  { value: 'crane_down', label: 'Crane Down' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'handheld', label: 'Handheld' },
]

const PROP_SUGGESTIONS = [
  'Laptop', 'Whiteboard', 'Coffee', 'Phone', 'Script', 'Camera',
  'Microphone', 'Ring light', 'Tripod', 'Chair', 'Desk', 'Window',
  'Door', 'Book', 'Pen', 'Notebook', 'Sunglasses', 'Bag', 'Car',
  'Mirror', 'Headphones', 'Keyboard', 'Monitor', 'Cup', 'Bottle',
]

type MentionItem = {
  value: string
  label: string
  field: 'shot_type' | 'camera_angle' | 'camera_movement' | 'props'
  category: string
}

const CATEGORIES = [
  { key: 'shot_type',       label: 'Shot Type',       icon: Film,    color: 'text-violet-400' },
  { key: 'camera_angle',   label: 'Camera Angle',    icon: Eye,     color: 'text-blue-400'   },
  { key: 'camera_movement',label: 'Camera Movement', icon: Move,    color: 'text-cyan-400'   },
  { key: 'props',          label: 'Prop',            icon: Package, color: 'text-amber-400'  },
] as const

function buildAllItems(): MentionItem[] {
  return [
    ...SHOT_TYPES.map(i => ({ ...i, field: 'shot_type' as const, category: 'Shot Type' })),
    ...CAMERA_ANGLES.map(i => ({ ...i, field: 'camera_angle' as const, category: 'Camera Angle' })),
    ...CAMERA_MOVEMENTS.map(i => ({ ...i, field: 'camera_movement' as const, category: 'Camera Movement' })),
    ...PROP_SUGGESTIONS.map(i => ({ value: i.toLowerCase().replace(/\s+/g, '_'), label: i, field: 'props' as const, category: 'Prop' })),
  ]
}

const ALL_ITEMS = buildAllItems()

type MentionState = {
  active: boolean
  query: string
  startIndex: number
  activeCategory: string | null
  highlightedIndex: number
}

type Props = {
  value: string
  onChange: (value: string) => void
  onFieldSelect: (field: string, value: string, label: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export default function MentionTextarea({ value, onChange, onFieldSelect, placeholder, rows = 3, className }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mention, setMention] = useState<MentionState>({
    active: false, query: '', startIndex: -1, activeCategory: null, highlightedIndex: 0,
  })

  // Filter items based on query and active category
  const filteredItems = (() => {
    if (!mention.active) return []
    const q = mention.query.toLowerCase()

    if (mention.activeCategory) {
      return ALL_ITEMS.filter(
        i => i.category === mention.activeCategory && i.label.toLowerCase().includes(q)
      )
    }

    if (!q) {
      // Show categories only
      return []
    }

    // Filter across all items
    return ALL_ITEMS.filter(i => i.label.toLowerCase().includes(q))
  })()

  // Group filtered items by category for display
  const grouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, MentionItem[]>)

  // Show categories when @ typed with no query
  const showCategories = mention.active && !mention.query && !mention.activeCategory

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    const cursor = e.target.selectionStart ?? val.length

    onChange(val)

    // Detect active mention
    const textBefore = val.slice(0, cursor)
    const lastAt = textBefore.lastIndexOf('@')

    if (lastAt === -1) {
      setMention(m => ({ ...m, active: false }))
      return
    }

    const queryText = textBefore.slice(lastAt + 1)
    // Deactivate if there's a space (mention ended)
    if (queryText.includes(' ') && !mention.activeCategory) {
      setMention(m => ({ ...m, active: false }))
      return
    }

    setMention({
      active: true,
      query: queryText,
      startIndex: lastAt,
      activeCategory: mention.activeCategory,
      highlightedIndex: 0,
    })
  }

  function selectCategory(catLabel: string) {
    setMention(m => ({ ...m, activeCategory: catLabel, highlightedIndex: 0 }))
    textareaRef.current?.focus()
  }

  function selectItem(item: MentionItem) {
    // Replace @query with the item label in the description
    const before = value.slice(0, mention.startIndex)
    const after = value.slice(mention.startIndex + mention.query.length + 1) // +1 for @

    let insertText: string
    if (item.field === 'props') {
      insertText = item.label.toLowerCase()
    } else {
      insertText = item.label
    }

    const newValue = before + insertText + after
    onChange(newValue)

    // Update the corresponding field
    if (item.field === 'props') {
      // Append to props field
      onFieldSelect('props_append', item.label, item.label)
    } else {
      onFieldSelect(item.field, item.value, item.label)
    }

    setMention({ active: false, query: '', startIndex: -1, activeCategory: null, highlightedIndex: 0 })

    // Restore focus and move cursor after inserted text
    setTimeout(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      const pos = mention.startIndex + insertText.length
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    }, 0)
  }

  // Handle custom prop entry
  function selectCustomProp() {
    if (!mention.query) return
    const propLabel = mention.query.charAt(0).toUpperCase() + mention.query.slice(1)
    const before = value.slice(0, mention.startIndex)
    const after = value.slice(mention.startIndex + mention.query.length + 1)
    onChange(before + propLabel.toLowerCase() + after)
    onFieldSelect('props_append', propLabel, propLabel)
    setMention({ active: false, query: '', startIndex: -1, activeCategory: null, highlightedIndex: 0 })
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!mention.active) return

    const totalItems = showCategories ? CATEGORIES.length : filteredItems.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMention(m => ({ ...m, highlightedIndex: (m.highlightedIndex + 1) % totalItems }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMention(m => ({ ...m, highlightedIndex: (m.highlightedIndex - 1 + totalItems) % totalItems }))
    } else if (e.key === 'Enter' && mention.active) {
      e.preventDefault()
      if (showCategories) {
        selectCategory(CATEGORIES[mention.highlightedIndex].label)
      } else if (filteredItems[mention.highlightedIndex]) {
        selectItem(filteredItems[mention.highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setMention(m => ({ ...m, active: false }))
    } else if (e.key === 'Backspace' && mention.activeCategory && !mention.query) {
      // Back to category selector
      setMention(m => ({ ...m, activeCategory: null }))
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMention(m => ({ ...m, active: false }))
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const categoryIconMap: Record<string, typeof Film> = {
    'Shot Type': Film,
    'Camera Angle': Eye,
    'Camera Movement': Move,
    'Prop': Package,
  }

  const categoryColorMap: Record<string, string> = {
    'Shot Type': 'text-violet-400',
    'Camera Angle': 'text-blue-400',
    'Camera Movement': 'text-cyan-400',
    'Prop': 'text-amber-400',
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className ?? ''}`}
      />

      {/* @ hint */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/40 pointer-events-none select-none">
        @ to reference
      </div>

      {/* Dropdown */}
      {mention.active && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
        >
          {/* Category breadcrumb */}
          {mention.activeCategory && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
              <button
                onMouseDown={e => { e.preventDefault(); setMention(m => ({ ...m, activeCategory: null, query: '' })) }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                @
              </button>
              <span className="text-xs text-muted-foreground">›</span>
              <span className="text-xs font-medium">{mention.activeCategory}</span>
              {mention.query && (
                <>
                  <span className="text-xs text-muted-foreground">›</span>
                  <span className="text-xs text-primary">{mention.query}</span>
                </>
              )}
            </div>
          )}

          {/* Category list */}
          {showCategories && (
            <div className="py-1">
              <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide">Select category</p>
              {CATEGORIES.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.key}
                    onMouseDown={e => { e.preventDefault(); selectCategory(cat.label) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${mention.highlightedIndex === i ? 'bg-muted' : ''}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Filtered items grouped by category */}
          {!showCategories && mention.active && (
            <div className="py-1 max-h-56 overflow-y-auto">
              {Object.keys(grouped).length === 0 && mention.activeCategory === 'Prop' && mention.query && (
                <button
                  onMouseDown={e => { e.preventDefault(); selectCustomProp() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add <span className="font-medium text-foreground">"{mention.query}"</span> as prop</span>
                </button>
              )}
              {Object.entries(grouped).map(([cat, items]) => {
                const Icon = categoryIconMap[cat] ?? Film
                const color = categoryColorMap[cat] ?? 'text-muted-foreground'
                const globalOffset = Object.entries(grouped)
                  .filter(([c]) => c !== cat)
                  .reduce((acc, [, arr]) => acc + arr.length, 0)

                return (
                  <div key={cat}>
                    {!mention.activeCategory && (
                      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                        <Icon className={`w-3 h-3 ${color}`} />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{cat}</span>
                      </div>
                    )}
                    {items.map((item, localIdx) => {
                      const globalIdx = globalOffset + localIdx
                      return (
                        <button
                          key={item.value}
                          onMouseDown={e => { e.preventDefault(); selectItem(item) }}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${mention.highlightedIndex === globalIdx ? 'bg-muted' : ''}`}
                        >
                          <span className="flex-1">{item.label}</span>
                          {item.field === 'camera_movement' && (
                            <span className="text-xs text-muted-foreground/50 font-mono">HF</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
              {Object.keys(grouped).length === 0 && mention.activeCategory !== 'Prop' && (
                <p className="px-3 py-3 text-xs text-muted-foreground text-center">No matches</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
