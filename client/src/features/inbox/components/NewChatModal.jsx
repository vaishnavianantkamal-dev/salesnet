import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createLeadApi } from '@/api/leads.api'
import { useToast } from '@/components/ui/toast'

export default function NewChatModal({ onChatCreated }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data) => createLeadApi(data),
    onSuccess: (res) => {
      const lead = res.data?.data || res.data
      toast({
        title: 'Contact created',
        description: 'You can now start chatting with them.',
      })
      setOpen(false)
      setName('')
      setPhone('')
      queryClient.invalidateQueries(['inbox'])
      queryClient.invalidateQueries(['leads'])
      
      if (onChatCreated && lead) {
        // Find the lead format that InboxPage expects
        onChatCreated({
          leadId: lead._id,
          leadName: lead.contact?.name || lead.name || name,
          phone: lead.contact?.phone || lead.phone || phone,
          channel: 'whatsapp',
          lastMessageAt: new Date().toISOString()
        })
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create contact',
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    createMutation.mutate({
      source: 'whatsapp',
      contact: {
        name: name.trim(),
        phone: phone.trim().replace(/[^0-9]/g, '')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mb-3 flex items-center justify-center gap-2 border-dashed">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New WhatsApp Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contact Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp Number (with country code)</Label>
            <Input
              id="phone"
              placeholder="e.g. 919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Enter the full number including country code without '+' (e.g. 91 for India).
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={createMutation.isPending || !name.trim() || !phone.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Start Chat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
