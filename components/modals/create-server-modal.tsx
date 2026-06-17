'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import * as React from 'react'
import { FileUpload } from '@/components/common/file-upload'
import { useRouter } from 'next/navigation'
import { useModal } from '@/hooks/use-modal-store'
import { useToast } from '@/hooks/use-toast'
import { useApiClient } from '@/hooks/use-api-client'
import { useQueryClient } from '@tanstack/react-query'
import { createServer } from '@/services/servers/servers-service'
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
  description: z.string().max(160, 'Description must be 160 characters or less').optional(),
  imageUrl: z.string().min(1, 'Server image is required'),
  visibility: z.enum(['PUBLIC', 'PRIVATE'])
})

export const CreateServerModal = () => {
  const { isOpen, onClose, type } = useModal()
  const router = useRouter()
  const { toast } = useToast()
  const api = useApiClient()
  const queryClient = useQueryClient()

  const isModalOpen = isOpen && type === 'createServer'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      visibility: 'PRIVATE' as const,
    }
  })

  const isLoading = form.formState.isSubmitting

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = await createServer(api, values)

      toast.server.successCreate(values.name)

      // Refetch servers list
      await invalidateServers(queryClient)

      onClose()
      form.reset()
      
      // Redirect to the new server
      if (data?.id) {
        router.push(`/servers/${data.id}`)
      }
    } catch (error) {
      console.error(error)
      toast.server.errorCreate()
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
            Create your server
          </DialogTitle>
          <DialogDescription className='text-center text-zinc-500 italic'>
            Create your own server with a name and an image.
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
                    <FormItem className='w-full'>
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
              <div className='grid gap-2 md:grid-cols-2 mt-8'>
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
                          className='bg-zinc-100/50 border-2 focus-visible:ring-0 text-black focus-visible:ring-offset-0 placeholder:italic placeholder:text-sm placeholder:text-zinc-500'
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
                          <SelectTrigger className='w-full bg-zinc-100/50 border-2 focus-visible:ring-0 text-black focus-visible:ring-offset-0'>
                            <SelectValue placeholder='Select visibility' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          className='z-[60] bg-white dark:bg-[#2b2d31]'
                          sideOffset={8}
                        >
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
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='uppercase pt-3 text-xs font-bold text-zinc-500 dark:text-secondary-500'>
                      Description
                    </FormLabel>
                    <FormControl>
                      <textarea
                        disabled={isLoading}
                        className='min-h-20 w-full resize-none rounded-md bg-zinc-100/50 border-2 px-3 py-2 text-sm text-black placeholder:italic placeholder:text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
                        placeholder='Describe this server'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs italic text-red-500' />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className='bg-gray-300 px-6 py-2 flex flex-row justify-center'>
              <Button
                className='w-1/3 bg-slate-50 border-purple-500 border-2 hover:bg-slate-300 px-4 py-2 text-sm'
                disabled={isLoading}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
