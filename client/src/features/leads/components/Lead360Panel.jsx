import { useQuery } from '@tanstack/react-query'
import { X, RefreshCw } from 'lucide-react'
import { getLead360Api } from '@/api/lead360.api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import Lead360ProfileBody from '@/features/lead360/components/Lead360ProfileBody'

export default function Lead360Panel({ leadId, leadName, onClose }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['lead360', leadId],
    queryFn: () => getLead360Api(leadId).then(r => r.data?.data || r.data),
    enabled: !!leadId,
    staleTime: 60 * 1000,
  })

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-[49] bg-black/45" />

      <div className="fixed top-0 right-0 bottom-0 z-50 w-[min(820px,95vw)] bg-background border-l border-border shadow-2xl flex flex-col overflow-y-auto animate-slide-in-right">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0 sticky top-0 bg-background z-10">
          <div>
            <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">SalesNest · Intelligence</div>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">Lead 360° — {leadName || 'Profile'}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isFetching && 'animate-spin')} />
              Recompute
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5">
          {isLoading && (
            <div className="flex items-center justify-center h-72 gap-3 text-muted-foreground">
              <Spinner />
              <span className="text-sm">Building 360° profile…</span>
            </div>
          )}
          {isError && (
            <div className="text-center py-10 text-destructive text-sm">
              Failed to load profile.{' '}
              <button onClick={() => refetch()} className="text-primary underline underline-offset-2">Retry</button>
            </div>
          )}
          {data && <Lead360ProfileBody data={data} />}
        </div>
      </div>
    </>
  )
}
