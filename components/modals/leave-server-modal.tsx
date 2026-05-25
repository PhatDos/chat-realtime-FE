'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useModal } from '@/hooks/use-modal-store'
import { Button } from '../ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useApiClient } from '@/hooks/use-api-client'
import { useQueryClient } from '@tanstack/react-query'
import { leaveServer } from '@/services/servers/servers-service'
import { invalidateServers } from '@/lib/query/server-cache'

export const LeaveServerModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const router = useRouter()
  const { toast } = useToast()
  const api = useApiClient()
  const queryClient = useQueryClient()
  const isModalOpen = isOpen && type === 'leaveServer'
  const { server } = data

  const [isLoading, setIsLoading] = useState(false)
  const onClick = async () => {
    try {
      setIsLoading(true)

      await leaveServer(api, server?.id as string)

      toast.server.successLeave(server?.name)

      // Refetch servers list
      await invalidateServers(queryClient)

      onClose()
      router.push('/newsfeed')
    } catch (err) {
      console.log(err)
      toast.server.errorLeave()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className='bg-black text-white overflow-hidden'>
        <DialogHeader className='pt-8 px-6'>
          <DialogTitle className='text-2xl text-center font-bold'>
            Im done with this server
          </DialogTitle>
          <DialogDescription className='text-center text-zinc-500'>
            Are u sure? u really want to leave?{' '}
            <span className='font-semibold text-purple-700'>
              {server?.name}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='px-6 py-1'>
          <div className='flex items-center justify-between w-full'>
            <Button disabled={isLoading} onClick={onClose} variant='ghost'>
              Cancel
            </Button>
            <Button disabled={isLoading} variant='default' onClick={onClick}>
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
