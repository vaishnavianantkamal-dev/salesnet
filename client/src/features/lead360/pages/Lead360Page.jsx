import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, RefreshCw, Radar } from 'lucide-react'
import { getLeadsApi } from '@/api/leads.api'
import { getLead360Api } from '@/api/lead360.api'
import { useDebounce } from '@/hooks/useDebounce'
import { cn, getInitials } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { TEMP_STYLES, timeAgo } from '../lib/theme'
import { ScoreRing } from '../components/Lead360Atoms'
import Lead360ProfileBody from '../components/Lead360ProfileBody'

const TEMP_FILTERS = [
  { value: '', label: 'All' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

export default function Lead360Page() {
  const [search, setSearch] = useState('')
  const [temperature, setTemperature] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['lead360-roster', debouncedSearch, temperature],
    queryFn: async () => {
      const res = await getLeadsApi({
        limit: 50,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(temperature && { temperature }),
      })
      return res.data
    },
    keepPreviousData: true,
  })

  const leads = leadsData?.data?.leads || []
  const total = leadsData?.data?.meta?.total || 0

  const activeId = selectedId || leads[0]?._id || null

  const { data: profile, isLoading: profileLoading, isError: profileError, refetch, isFetching } = useQuery({
    queryKey: ['lead360', activeId],
    queryFn: () => getLead360Api(activeId).then(r => r.data?.data || r.data),
    enabled: !!activeId,
    staleTime: 60 * 1000,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            Lead 360°
          </h1>
          <p className="page-subtitle">AI-driven intelligence profile for every lead</p>
        </div>
        {activeId && profile && (
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
            Recompute
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_1fr] gap-4 items-start">
        {/* Roster */}
        <Card className="lg:sticky lg:top-4 max-h-[calc(100vh-140px)] flex flex-col">
          <CardContent className="p-4 flex flex-col gap-3 overflow-hidden">
            <p className="text-xs text-muted-foreground">
              {leadsLoading ? 'Loading…' : `${leads.length} of ${total} leads`}
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                type="search"
                placeholder="Search name, company, phone…"
                aria-label="Search leads"
                className="pl-9"
              />
            </div>

            <div className="flex gap-1.5">
              {TEMP_FILTERS.map(t => (
                <Button
                  key={t.value || 'all'}
                  size="sm"
                  variant={temperature === t.value ? 'default' : 'outline'}
                  className="flex-1 px-2"
                  onClick={() => setTemperature(t.value)}
                  aria-pressed={temperature === t.value}
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2 overflow-y-auto -mx-1 px-1">
              {leadsLoading && (
                <div className="flex items-center justify-center py-10 gap-2.5 text-muted-foreground">
                  <Spinner size="sm" />
                  <span className="text-sm">Loading leads…</span>
                </div>
              )}
              {!leadsLoading && leads.length === 0 && (
                <div className="py-10 px-4 text-center text-muted-foreground text-sm">
                  No leads match these filters.
                </div>
              )}
              {leads.map(lead => {
                const temp = (lead.temperature || 'cold').toUpperCase()
                const meta = TEMP_STYLES[temp] || TEMP_STYLES.COLD
                const selected = lead._id === activeId
                return (
                  <button
                    key={lead._id}
                    onClick={() => setSelectedId(lead._id)}
                    aria-current={selected}
                    className={cn(
                      'w-full flex items-center gap-3 text-left rounded-lg border p-2.5 transition-colors',
                      selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
                    )}
                  >
                    <span className={cn('self-stretch w-1 rounded-full', meta.bg)} />
                    <span className={cn('w-9 h-9 rounded-lg grid place-items-center text-xs font-semibold flex-shrink-0', meta.text, 'bg-muted')}>
                      {getInitials(lead.contact?.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-sm truncate text-foreground">
                        {lead.contact?.name || 'Unnamed lead'}
                      </span>
                      <span className="flex gap-1.5 items-center mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground truncate">{lead.contact?.company || ''}</span>
                        <span className="text-[11px] text-muted-foreground">· {timeAgo(lead.updatedAt || lead.createdAt)}</span>
                      </span>
                    </span>
                    <ScoreRing value={lead.score} strokeClass={meta.stroke} size={38} />
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <div>
          {!activeId && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                Select a lead to view its 360° profile.
              </CardContent>
            </Card>
          )}
          {activeId && profileLoading && (
            <Card>
              <CardContent className="flex items-center justify-center h-72 gap-3 text-muted-foreground">
                <Spinner />
                <span className="text-sm">Building 360° profile…</span>
              </CardContent>
            </Card>
          )}
          {activeId && profileError && (
            <Card>
              <CardContent className="py-10 text-center text-destructive text-sm">
                Failed to load profile.{' '}
                <button onClick={() => refetch()} className="text-primary underline underline-offset-2">Retry</button>
              </CardContent>
            </Card>
          )}
          {activeId && profile && <Lead360ProfileBody data={profile} />}
        </div>
      </div>
    </div>
  )
}
