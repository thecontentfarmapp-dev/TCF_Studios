import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function BrandContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('brand_id').eq('id', user.id).single()
  if (!profile?.brand_id) redirect('/login')

  const { data: records } = await supabase
    .from('publish_records')
    .select('*, episodes(number, title, season_id, seasons(title, brand_id))')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const brandRecords = records?.filter(r => {
    const ep = r.episodes as any
    return ep?.seasons?.brand_id === profile.brand_id
  }) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Live Content</h1>
        <p className="text-gray-500 mt-1">Your published episodes and their performance</p>
      </div>

      {brandRecords.length === 0 && (
        <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No content published yet — episodes will appear here once live</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {brandRecords.map(r => {
          const ep = r.episodes as { number: number; title: string | null; seasons: { title: string } | null } | null
          return (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {r.thumbnail_url && (
                <div className="aspect-video bg-gray-100">
                  <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{ep?.seasons?.title} — Ep {ep?.number}</p>
                    <p className="text-sm text-gray-500">{ep?.title || 'Untitled'}</p>
                  </div>
                  <Badge className="border text-xs bg-gray-100 text-gray-600 border-gray-200">{r.platform.replace('_', ' ')}</Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{r.views?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">Views</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Heart className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{r.likes?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">Likes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <MessageCircle className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{r.comments?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">Comments</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{r.shares?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">Shares</p>
                  </div>
                </div>

                {r.retention_rate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Retention rate</span>
                    <span className="font-semibold text-gray-900">{r.retention_rate}%</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Published {r.published_at ? new Date(r.published_at).toLocaleDateString() : 'Unknown'}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:underline">
                      View post →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
