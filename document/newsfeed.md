# Newsfeed UI

This document rewrites the Newsfeed feature currently implemented in this project.

## Scope

- Feed list is backed by `GET /users/:id/posts`.
- Post composer uses `POST /posts`.
- Delete action uses `DELETE /posts/:id` for the author only.
- Like, follow, and realtime updates are still client-side UI behavior unless wired to backend later.

## FE Contract (target shape)

### Feed endpoint contract (reference)

`GET /users/:id/posts?cursor={cursor}&limit={n}`

Response:

```ts
{
  items: Post[];
  nextCursor: string | null;
}
```

### Post shape used in UI

```ts
type Post = {
  id: string;
  content: string;
  fileUrl?: string;
  fileType: "text" | "img" | "pdf";
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";

  createdAt: string;
  likeCount: number;

  author: {
    id: string;
    name: string;
    imageUrl: string;
  };

  isLiked: boolean;
};
```

## Implemented Components

### 1. CreatePostBox

Location: `components/feed/create-post-box.tsx`

- User types content in a textarea.
- Press `Post` to publish with `POST /posts`.
- New post is immediately prepended to the list on success.

### 2. PostCard

Location: `components/feed/post-card.tsx`

- Render author avatar/name.
- Render text content.
- Render media based on `fileType`:
  - `img`: image block.
  - `pdf`: attachment row.
- Render like action and created time.
- Render delete action for the author only.

### 3. FeedList

Location: `components/feed/feed-list.tsx`

- Initial skeleton loading.
- Cursor pagination by `createdAt` from the backend.
- Infinite scroll with `IntersectionObserver` sentinel.
- Manual `Load more` fallback button.
- Optimistic like toggle (UI first).

### 4. NewsFeedPage

Location: `components/feed/news-feed-page.tsx`

- Composes `CreatePostBox` + `FeedList`.
- Manages latest created post and forwards it into the feed list.

### 5. Route Page

Location: `app/(main)/(routes)/newsfeed/page.tsx`

- Uses current profile to pass current user into NewsFeed page.
- Protected route behavior is preserved.

## Local Data Layer

Location: `components/feed/create-post-box.tsx`

- Local state for composing content before calling the backend.

## UX Behaviors Included

- Optimistic UI for like.
- New posts are always shown at top.
- Skeleton loading state.
- Cursor-based pagination.
- Infinite scrolling.

## DB Mapping (reference only)

- Feed -> `Post`
- Avatar -> `Profile`
- Like -> `Like` + `Post.likeCount`
- Follow feed -> `Follow`

## Current Limitation

Because this implementation still keeps some behaviors client-side, these are not connected yet:

- `POST /posts/:id/like`
- SSE endpoint
- Follow-feed endpoint

When backend integration expands further, wire likes and realtime updates to the server too.
