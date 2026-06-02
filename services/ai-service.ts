import type { ClientApi } from '@/services/client-api'

export type AiUnreadSummaryResponse = {
  summary: string
  mainTopics: string[]
  decisions: string[]
  importantQuestions: string[]
  actionItems: string[]
}

export const getAiUnreadSummary = async (
  api: ClientApi,
  channelId: string
) => {
  return api.get<AiUnreadSummaryResponse | { data?: AiUnreadSummaryResponse }>(
    `/ai/${channelId}/unread-summary`
  )
}
