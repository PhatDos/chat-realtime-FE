import { ChatHeader } from '@/components/chat/chat-header'
import { DirectChatInput } from '@/components/chat/direct-chat/direct-chat-input'
import { DirectChatMessages } from '@/components/chat/direct-chat/direct-chat-messages'
import { MediaRoom } from '@/components/ui/media-room'
import {
  getConversationsList,
  getOrCreateConversation
} from '@/services/conversation-service'
import { currentProfile } from '@/services/current-profile'
import { redirect } from 'next/navigation'

interface ProfileIdPageProps {
  params: Promise<{ profileId: string }>
  searchParams?: Promise<{ video?: string }>
}

const ProfileIdPage = async ({ params, searchParams }: ProfileIdPageProps) => {
  const profile = await currentProfile()
  const { profileId } = await params
  const searchParamsData = await searchParams
  const video = searchParamsData?.video

  if (!profile) return redirect('/sign-in')

  const data = await getOrCreateConversation(profileId)
  if (!data) return redirect(`/conversations`)

  const { conversation, otherProfile } = data

  // Lấy danh sách conversations cho mobile toggle
  const conversations = await getConversationsList()

  return (
    <div className='bg-white dark:bg-[#313338] flex flex-col h-full'>
      <ChatHeader
        imageUrl={otherProfile.imageUrl}
        name={otherProfile.name}
        otherProfileId={otherProfile.id}
        type='conversation'
        conversations={conversations}
        currentProfileId={profile.id}
      />
      {video ? (
        <MediaRoom chatId={conversation.id} video audio />
      ) : (
        <>
          <DirectChatMessages
            profile={profile}
            name={otherProfile.name}
            chatId={conversation.id}
            apiUrl='/api/direct-messages'
            socketQuery={{
              conversationId: conversation.id,
              memberId: profile.id
            }}
          />
          <DirectChatInput
            name={otherProfile.name}
            apiUrl={process.env.NEXT_PUBLIC_SITE_URL!}
            query={{
              conversationId: conversation.id,
              memberId: profile.id
            }}
            profile={profile}
          />
        </>
      )}
    </div>
  )
}

export default ProfileIdPage
