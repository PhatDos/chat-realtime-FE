import type { ApiDateTime, MemberWithProfileResponse } from '@/types/api/member'

export interface PollOptionResponse {
  id: string
  text: string
  votesCount: number
  isSelected: boolean
}

export interface PollResponse {
  id: string
  question: string
  channelId: string
  createdAt: ApiDateTime
  createdBy: MemberWithProfileResponse
  options: PollOptionResponse[]
  totalVotes: number
  myVoteOptionId: string | null
}

export interface PollListResponse {
  items: PollResponse[]
}

export interface CreatePollPayload {
  channelId: string
  question: string
  options: string[]
}

export interface VotePollPayload {
  optionId: string
}