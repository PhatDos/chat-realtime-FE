import { Hash } from 'lucide-react'
import Link from 'next/link'
import { MobileToggle } from '../common/mobile-toggle'
import { ConversationMobileToggle } from '../common/conversation-mobile-toggle'
import { ProfileHoverCard } from '../common/profile-hover-card'
import { SocketIndicator } from '../common/socket-indicator'
import { ChatVideoButton } from './chat-video-button'
import { ChatNewsfeedButton } from './chat-newsfeed-button'
import { ConversationWithProfiles } from '@/types/api/message'

interface ChatHeaderProps {
  serverId?: string
  name: string
  type: 'channel' | 'conversation'
  imageUrl?: string
  otherProfileId?: string
  conversations?: ConversationWithProfiles[]
  currentProfileId?: string
  activeTab?: 'messages' | 'polls'
}
export const ChatHeader = ({
  serverId,
  name,
  type,
  imageUrl,
  otherProfileId,
  conversations,
  currentProfileId,
  activeTab = 'messages'
}: ChatHeaderProps) => {
  const isChannel = type !== 'conversation'

  return (
    <div
      className='text-md font-semibold px-3 flex items-center h-12
        bg-gradient-to-r from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800
        border-neutral-200 dark:border-zinc-700 border-b shadow-sm
        transition-all duration-300 hover:shadow-md'
    >
      {serverId && <MobileToggle serverId={serverId} />}
      {type === 'conversation' && conversations && currentProfileId && (
        <ConversationMobileToggle
          conversations={conversations}
          currentProfileId={currentProfileId}
        />
      )}
      {type === 'channel' && (
        <Hash className='w-5 h-4 text-zinc-500 dark:text-zinc-400 mr-2' />
      )}
      {type === 'conversation' && otherProfileId && (
        <ProfileHoverCard
          id={otherProfileId}
          name={name}
          imageUrl={imageUrl}
          currentProfileId={currentProfileId}
          className='h-8 w-8 md:h-8 md:w-8 mr-2'
        />
      )}
      <p className='font-semibold text-md text-black dark:text-white'>{name}</p>
      <div className='ml-auto flex items-center gap-2'>
        {isChannel && (
          <div className='hidden md:!flex items-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900'>
            <Link
              href='?tab=messages'
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                activeTab === 'messages'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-300'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Messages
            </Link>
            <Link
              href='?tab=polls'
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                activeTab === 'polls'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-300'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Polls
            </Link>
          </div>
        )}
        <ChatNewsfeedButton />
        {type === 'conversation' && <ChatVideoButton />}
        <SocketIndicator />
      </div>
    </div>
  )
}
