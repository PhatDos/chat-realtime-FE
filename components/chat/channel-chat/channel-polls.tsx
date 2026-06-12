'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, Vote, X } from 'lucide-react'
import { useSocket } from '@/components/providers/socket-provider'
import { createPoll, deletePoll, getPolls, votePoll } from '@/services/polls-service'
import type { PollResponse } from '@/types/api/poll'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { cn } from '@/lib/utils'

interface ChannelPollsProps {
  channelId: string
  channelName: string
  currentMemberId: string
}

type PollFormOption = {
  id: string
  text: string
}

const DATE_FORMAT = 'd MMM yyyy, HH:mm'

export const ChannelPolls = ({ channelId, channelName, currentMemberId }: ChannelPollsProps) => {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const [isCreating, setIsCreating] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<PollFormOption[]>(() => [
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' },
    { id: crypto.randomUUID(), text: '' },
  ])
  const [error, setError] = useState<string | null>(null)

  const queryKey = useMemo(() => ['polls', channelId], [channelId])

  const pollsQuery = useQuery({
    queryKey,
    queryFn: () => getPolls(channelId),
    enabled: !!channelId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!socket) return

    const handlePollUpdated = (payload?: {
      channelId: string
      action: 'created' | 'voted' | 'deleted'
      question: string
      pollId?: string
    }) => {
      queryClient.invalidateQueries({ queryKey })
    }

    socket.on('poll:updated', handlePollUpdated)

    return () => {
      socket.off('poll:updated', handlePollUpdated)
    }
  }, [queryClient, queryKey, socket])

  const createMutation = useMutation({
    mutationFn: createPoll,
    onSuccess: async () => {
      setQuestion('')
      setOptions([
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
      ])
      setIsCreating(false)
      setError(null)
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      votePoll(pollId, { optionId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePoll,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const canSubmit = question.trim().length > 0 && options.filter((option) => option.text.trim()).length >= 2

  const updateOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((option, currentIndex) =>
        currentIndex === index ? { ...option, text: value } : option,
      ),
    )
  }

  const addOption = () => {
    setOptions((current) => [...current, { id: crypto.randomUUID(), text: '' }])
  }

  const removeOption = (index: number) => {
    setOptions((current) =>
      current.length <= 2 ? current : current.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  const onCreatePoll = async () => {
    const trimmedOptions = options.map((option) => option.text.trim()).filter(Boolean)

    if (!question.trim() || trimmedOptions.length < 2) {
      setError('Poll needs a question and at least two options.')
      return
    }

    setError(null)

    try {
      await createMutation.mutateAsync({
        channelId,
        question,
        options: trimmedOptions,
      })
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Failed to create poll')
    }
  }

  const polls = pollsQuery.data?.items ?? []

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-gradient-to-b from-white dark:from-zinc-950 to-gray-50 dark:to-zinc-900">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-zinc-700 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Polls</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Create and vote on polls in #{channelName}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreating((value) => !value)}
          className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950"
        >
          {isCreating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isCreating ? 'Close' : 'New poll'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isCreating && (
          <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-950">
            <div className="space-y-3">
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question..."
                className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />

              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      value={option.text}
                      onChange={(event) => updateOption(index, event.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                      className="px-3 text-zinc-500 hover:text-rose-500"
                      disabled={options.length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={addOption} className="gap-2 text-indigo-600 hover:text-indigo-700">
                  <Plus className="h-4 w-4" />
                  Add option
                </Button>
                <Button
                  type="button"
                  onClick={onCreatePoll}
                  disabled={!canSubmit || createMutation.isPending}
                  className="ml-auto gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create poll
                </Button>
              </div>

              {error && <p className="text-sm text-rose-500">{error}</p>}
            </div>
          </div>
        )}

        {pollsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : pollsQuery.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Failed to load polls.
          </div>
        ) : polls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            No polls yet. Create the first one for #{channelName}.
          </div>
        ) : (
          polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(optionId) => voteMutation.mutate({ pollId: poll.id, optionId })}
              onDelete={() => deleteMutation.mutate(poll.id)}
              canDelete={poll.createdBy.id === currentMemberId}
              isDeleting={deleteMutation.isPending}
              isVoting={voteMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  )
}

const PollCard = ({
  poll,
  onVote,
  onDelete,
  canDelete,
  isVoting,
  isDeleting,
}: {
  poll: PollResponse
  onVote: (optionId: string) => void
  onDelete: () => void
  canDelete: boolean
  isVoting: boolean
  isDeleting: boolean
}) => {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{poll.question}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Created by {poll.createdBy.profile.name} • {format(new Date(poll.createdAt), DATE_FORMAT)}
          </p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {poll.totalVotes} votes
        </div>
      </div>

      {canDelete && (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            disabled={isDeleting}
            className="gap-2 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete poll
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {poll.options.map((option) => {
          const totalVotes = Math.max(poll.totalVotes, 1)
          const percentage = Math.round((option.votesCount / totalVotes) * 100)

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onVote(option.id)}
              disabled={isVoting}
              className={cn(
                'group relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left transition',
                option.isSelected
                  ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/60'
                  : 'border-zinc-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/40',
                isVoting && 'cursor-not-allowed opacity-70',
              )}
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0 bg-indigo-100/70 transition-all dark:bg-indigo-900/40',
                  option.isSelected ? 'opacity-100' : 'opacity-60',
                )}
                style={{ width: `${percentage}%` }}
              />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className={cn('text-sm font-medium', option.isSelected ? 'text-indigo-700 dark:text-indigo-200' : 'text-zinc-700 dark:text-zinc-200')}>
                  {option.text}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {option.votesCount} • {percentage}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{poll.myVoteOptionId ? 'You already voted' : 'Tap an option to vote'}</span>
        <span className="inline-flex items-center gap-1">
          <Vote className="h-3.5 w-3.5" />
          Live updates enabled
        </span>
      </div>
    </div>
  )
}