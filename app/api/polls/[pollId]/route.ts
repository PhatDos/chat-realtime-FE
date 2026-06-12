import { NextResponse } from 'next/server'
import { fetchWithAuth } from '@/lib/server-api-client'
import { withRoute } from '@/lib/with-route'

type RouteContext = {
  params: Promise<{ pollId: string }>
}

export const DELETE = withRoute(async (_req: Request, context: RouteContext) => {
  const { pollId } = await context.params

  const response = await fetchWithAuth((client, config) =>
    client.delete(`/polls/${pollId}`, config),
  )

  return NextResponse.json(response.data)
}, 'POLLS_DELETE')