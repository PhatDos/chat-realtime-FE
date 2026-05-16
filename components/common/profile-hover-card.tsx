"use client"

import Link from 'next/link'
import { useState } from 'react'
import { AxiosError } from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/hooks/use-api-client'
import { useToast } from '@/hooks/use-toast'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendshipInfo,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
} from '@/services/friends-client-service'
import type { FriendshipInfoDto } from '@/types/api/friendship'
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

  const friendQuery = useQuery<FriendshipInfoDto, AxiosError<{ message?: string }>, FriendshipInfoDto>(
    ['friend-status', id],
    async () => {
      return getFriendshipInfo(api, id)
    },
    {
      enabled: open && !isSelf,
      retry: false,
    }
  )

  const isFriend = friendQuery.data?.isFriend ?? false
  const pendingRequest = friendQuery.data?.pendingRequest ?? null
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
    if (isAdding || isFriend || pendingRequest) return

    try {
      setIsAdding(true)
      const createdRequest = await sendFriendRequest(api, id)

      queryClient.setQueryData<FriendshipInfoDto>(['friend-status', id], (current) => ({
        ...(current ?? {
          id,
          name,
          imageUrl: imageUrl ?? '',
          isFriend: false,
        }),
        isFriend: false,
        pendingRequest: {
          id: createdRequest.id,
          direction: 'sent',
        },
      }))

      toast({
        title: 'Friend request sent',
        description: `Your friend request has been sent to ${name}`,
        variant: 'success'
      })
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>
      toast({
        title: 'Cannot add friend',
        description:
          err.response?.data?.message ??
          'Failed to send friend request. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const onCancelRequest = async () => {
    if (isAdding || !pendingRequest) return

    try {
      setIsAdding(true)
      await cancelFriendRequest(api, pendingRequest.id)

      queryClient.setQueryData<FriendshipInfoDto>(['friend-status', id], (current) => ({
        ...(current ?? {
          id,
          name,
          imageUrl: imageUrl ?? '',
          isFriend: false,
        }),
        isFriend: false,
        pendingRequest: null,
      }))

      toast({
        title: 'Request canceled',
        description: `Your friend request to ${name} was canceled`,
        variant: 'success'
      })
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>
      toast({
        title: 'Cannot cancel request',
        description:
          err.response?.data?.message ??
          'Failed to cancel friend request. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const onAcceptRequest = async () => {
    if (isAdding || !pendingRequest || pendingRequest.direction !== 'received') return

    try {
      setIsAdding(true)
      await acceptFriendRequest(api, pendingRequest.id)

      queryClient.setQueryData<FriendshipInfoDto>(['friend-status', id], (current) => ({
        ...(current ?? {
          id,
          name,
          imageUrl: imageUrl ?? '',
          isFriend: false,
        }),
        isFriend: true,
        pendingRequest: null,
      }))

      toast({
        title: 'Friend request accepted',
        description: `You are now friends with ${name}`,
        variant: 'success'
      })
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>
      toast({
        title: 'Cannot accept request',
        description:
          err.response?.data?.message ??
          'Failed to accept friend request. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const onRejectRequest = async () => {
    if (isAdding || !pendingRequest || pendingRequest.direction !== 'received') return

    try {
      setIsAdding(true)
      await rejectFriendRequest(api, pendingRequest.id)

      queryClient.setQueryData<FriendshipInfoDto>(['friend-status', id], (current) => ({
        ...(current ?? {
          id,
          name,
          imageUrl: imageUrl ?? '',
          isFriend: false,
        }),
        isFriend: false,
        pendingRequest: null,
      }))

      toast({
        title: 'Friend request rejected',
        description: `You rejected ${name}'s request`,
        variant: 'success'
      })
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>
      toast({
        title: 'Cannot reject request',
        description:
          err.response?.data?.message ??
          'Failed to reject friend request. Please try again.',
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
      await unfriend(api, id)
      queryClient.setQueryData<FriendshipInfoDto>(['friend-status', id], {
        ...(friendQuery.data ?? {
          id,
          name,
          imageUrl: imageUrl ?? '',
        }),
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
            {pendingRequest?.direction === 'received' ? (
              <div className='flex justify-end gap-2'>
                <button
                  type='button'
                  onClick={onAcceptRequest}
                  disabled={isAdding || isChecking}
                  className='px-3 py-1 rounded text-white text-xs bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  Accept
                </button>
                <button
                  type='button'
                  onClick={onRejectRequest}
                  disabled={isAdding || isChecking}
                  className='px-3 py-1 rounded text-white text-xs bg-zinc-600 hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  Reject
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={isFriend ? onRemoveFriend : pendingRequest ? onCancelRequest : onAddFriend}
                disabled={isAdding || isChecking}
                className={`px-3 py-1 rounded text-white text-xs disabled:opacity-60 disabled:cursor-not-allowed ${isFriend ? 'bg-red-600 hover:bg-red-700' : pendingRequest ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isChecking
                  ? 'Checking...'
                  : isAdding
                    ? isFriend
                      ? 'Removing...'
                      : pendingRequest
                        ? 'Canceling...'
                        : 'Sending...'
                    : isFriend
                      ? 'Remove friend'
                      : pendingRequest
                        ? 'Cancel request'
                        : 'Add friend'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileHoverCard
