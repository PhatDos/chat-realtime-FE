'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem } from '../../ui/form'
import { Plus, Send, Brain, Loader2, Upload, BookOpen } from 'lucide-react'
import { Input } from '../../ui/input'
import { useModal } from '@/hooks/use-modal-store'
import { EmojiPicker } from '../../common/emoji-picker'
import { ActionTooltip } from '../../common/action-tooltip'
import { useSocket } from '@/components/providers/socket-provider'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LoadingOverlay } from '../../common/loading-overlay'
import { useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/hooks/use-api-client'
import { useToast } from '@/hooks/use-toast'
import {
  getAiUnreadSummary,
  type AiUnreadSummaryResponse,
} from '@/services/ai-service'

import { OptimisticMessage } from '@/types'
import { chatQueryKey, insertMessage } from '@/lib/query/chat-cache'
import { MemberRole } from '@/types/api/member'

interface ChannelChatInputProps {
  query: { channelId: string; serverId: string }
  name: string
  memberId: string
  role?: MemberRole
}

const formSchema = z.object({
  content: z.string().min(1)
})

export const ChannelChatInput = ({
  name,
  query,
  memberId,
  role,
}: ChannelChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { onOpen } = useModal()
  const { socket } = useSocket()
  const { userId } = useAuth()
  const router = useRouter()
  const apiClient = useApiClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const queryKey = chatQueryKey(query.channelId)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onNavigateToLectureUpload = () => {
    const url = `/lectures?serverId=${encodeURIComponent(query.serverId)}&channelId=${encodeURIComponent(query.channelId)}&memberId=${encodeURIComponent(memberId)}`
    startTransition(() => {
      void router.push(url)
    })
  }

  const canUploadLecture = role === MemberRole.SERVEROWNER || role === MemberRole.VICESERVEROWNER

  const openLectureHub = async () => {
    try {
      const url = `/lectures?serverId=${encodeURIComponent(query.serverId)}&channelId=${encodeURIComponent(query.channelId)}&memberId=${encodeURIComponent(memberId)}&view=student`

      startTransition(() => {
        void router.push(url)
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open lecture',
        variant: 'destructive',
      })
    }
  }

  const normalizeAiSummaryResponse = (
    data: unknown,
  ): AiUnreadSummaryResponse | null => {
    if (!data || typeof data !== 'object') {
      return null
    }

    const payload = data as Record<string, unknown>
    const direct = payload.summary ? payload : payload.data

    if (!direct || typeof direct !== 'object') {
      return null
    }

    const candidate = direct as Record<string, unknown>

    const summary = candidate.summary
    const mainTopics = candidate.mainTopics
    const decisions = candidate.decisions
    const importantQuestions = candidate.importantQuestions
    const actionItems = candidate.actionItems

    if (typeof summary !== 'string') {
      return null
    }

    return {
      summary: summary.trim(),
      mainTopics: Array.isArray(mainTopics)
        ? mainTopics.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
        : [],
      decisions: Array.isArray(decisions)
        ? decisions.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
        : [],
      importantQuestions: Array.isArray(importantQuestions)
        ? importantQuestions.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
        : [],
      actionItems: Array.isArray(actionItems)
        ? actionItems.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
        : [],
    }
  }

  const formatAiSummaryContent = (summary: AiUnreadSummaryResponse): string => {
    const sections = [
      ['Main topics', summary.mainTopics],
      ['Decisions', summary.decisions],
      ['Important questions', summary.importantQuestions],
      ['Action items', summary.actionItems],
    ] as const

    const body = sections
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => `${label}:\n${items.map((item) => `- ${item}`).join('\n')}`)
      .join('\n\n')

    return [summary.summary, body].filter(Boolean).join('\n\n').trim()
  }

  const getAiSummaryContent = (data: unknown): string => {
    if (typeof data === 'string') return data.trim()

    const summary = normalizeAiSummaryResponse(data)
    if (summary?.summary) {
      return formatAiSummaryContent(summary)
    }

    if (!data || typeof data !== 'object') {
      return String(data ?? '').trim()
    }

    const payload = data as Record<string, unknown>
    const candidates = [payload.summary, payload.content, payload.message]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }

    if (payload.data && typeof payload.data === 'object') {
      const nested = payload.data as Record<string, unknown>
      const nestedCandidates = [nested.summary, nested.content, nested.message]

      for (const candidate of nestedCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim()
        }
      }
    }

    return JSON.stringify(data, null, 2)
  }

  const onClickAiSummary = async () => {
    if (isAiLoading) return

    setIsAiLoading(true)

    try {
      const data = await getAiUnreadSummary(apiClient, query.channelId)

      const summaryContent = getAiSummaryContent(data)

      if (!summaryContent) {
        toast.ai.infoUnreadSummaryNoContent()
        return
      }

      const now = new Date()
      const aiResponseMessage: OptimisticMessage = {
        id: crypto.randomUUID(),
        content: summaryContent,
        member: {
          id: 'ai-response',
          profile: {
            userId: 'ai-response',
            name: 'AI Response',
            imageUrl: '/globe.svg'
          }
        },
        createdAt: now,
        updatedAt: now,
        deleted: false,
      }

      insertMessage(queryClient, queryKey, aiResponseMessage)
    } catch (error) {
      console.error('[AI unread-summary] request failed', error)

      toast.ai.errorUnreadSummary(
        error instanceof Error ? error.message : 'Failed to fetch summary'
      )
    } finally {
      setIsAiLoading(false)
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: ''
    }
  })

  const isLoading = form.formState.isSubmitting

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!socket || !userId) return

    const tempId = crypto.randomUUID()

    // tạo message tạm
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      content: values.content,
      member: {
        id: 'temp',
        profile: {
          userId,
          name: 'You',
          imageUrl: '', // avatar hiện tại
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      status: "sending",
      isOptimistic: true,
    }

    // insert ngay vào cache của Tanstack query
    insertMessage(queryClient, queryKey, optimisticMessage)

    socket.emit('channel:message:create', {
      tempId,  //
      content: values.content,
      channelId: query.channelId,
      memberId: userId,
    })

    form.reset()
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <Form {...form}>
      <LoadingOverlay isLoading={isPending} text="Opening upload..." />
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
                        query: {
                          chatType: 'channel',
                          channelId: query.channelId,
                          serverId: query.serverId,
                          memberId: userId ?? ''
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
                    className='px-14 pr-36 py-6 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 border border-neutral-200 dark:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-300 rounded-md transition-all duration-200'
                    placeholder={`Message #${name}`}
                    {...field}
                    ref={inputRef}
                  />
                  <div className='absolute flex top-7 right-8 gap-2'>
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
                    <ActionTooltip label='AI summary historic chat' side='top'>
                      <button
                        type='button'
                        onClick={onClickAiSummary}
                        disabled={isAiLoading}
                        className='flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60'
                        aria-label='AI summary historic chat'
                      >
                        {isAiLoading ? (
                          <Loader2
                            className='text-zinc-500 dark:text-zinc-400 animate-spin'
                            size={24}
                          />
                        ) : (
                          <Brain
                            className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition'
                            size={24}
                          />
                        )}
                      </button>
                    </ActionTooltip>
                    {canUploadLecture ? (
                      <ActionTooltip label='Upload lecture' side='top'>
                        <button
                          type='button'
                          onClick={onNavigateToLectureUpload}
                          className='flex items-center justify-center'
                          aria-label='Upload lecture'
                        >
                          <Upload
                            className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition'
                            size={24}
                          />
                        </button>
                      </ActionTooltip>
                    ) : (
                      <ActionTooltip label='Lecture materials' side='top'>
                        <button
                          type='button'
                          onClick={() => void openLectureHub()}
                          disabled={isPending}
                          className='flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60'
                          aria-label='Lecture materials'
                        >
                          {isPending ? (
                            <Loader2 className='text-zinc-500 dark:text-zinc-400 animate-spin' size={24} />
                          ) : (
                            <BookOpen className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition' size={24} />
                          )}
                        </button>
                      </ActionTooltip>
                    )}
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

