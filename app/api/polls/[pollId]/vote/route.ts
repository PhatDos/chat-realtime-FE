import { NextResponse } from 'next/server'
import { fetchWithAuth } from '@/lib/server-api-client'
import { withRoute } from '@/lib/with-route'

type RouteContext = {
  params: Promise<{ pollId: string }>
}

export const POST = withRoute(async (req: Request, context: RouteContext) => {
  const { pollId } = await context.params
  const body = await req.json()

  const response = await fetchWithAuth((client, config) =>
    client.post(`/polls/${pollId}/vote`, body, config),
  )

  return NextResponse.json(response.data)
}, 'POLLS_VOTE_POST')