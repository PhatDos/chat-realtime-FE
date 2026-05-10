"use client"

import Link from 'next/link'
import { useState } from 'react'
import { AxiosError } from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/hooks/use-api-client'
import { useToast } from '@/hooks/use-toast'
import { addFriend, getFriend, removeFriend } from '@/services/friends-client-service'
import type { FriendProfileResponse } from '@/types/api/member'
import GlareHover from '@/components/animation/glare-hover/GlareHover'
import { UserAvatar } from './user-avatar'

interface ProfileHoverCardProps {
  id: string
  name: string
  imageUrl?: string
  currentProfileId?: string
  className?: string
  href?: string
}

export const ProfileHoverCard = ({
  id,
  name,
  imageUrl,
  currentProfileId,
  className,
  href
}: ProfileHoverCardProps) => {
  const isSelf = id === currentProfileId
  const [open, setOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const api = useApiClient()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const friendQuery = useQuery<FriendProfileResponse, AxiosError<{ message?: string }>, FriendProfileResponse>(
    ['friend-status', id],
    async () => {
      return getFriend(api, id)
    },
    {
      enabled: open && !isSelf,
      retry: false,
    }
  )

  const isFriend = friendQuery.data?.isFriend ?? false
  const isChecking = friendQuery.isFetching && !friendQuery.data
  const avatarNode = href ? (
    <Link href={href} className='inline-block'>
      <UserAvatar src={imageUrl} className={className} />
    </Link>
  ) : (
    <UserAvatar src={imageUrl} className={className} />
  )

  const glareAvatarNode = (
    <GlareHover
      width='fit-content'
      height='fit-content'
      background='transparent'
      borderRadius='9999px'
      borderColor='transparent'
      glareColor='#ffffff'
      glareOpacity={0.3}
      glareAngle={-30}
      glareSize={300}
      transitionDuration={1500}
      playOnce={false}
    >
      {avatarNode}
    </GlareHover>
  )

  const onAddFriend = async () => {
    if (isAdding || isFriend) return

    try {
      setIsAdding(true)
      await addFriend(api, id)
      queryClient.setQueryData<FriendProfileResponse>(['friend-status', id], {
        id,
        name,
        imageUrl: imageUrl ?? '',
        isFriend: true,
      })

      toast({
        title: 'Friend added',
        description: `You are now friends with ${name}`,
        variant: 'success'
      })
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>
      toast({
        title: 'Cannot add friend',
        description:
          err.response?.data?.message ??
          'Failed to add friend. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const onRemoveFriend = async () => {
    if (isAdding || !isFriend) return

    try {
      setIsAdding(true)
      await removeFriend(api, id)
      queryClient.setQueryData<FriendProfileResponse>(['friend-status', id], {
        id,
        name,
        imageUrl: imageUrl ?? '',
        isFriend: false,
      })

      toast({
        title: 'Friend removed',
        description: `You are no longer friends with ${name}`,
        variant: 'success'
      })
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>
      toast({
        title: 'Cannot remove friend',
        description:
          err.response?.data?.message ??
          'Failed to remove friend. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  if (isSelf) {
    return href ? (
      <Link href={href} className='inline-block'>
        <UserAvatar src={imageUrl} className={className} />
      </Link>
    ) : (
      <UserAvatar src={imageUrl} className={className} />
    )
  }

  return (
    <div
      className='relative inline-block'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {glareAvatarNode}

      {open && (
        <div className='absolute z-50 right-0 mt-0 -mx-36 w-48 bg-white dark:bg-[#1f2937] shadow-lg rounded p-2 text-sm'>
          <div className='flex items-center'>
            <UserAvatar src={imageUrl} className='h-10 w-10 mr-2' />
            <div className='flex-1'>
              <div className='font-semibold text-sm text-black dark:text-white'>{name}</div>
            </div>
          </div>
          <div className='mt-2 text-right'>
            <button
              type='button'
              onClick={isFriend ? onRemoveFriend : onAddFriend}
              disabled={isAdding || isChecking}
              className={`px-3 py-1 rounded text-white text-xs disabled:opacity-60 disabled:cursor-not-allowed ${isFriend ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isChecking
                ? 'Checking...'
                : isAdding
                  ? isFriend
                    ? 'Removing...'
                    : 'Adding...'
                  : isFriend
                    ? 'Remove friend'
                    : 'Add friend'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileHoverCard
