import { NextResponse } from 'next/server'
import { fetchWithAuth } from '@/lib/server-api-client'
import { withRoute } from '@/lib/with-route'

export const GET = withRoute(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return new NextResponse('Channel ID missing', { status: 400 })
  }

  const response = await fetchWithAuth((client, config) =>
    client.get('/polls', {
      ...config,
      params: { channelId },
    }),
  )

  return NextResponse.json(response.data)
}, 'POLLS_GET')

export const POST = withRoute(async (req: Request) => {
  const body = await req.json()

  const response = await fetchWithAuth((client, config) =>
    client.post('/polls', body, config),
  )

  return NextResponse.json(response.data)
}, 'POLLS_POST')