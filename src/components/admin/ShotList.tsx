'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import MentionTextarea from '@/components/admin/MentionTextarea'
import AiDirectorPanel from '@/components/admin/AiDirectorPanel'
import {
  Plus, Trash2, Wand2, ExternalLink, ChevronDown, ChevronUp,
  Camera, Move, Eye, Clock, FileText, Mic, Package, StickyNote,
  CheckCircle2, Circle, Film, GripVertical, Sparkles
} from 'lucide-react'

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

// Higgsfield camera vocabulary
const CAMERA_MOVEMENTS = [
  { value: 'static', label: 'Static', higgsfield: true },
  { value: 'dolly_in', label: 'Dolly In', higgsfield: true },
  { value: 'dolly_out', label: 'Dolly Out', higgsfield: true },
  { value: 'push_in', label: 'Push In', higgsfield: true },
  { value: 'pull_out', label: 'Pull Out', higgsfield: true },
  { value: 'pan_left', label: 'Pan Left', higgsfield: true },
  { value: 'pan_right', label: 'Pan Right', higgsfield: true },
  { value: 'tilt_up', label: 'Tilt Up', higgsfield: true },
  { value: 'tilt_down', label: 'Tilt Down', higgsfield: true },
  { value: 'orbit_left', label: 'Orbit Left', higgsfield: true },
  { value: 'orbit_right', label: 'Orbit Right', higgsfield: true },
  { value: 'crane_up', label: 'Crane Up', higgsfield: true },
  { value: 'crane_down', label: 'Crane Down', higgsfield: true },
  { value: 'tracking', label: 'Tracking', higgsfield: true },
  { value: 'handheld', label: 'Handheld', higgsfield: false },
]

type Shot = {
  id: string
  episode_id: string
  number: number
  scene_beat: string | null
  shot_type: string | null
  camera_angle: string | null
  camera_movement: string | null
  duration_seconds: number | null
  description: string | null
  dialogue: string | null
  props: string | null
  notes: string | null
  storyboard_url: string | null
  storyboard_prompt: string | null
  status: 'not_shot' | 'shot' | 'approved'
}

function statusConfig(status: string) {
  const map: Record<string, { label: string; color: string; icon: typeof Circle }> = {
    not_shot: { label: 'Not shot', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', icon: Circle },
    shot: { label: 'Shot', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
    approved: { label: 'Approved', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  }
  return map[status] || map.not_shot
}

function higgsfield_url(shot: Shot) {
  const movement = CAMERA_MOVEMENTS.find(m => m.value === shot.camera_movement)
  const angle = CAMERA_ANGLES.find(a => a.value === shot.camera_angle)
  const type = SHOT_TYPES.find(t => t.value === shot.shot_type)
  const prompt = [shot.description, type?.label, angle?.label, movement?.label].filter(Boolean).join(', ')
  return `https://higgsfield.ai/camera-controls?prompt=${encodeURIComponent(prompt)}`
}

export default function ShotList({
  episodeId,
  episodeTitle,
  script,
  initialShots,
}: {
  episodeId: string
  episodeTitle: string
  script: string | null
  initialShots: Shot[]
}) {
  const [shots, setShots] = useState<Shot[]>(initialShots.sort((a, b) => a.number - b.number))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const supabase = createClient()

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function addShot() {
    const nextNumber = shots.length > 0 ? Math.max(...shots.map(s => s.number)) + 1 : 1
    const { data, error } = await supabase
      .from('shots')
      .insert({ episode_id: episodeId, number: nextNumber })
      .select()
      .single()
    if (!error && data) {
      setShots(prev => [...prev, data as Shot])
      setExpanded(prev => new Set([...prev, data.id]))
    }
  }

  async function deleteShot(id: string) {
    await supabase.from('shots').delete().eq('id', id)
    setShots(prev => prev.filter(s => s.id !== id))
  }

  async function updateShot(id: string, field: string, value: string | number | null) {
    setSaving(prev => new Set([...prev, id]))
    setShots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    await supabase.from('shots').update({ [field]: value }).eq('id', id)
    setSaving(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  // Handle @mention field selection from the description textarea
  function handleMentionFieldSelect(shotId: string, field: string, value: string, label: string) {
    if (field === 'props_append') {
      // Append to props (comma-separated)
      const shot = shots.find(s => s.id === shotId)
      const existing = shot?.props ?? ''
      const newProps = existing
        ? `${existing}, ${label}`
        : label
      updateShot(shotId, 'props', newProps)
    } else {
      updateShot(shotId, field, value)
    }
  }

  async function generateStoryboard(shot: Shot) {
    if (!shot.description) return
    setGenerating(prev => new Set([...prev, shot.id]))
    try {
      const res = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shotId: shot.id,
          description: shot.description,
          shotType: shot.shot_type,
          cameraAngle: shot.camera_angle,
          cameraMovement: shot.camera_movement,
          dialogue: shot.dialogue,
          episodeTitle,
        }),
      })
      const data = await res.json()
      if (data.url) {
        setShots(prev => prev.map(s => s.id === shot.id ? { ...s, storyboard_url: data.url } : s))
      }
    } finally {
      setGenerating(prev => { const n = new Set(prev); n.delete(shot.id); return n })
    }
  }

  const router = useRouter()
  const [aiOpen, setAiOpen] = useState(false)
  const totalDuration = shots.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  const shotCount = shots.length
  const approvedCount = shots.filter(s => s.status === 'approved').length

  async function handleShotsGenerated() {
    // Reload shots from DB after AI generates them
    const supabaseClient = createClient()
    const { data } = await supabaseClient
      .from('shots')
      .select('*')
      .eq('episode_id', episodeId)
      .order('number', { ascending: true })
    if (data) {
      setShots(data as Shot[])
      setExpanded(new Set())
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Director panel */}
      {aiOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-card border-l border-border shadow-2xl flex flex-col">
          <AiDirectorPanel
            episodeId={episodeId}
            episodeTitle={episodeTitle}
            onClose={() => setAiOpen(false)}
            onShotsGenerated={handleShotsGenerated}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">Shot List</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{shotCount} shots</span>
            <span>{approvedCount} approved</span>
            {totalDuration > 0 && <span>~{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')} total</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAiOpen(o => !o)}
            size="sm"
            variant="outline"
            className="gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Director
          </Button>
          <Button onClick={addShot} size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            Add shot
          </Button>
        </div>
      </div>

      {/* Script reference */}
      {script && (
        <details className="group">
          <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-2 select-none">
            <FileText className="w-3.5 h-3.5" />
            <span>Script reference</span>
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
          </summary>
          <pre className="mt-2 p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {script}
          </pre>
        </details>
      )}

      {/* Shot cards */}
      {shots.length === 0 && (
        <div className="p-12 rounded-xl border border-dashed border-border text-center space-y-2">
          <Film className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No shots yet — click "Add shot" to start building your shot list</p>
        </div>
      )}

      <div className="space-y-2">
        {shots.map((shot, idx) => {
          const isExpanded = expanded.has(shot.id)
          const isGenerating = generating.has(shot.id)
          const isSaving = saving.has(shot.id)
          const status = statusConfig(shot.status)
          const StatusIcon = status.icon

          return (
            <div key={shot.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Shot header row */}
              <button
                className="flex items-center gap-3 px-4 py-3 w-full text-left cursor-pointer hover:bg-muted/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                onClick={() => toggleExpand(shot.id)}
                aria-expanded={isExpanded}
                aria-controls={`shot-${shot.id}`}
              >
                <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">
                  {String(shot.number).padStart(3, '0')}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {shot.description || <span className="text-muted-foreground italic">Untitled shot</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {shot.shot_type && (
                      <span className="text-xs text-muted-foreground">
                        {SHOT_TYPES.find(t => t.value === shot.shot_type)?.label}
                      </span>
                    )}
                    {shot.camera_movement && (
                      <span className="text-xs text-muted-foreground">
                        · {CAMERA_MOVEMENTS.find(m => m.value === shot.camera_movement)?.label}
                      </span>
                    )}
                    {shot.duration_seconds && (
                      <span className="text-xs text-muted-foreground">· {shot.duration_seconds}s</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
                  {shot.storyboard_url && (
                    <img src={shot.storyboard_url} alt="" className="w-8 h-8 rounded object-cover border border-border" />
                  )}
                  <Badge className={`text-xs border hidden sm:flex ${status.color}`}>
                    {status.label}
                  </Badge>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded editor */}
              {isExpanded && (
                <div id={`shot-${shot.id}`} className="border-t border-border p-4 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left: storyboard frame */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Storyboard</p>
                      <div className="aspect-[9/16] rounded-xl border border-border bg-muted/30 overflow-hidden relative">
                        {shot.storyboard_url ? (
                          <img src={shot.storyboard_url} alt="Storyboard" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Camera className="w-8 h-8" />
                            <p className="text-xs text-center px-4">Add a description then generate a sketch</p>
                          </div>
                        )}
                        {/* 9:16 frame lines overlay */}
                        {!shot.storyboard_url && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-[10%] border border-dashed border-muted-foreground/20 rounded" />
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => generateStoryboard(shot)}
                        disabled={!shot.description || isGenerating}
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        {isGenerating ? 'Generating...' : shot.storyboard_url ? 'Regenerate sketch' : 'Generate sketch'}
                      </Button>
                      {shot.storyboard_url && (
                        <a
                          href={shot.storyboard_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View full size
                        </a>
                      )}
                    </div>

                    {/* Middle: shot details */}
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Shot details</p>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="w-3 h-3" /> Scene / Beat</label>
                        <Input
                          value={shot.scene_beat || ''}
                          onChange={e => updateShot(shot.id, 'scene_beat', e.target.value)}
                          placeholder="e.g. Alice stares at blank screen"
                          className="text-sm h-8"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Eye className="w-3 h-3" /> Description</label>
                        <MentionTextarea
                          value={shot.description || ''}
                          onChange={val => updateShot(shot.id, 'description', val)}
                          onFieldSelect={(field, value, label) => handleMentionFieldSelect(shot.id, field, value, label)}
                          placeholder="What's happening... type @ to reference shot type, angle, movement or prop"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Mic className="w-3 h-3" /> Dialogue / VO</label>
                        <Textarea
                          value={shot.dialogue || ''}
                          onChange={e => updateShot(shot.id, 'dialogue', e.target.value)}
                          placeholder="Spoken words or voiceover..."
                          className="text-sm resize-none"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Package className="w-3 h-3" /> Props</label>
                          <Input
                            value={shot.props || ''}
                            onChange={e => updateShot(shot.id, 'props', e.target.value)}
                            placeholder="MacBook, coffee..."
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> Duration (sec)</label>
                          <Input
                            value={shot.duration_seconds || ''}
                            onChange={e => updateShot(shot.id, 'duration_seconds', e.target.value ? parseInt(e.target.value) : null)}
                            type="number"
                            min="1"
                            max="300"
                            placeholder="4"
                            className="text-sm h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5"><StickyNote className="w-3 h-3" /> Director notes</label>
                        <Textarea
                          value={shot.notes || ''}
                          onChange={e => updateShot(shot.id, 'notes', e.target.value)}
                          placeholder="Hold on cursor blink before cut..."
                          className="text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Right: camera controls */}
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Camera</p>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Film className="w-3 h-3" /> Shot type</label>
                        <Select value={shot.shot_type || ''} onValueChange={v => updateShot(shot.id, 'shot_type', v || null)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {SHOT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Eye className="w-3 h-3" /> Camera angle</label>
                        <Select value={shot.camera_angle || ''} onValueChange={v => updateShot(shot.id, 'camera_angle', v || null)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {CAMERA_ANGLES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Move className="w-3 h-3" /> Camera movement</label>
                          <a
                            href="https://higgsfield.ai/camera-controls"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Higgsfield <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <Select value={shot.camera_movement || ''} onValueChange={v => updateShot(shot.id, 'camera_movement', v || null)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {CAMERA_MOVEMENTS.map(m => (
                              <SelectItem key={m.value} value={m.value}>
                                <span>{m.label}</span>
                                {m.higgsfield && <span className="ml-2 text-xs text-muted-foreground">HF</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Higgsfield preview button */}
                      {(shot.description || shot.camera_movement) && (
                        <a
                          href={higgsfield_url(shot)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preview in Higgsfield
                        </a>
                      )}

                      {/* Status */}
                      <div className="pt-2 border-t border-border space-y-1.5">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <div className="flex gap-2">
                          {(['not_shot', 'shot', 'approved'] as const).map(s => {
                            const cfg = statusConfig(s)
                            return (
                              <button
                                key={s}
                                onClick={() => updateShot(shot.id, 'status', s)}
                                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${shot.status === s ? cfg.color : 'border-border text-muted-foreground hover:border-primary/30'}`}
                              >
                                {cfg.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <button
                      onClick={() => deleteShot(shot.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete shot
                    </button>
                    <span className="text-xs text-muted-foreground">Shot {String(shot.number).padStart(3, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {shots.length > 0 && (
        <Button onClick={addShot} variant="outline" size="sm" className="w-full gap-2 border-dashed">
          <Plus className="w-3.5 h-3.5" />
          Add shot
        </Button>
      )}
    </div>
  )
}
