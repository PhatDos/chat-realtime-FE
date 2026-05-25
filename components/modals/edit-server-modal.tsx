'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/common/file-upload'
import { useModal } from '@/hooks/use-modal-store'
import { useToast } from '@/hooks/use-toast'
import { useApiClient } from '@/hooks/use-api-client'
import { useQueryClient } from '@tanstack/react-query'
import { updateServer } from '@/services/servers/servers-service'
import { invalidateServers } from '@/lib/query/server-cache'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe, Lock } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'Server name is required'),
  imageUrl: z.string().min(1, 'Server image is required'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
})

export const EditServerModal = () => {
  const { isOpen, onClose, type, data } = useModal()
  const { toast } = useToast()
  const api = useApiClient()
  const queryClient = useQueryClient()

  const isModalOpen = isOpen && type === 'editServer'
  const { server } = data

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      imageUrl: '',
      visibility: 'PRIVATE' as const,
    },
  })

  React.useEffect(() => {
    if (!server) return

    form.setValue('name', server.name)
    form.setValue('imageUrl', server.imageUrl)
    form.setValue('visibility', server.visibility)
  }, [server, form])

  const isLoading = form.formState.isSubmitting

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!server?.id) return

    try {
      await updateServer(api, server.id, values)

      toast.server.successUpdate(values.name)

      await invalidateServers(queryClient)

      form.reset()
      onClose()
    } catch (error) {
      console.error(error)
      toast.server.errorUpdate()
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className='bg-white text-black p-0 overflow-visible'>
        <DialogHeader className='pt-8 px-6'>
          <DialogTitle className='text-2xl text-center font-bold'>
            Customize your server 🎨
          </DialogTitle>
          <DialogDescription className='text-center text-zinc-500 italic'>
            Make your server truly yours and enhance your community experience.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2 px-6'>
              <div className='flex justify-center px-6'>
                <FormField
                  control={form.control}
                  name='imageUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint='serverImage'
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid gap-2 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='uppercase pt-3 text-xs font-bold text-zinc-500 dark:text-secondary-500'>
                        Server name
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          className='bg-zinc-300/50 border-2 focus-visible:ring-0 text-black focus-visible:ring-offset-0 placeholder:italic placeholder:text-sm placeholder:text-zinc-500'
                          placeholder='Enter server name'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='text-xs italic text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='visibility'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='uppercase pt-3 text-xs font-bold text-zinc-500 dark:text-secondary-500'>
                        Visibility
                      </FormLabel>
                      <Select
                        disabled={isLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full bg-zinc-300/50 border-2 focus-visible:ring-0 text-black focus-visible:ring-offset-0'>
                            <SelectValue placeholder='Select visibility' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='z-[60] bg-white dark:bg-[#2b2d31]' sideOffset={8}>
                          <SelectItem value='PRIVATE' className='cursor-pointer'>
                            <div className='flex items-center gap-1.5 whitespace-nowrap'>
                              <Lock className='h-3.5 w-3.5' />
                              <span>Private</span>
                            </div>
                          </SelectItem>
                          <SelectItem value='PUBLIC' className='cursor-pointer'>
                            <div className='flex items-center gap-1.5 whitespace-nowrap'>
                              <Globe className='h-3.5 w-3.5' />
                              <span>Public</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className='text-xs italic text-red-500' />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className='bg-gray-300 px-6 py-2 flex justify-center'>
              <Button
                className='w-1/3 bg-slate-50 border-purple-500 border-2 hover:bg-slate-300 px-4 py-2 text-sm'
                disabled={isLoading}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
