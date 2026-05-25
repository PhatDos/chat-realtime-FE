'use client'

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem } from '../../ui/form'
import { Plus, Send } from 'lucide-react'
import { Input } from '../../ui/input'
import { useModal } from '@/hooks/use-modal-store'
import { EmojiPicker } from '../../common/emoji-picker'
import { ActionTooltip } from '../../common/action-tooltip'
import { useSocket } from '@/components/providers/socket-provider'
import { useQueryClient } from '@tanstack/react-query'
import { ProfileResponse as Profile } from '@/types/api/member'
import { chatQueryKey, insertMessage } from '@/lib/query/chat-cache'

interface DirectChatInputProps {
  apiUrl: string
  query: { conversationId: string; memberId: string }
  name: string
  profile: Profile
}

const formSchema = z.object({
  content: z.string().min(1)
})

export const DirectChatInput = ({
  name,
  apiUrl,
  query,
  profile
}: DirectChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { onOpen } = useModal()
  const { socket } = useSocket()
  const queryClient = useQueryClient()

  const queryKey = chatQueryKey(query.conversationId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: ''
    }
  })

  const isLoading = form.formState.isSubmitting

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!socket) return;

    const tempId = `temp-${Date.now()}`;

    // 1️⃣ Optimistic message
    insertMessage(queryClient, queryKey, {
      id: tempId,
      tempId,
      content: values.content,
      fileUrl: null,
      fileType: 'text',
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: profile,
      status: 'sending',
    })

    // 2️⃣ Emit lên BE
    socket.emit('dm:create', {
      tempId,
      content: values.content,
      conversationId: query.conversationId,
      senderId: query.memberId,
    });

    form.reset();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className='relative p-4 pb-6 bg-gradient-to-b from-white dark:from-zinc-950 to-gray-50 dark:to-zinc-900 border border-neutral-200 dark:border-zinc-700'>
                  <button
                    type='button'
                    onClick={() =>
                      onOpen('messageFile', {
                        apiUrl,
                        query: {
                          chatType: 'conversation',
                          conversationId: query.conversationId,
                          memberId: query.memberId
                        }
                      })
                    }
                    className='absolute top-7 left-8 h-[24px] w-[24px]
                    bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600
                    dark:hover:bg-zinc-300 transition rounded-full p-1
                    flex items-center justify-center'
                  >
                    <Plus className='text-white dark:text-[#313338]' />
                  </button>

                  <Input
                    disabled={isLoading}
                    className='px-14 pr-28 py-6 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 border border-neutral-200 dark:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-300 rounded-md transition-all duration-200'
                    placeholder={`Message ${name}`}
                    {...field}
                    ref={inputRef}
                  />
                  <div className='absolute top-7 right-8 flex gap-2'>
                    <EmojiPicker
                      onChange={(emoji: string) =>
                        field.onChange(`${field.value} ${emoji}`)
                      }
                    />
                    <ActionTooltip label='Send' side='top'>
                      <button
                        type='button'
                        onClick={() => form.handleSubmit(onSubmit)()}
                        disabled={isLoading}
                        className='flex items-center justify-center'
                        aria-label='Send'
                      >
                        <Send
                          className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition'
                          size={24}
                        />
                      </button>
                    </ActionTooltip>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
