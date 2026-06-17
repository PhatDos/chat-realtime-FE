'use client'

import { useChannelRoom } from '@/hooks/use-channel-room'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useSocket } from '@/components/providers/socket-provider'
import { MemberResponse as Member } from '@/types/api/member'
import { ChannelChatInput } from './channel-chat-input'
import { ChannelChatMessages } from './channel-chat-messages'
import { ChannelPolls } from './channel-polls'
import { ChatAttachmentsPanel } from '../chat-attachments-panel'

interface ChannelChatWorkspaceProps {
  channelId: string
  serverId: string
  channelName: string
  member: Member
  apiUrl: string
  activeTab?: 'messages' | 'polls' | 'media' | 'files'
}

export const ChannelChatWorkspace = ({
  channelId,
  serverId,
  channelName,
  member,
  apiUrl,
  activeTab = 'messages',
}: ChannelChatWorkspaceProps) => {
  const { socket } = useSocket()
  const { toast } = useToast()
  useChannelRoom(channelId)

  useEffect(() => {
    if (!socket) return

    const handlePollUpdated = (payload?: {
      channelId: string
      action: 'created' | 'voted' | 'deleted'
      question: string
      pollId?: string
    }) => {
      if (!payload || payload.channelId !== channelId) return

      const titleByAction: Record<typeof payload.action, string> = {
        created: 'New poll created',
        voted: 'Poll vote updated',
        deleted: 'Poll deleted',
      }

      toast({
        title: titleByAction[payload.action],
        description: payload.question,
        variant: 'info',
      })
    }

    socket.on('poll:updated', handlePollUpdated)

    return () => {
      socket.off('poll:updated', handlePollUpdated)
    }
  }, [channelId, socket, toast])

  if (activeTab === 'polls') {
    return (
    <ChannelPolls
      channelId={channelId}
      channelName={channelName}
      currentMemberId={member.id}
    />
    )
  }

  if (activeTab === 'media' || activeTab === 'files') {
    return <ChatAttachmentsPanel scope='channel' id={channelId} type={activeTab} />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChannelChatMessages
        member={member}
        name={channelName}
        chatId={channelId}
        apiUrl={apiUrl}
        socketQuery={{
          channelId,
          serverId,
        }}
      />
      <ChannelChatInput
        name={channelName}
        memberId={member.id}
        role={member.role}
        query={{
          channelId,
          serverId,
        }}
      />
    </div>
  )
}
