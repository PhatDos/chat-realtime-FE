import { useEffect } from 'react'
import { useSocket } from '@/components/providers/socket-provider'

export const useChannelRoom = (channelId: string) => {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket || !channelId) return

    const joinRoom = () => {
      socket.emit('channel:join', { channelId })
    }

    joinRoom()
    socket.on('connect', joinRoom)

    return () => {
      socket.off('connect', joinRoom)
      socket.emit('channel:leave', { channelId })
    }
  }, [socket, channelId])
}