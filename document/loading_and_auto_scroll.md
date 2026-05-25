# Vibe Code Notes

## Goal

Make channel switching feel instant and stable:

- loading appears immediately on click
- old messages do not flash during route transition
- new channel auto-scrolls to the latest message
- the same pattern can be reused for DM/chat navigation later

## Final Flow

### 1. Click channel

- `ServerChannel` calls `startSwitchingChannel(channel.id)` before `router.push(...)`.
- The loading state is global, so it survives route change.
- The loading state is tied to the target `channel.id`, not just a boolean.

### 2. Render loading during switch

- `ChannelChatMessages` reads `isSwitchingChannel` from Zustand.
- It also reads `switchingChannelId` and only clears loading for the matching channel.
- Loading UI wins over chat content while the new channel is resolving.

### 3. Clear loading after data is ready

- Clear loading only when `status === 'success' || status === 'error'`.
- Keep a minimum `150ms` delay before clearing.
- This avoids a one-frame flash and makes the transition feel smoother.

### 4. Auto-scroll after mount

- `useChatScroll` now uses `useLayoutEffect`.
- It takes `scrollKey` so channel switches trigger a fresh scroll even if cached data exists.
- It also takes `enabled` so scroll waits until the chat container is mounted and loading is done.
- This restored the old behavior where the latest message is shown after switching.

## Files And Roles

- [hooks/use-channel-switch-store.ts](hooks/use-channel-switch-store.ts): global switch state for loading.
- [components/server/server-channel.tsx](components/server/server-channel.tsx): sets switch state immediately on click.
- [components/chat/channel-chat/channel-chat-messages.tsx](components/chat/channel-chat/channel-chat-messages.tsx): shows loading, clears it on success/error, keeps chat render stable.
- [hooks/use-chat-scroll.ts](hooks/use-chat-scroll.ts): scrolls to bottom after the chat view is mounted and ready.
- [components/chat/direct-chat/direct-chat-messages.tsx](components/chat/direct-chat/direct-chat-messages.tsx): uses the same scroll hook behavior.

## Issues We Hit

- Local loading state was too late because the component got unmounted on route change.
- React Query could reuse cached data, so loading had to be independent from `status` alone.
- The previous channel could flash back if loading was cleared before the new route finished resolving.
- Auto-scroll failed on channel switch because the scroll effect fired before the new DOM was mounted.