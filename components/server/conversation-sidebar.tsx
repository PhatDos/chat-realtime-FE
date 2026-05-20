'use client'

import { ConversationWithProfiles } from '@/types/api/message'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useParams, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LoadingOverlay } from '../common/loading-overlay'
import { ProfileHoverCard } from '../common/profile-hover-card'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface ConversationSidebarProps {
  conversations: ConversationWithProfiles[]
  currentProfileId: string
}

export const ConversationSidebar = ({
  conversations,
  currentProfileId
}: ConversationSidebarProps) => {
  const router = useRouter()
  const params = useParams()
  const [isPending, startTransition] = useTransition()

  return (
    <div className='flex flex-col h-full flex-1 text-primary dark:bg-[#2B2D31] bg-[#f2f3f5]'>
      <LoadingOverlay isLoading={isPending} text="Opening conversation..." />
      <div className='px-3 py-4 border-b border-zinc-200 dark:border-zinc-700'>
        <h2 className='text-lg font-semibold'>Direct Messages</h2>
      </div>
      <ScrollArea className='flex-1 px-3'>
        <div className='space-y-[2px] mt-2'>
          {conversations.length > 0 ? (
            conversations.map(conversation => {
              const otherProfile =
                conversation.profileOneId === currentProfileId
                  ? conversation.profileTwo
                  : conversation.profileOne

              const isActive = params?.profileId === otherProfile.id

              return (
                <div
                  key={conversation.id}
                  onClick={() => {
                    startTransition(() => {
                      void router.push(`/conversations/${otherProfile.id}`)
                    })
                  }}
                  role='button'
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      startTransition(() => {
                        void router.push(`/conversations/${otherProfile.id}`)
                      })
                    }
                  }}
                  className={cn(
                    'group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1',
                    isActive && 'bg-zinc-700/50 dark:bg-zinc-700',
                    'cursor-pointer text-left'
                  )}
                >
                  <ProfileHoverCard
                    id={otherProfile.id}
                    name={otherProfile.name}
                    imageUrl={otherProfile.imageUrl}
                    currentProfileId={currentProfileId}
                    className='h-8 w-8 md:h-8 md:w-8'
                  />
                  <p
                    className={cn(
                      'font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition',
                      isActive &&
                        'text-primary dark:text-zinc-200 dark:group-hover:text-white'
                    )}
                  >
                    {otherProfile.name}
                  </p>
                </div>
              )
            })
          ) : (
            <div className='flex flex-col items-center justify-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <div className='p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4 animate-in zoom-in duration-500 delay-100'>
                <MessageSquare className='w-8 h-8 text-zinc-400 dark:text-zinc-500' />
              </div>
              <h3 className='text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1'>
                No conversations yet
              </h3>
              <p className='text-xs text-zinc-500 dark:text-zinc-400 text-center px-2'>
                Start chatting with friends from your servers
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
