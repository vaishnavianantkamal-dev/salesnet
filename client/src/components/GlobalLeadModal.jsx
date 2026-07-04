import { useSelector, useDispatch } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { X, RefreshCw } from 'lucide-react'
import { getLead360Api } from '@/api/lead360.api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import Lead360ProfileBody from '@/features/lead360/components/Lead360ProfileBody'
import { closeLeadModal } from '@/features/ui/uiSlice'

export default function GlobalLeadModal() {
  const dispatch = useDispatch()
  const { isLeadModalOpen, selectedLeadId } = useSelector((state) => state.ui)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['lead360', selectedLeadId],
    queryFn: () => getLead360Api(selectedLeadId).then(r => r.data?.data || r.data),
    enabled: !!selectedLeadId && isLeadModalOpen,
    staleTime: 60 * 1000,
  })

  if (!isLeadModalOpen) return null

  const handleClose = () => {
    dispatch(closeLeadModal())
  }

  // Prevent clicks inside the modal from bubbling up and closing it
  const handleModalClick = (e) => {
    e.stopPropagation()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={handleClose} 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      >
        {/* Centered Modal */}
        <div 
          onClick={handleModalClick}
          className="relative z-[101] w-full max-w-5xl max-h-[90vh] bg-background rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-muted/30">
            <div>
              <div className="text-[10px] tracking-wider uppercase text-muted-foreground font-semibold">SalesNest · Intelligence</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                Lead 360° {data?.contact?.name ? `— ${data.contact.name}` : ''}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isFetching && 'animate-spin')} />
                Recompute
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
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
      </div>
    </>
  )
}
