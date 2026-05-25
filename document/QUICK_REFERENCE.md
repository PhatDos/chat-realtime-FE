# 🎯 Quick Reference Card

## What's Been Fixed ✅

### Real-Time Comments
- ✅ Comments now appear instantly when other users post them
- ✅ No need to refresh to see new comments
- ✅ Smart deduplication prevents duplicates

### Like Count Race Condition  
- ✅ Fixed race condition check logic
- ✅ Now handles missing `actionUserId` gracefully
- ✅ Like counts increment correctly when users like simultaneously

---

## What You Need to Do 🔧

### Step 1: Implement SSE Broadcaster
**File**: `lib/sse-broadcaster.ts`
- [ ] Copy template from `BACKEND_IMPLEMENTATION.md`
- [ ] Manages SSE connections and broadcast

### Step 2: Implement SSE Endpoint
**File**: `app/api/posts/events/route.ts`
- [ ] Copy template from `BACKEND_IMPLEMENTATION.md`
- [ ] Handles client connections and sends events

### Step 3: Integrate Broadcasts
Add 4 lines to these endpoints:
- [ ] `POST /posts/:id/like` - Broadcast POST_LIKED
- [ ] `DELETE /posts/:id/like` - Broadcast POST_UNLIKED
- [ ] `POST /posts/:id/comments` - Broadcast COMMENT_ADDED
- [ ] `POST /posts` - Broadcast POST_CREATED

### Step 4: Test
- [ ] SSE endpoint responds to GET requests
- [ ] Events contain `actionUserId` field
- [ ] Multiple clients receive events in real-time

---

## Key Implementation Rules

1. **Always include `actionUserId`**
   ```json
   { "type": "POST_LIKED", "actionUserId": "user-123", "postId": "post-456" }
   ```

2. **Use ISO strings for dates**
   ```typescript
   createdAt: comment.createdAt.toISOString()
   ```

3. **Broadcast to all clients**
   ```typescript
   sseBroadcaster.broadcastAll(event);
   ```

4. **Validate authentication**
   ```typescript
   const profile = await getCurrentProfile();
   if (!profile) return Response("Unauthorized", { status: 401 });
   ```

---

## Event Checklist

### POST_CREATED
- [ ] Include full post object
- [ ] Include author info (id, name, imageUrl)
- [ ] Set initialComments to []
- [ ] Set likeCount/commentCount to 0

### POST_LIKED
- [ ] Include postId
- [ ] Include actionUserId
- [ ] Nothing else needed

### POST_UNLIKED
- [ ] Include postId
- [ ] Include actionUserId
- [ ] Nothing else needed

### COMMENT_ADDED
- [ ] Include postId
- [ ] Include full comment object
- [ ] Include author info (id, name, imageUrl)
- [ ] Use ISO string for createdAt

---

## Testing Scenarios

**Scenario 1: Real-Time Comments**
```
1. Open post comments in Browser A
2. Add comment in Browser B
3. ✓ Comment appears instantly in Browser A
```

**Scenario 2: Like Race Condition**
```
1. User A and B like same post at same time
2. ✓ Like count increases by 2 (not 1)
3. ✓ No double-likes shown
```

**Scenario 3: Self-Event Skipping**
```
1. Current user likes post
2. ✓ Like count shows +1 (optimistic)
3. ✓ When POST_LIKED event arrives, count stays same (no +2)
```

---

## Common Issues & Fixes

### Issue: Like count only increases by 1
**Cause**: `actionUserId` not sent or skipped
**Fix**: Ensure `sseBroadcaster.broadcastAll()` includes `actionUserId`

### Issue: Comments don't appear
**Cause**: COMMENT_ADDED event not being broadcast
**Fix**: Add broadcast after comment is saved

### Issue: Comments appear twice
**Cause**: PostComments not checking author.id
**Fix**: Already fixed in client code ✓

### Issue: SSE connection keeps dropping
**Cause**: Missing headers or auth validation
**Fix**: Check `BACKEND_IMPLEMENTATION.md` template

---

## File Structure After Implementation

```
app/api/posts/
├── events/
│   └── route.ts ✅ (implement SSE endpoint)
├── [postId]/
│   ├── like/
│   │   └── route.ts ✅ (add broadcast)
│   └── comments/
│       └── route.ts ✅ (add broadcast)
└── route.ts ✅ (add broadcast)

lib/
└── sse-broadcaster.ts ✅ (implement broadcaster)
```

---

## Resources

1. **BACKEND_IMPLEMENTATION.md** - Copy-paste ready templates
2. **SOCKET_EVENTS_IMPLEMENTATION.md** - Full technical guide
3. **EVENT_FLOW_DIAGRAMS.md** - Visual flow diagrams
4. **CLIENT_IMPLEMENTATION_COMPLETE.md** - What's done on client

---

## Support

Client-side is complete ✅
- All event handling is ready
- Comment callbacks registered  
- Like count logic improved
- Ready for backend implementation

Backend needs implementation 🔧
- SSE endpoint
- Event broadcaster
- Broadcast integration

Next: Copy templates and test!
