import type { CreatePollPayload, PollListResponse, PollResponse, VotePollPayload } from '@/types/api/poll'

const readErrorMessage = async (response: Response) => {
  const text = await response.text()
  return text || 'Request failed'
}

export const getPolls = async (channelId: string): Promise<PollListResponse> => {
  const url = new URL('/api/polls', window.location.origin)
  url.searchParams.set('channelId', channelId)

  const response = await fetch(url.toString(), {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json()
}

export const createPoll = async (payload: CreatePollPayload): Promise<PollResponse> => {
  const response = await fetch('/api/polls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json()
}

export const votePoll = async (
  pollId: string,
  payload: VotePollPayload,
): Promise<PollResponse> => {
  const response = await fetch(`/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json()
}

export const deletePoll = async (pollId: string): Promise<{ success: boolean }> => {
  const response = await fetch(`/api/polls/${pollId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json()
}