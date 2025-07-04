# Troubleshooting Activity Feed and Comments

## What I've Fixed

1. **Enhanced Error Handling**: Added error states and better logging to both ActivityFeed and CommentSection components
2. **Real-time Subscriptions**: Confirmed both components are using `listenClient` with proper error handling
3. **Scope Issues**: Fixed any potential scope issues with function definitions

## To Get Activities and Comments Working

### 1. Check Environment Variables

Ensure these are set in your `.env.local` file:
```
SANITY_API_TOKEN=your-sanity-write-token
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

### 2. Verify Sanity API Token Permissions

Your `SANITY_API_TOKEN` needs write permissions:
1. Go to sanity.io/manage
2. Select your project
3. Go to API → Tokens
4. Create a token with "Editor" or "Deploy Studio" permissions

### 3. Check Browser Console

Open the browser console and look for:
- "Fetched activities for vehicle: [id] [data]"
- "Fetched comments for vehicle: [id] [data]"
- Any error messages

### 4. Verify CORS Settings in Sanity

For real-time subscriptions to work:
1. Go to sanity.io/manage
2. Select your project
3. Go to API → CORS Origins
4. Add your development URL (http://localhost:3000)
5. Add your production URL when deploying

### 5. Test Manual Activity Creation

Try creating a test activity in Sanity Studio:
```javascript
{
  _type: 'activity',
  vehicle: {_ref: 'your-vehicle-id'},
  user: {_ref: 'your-user-id'},
  action: 'commented',
  details: 'Test activity',
  createdAt: new Date().toISOString()
}
```

### 6. Check Sanity Studio

1. Navigate to `/studio` in your app
2. Check if activities and comments are being created in the Content tab
3. Verify the references are correct (vehicle._ref, user._ref)

### 7. Common Issues and Solutions

**Issue**: No activities/comments showing
- **Solution**: Check if data exists in Sanity Studio
- **Solution**: Verify vehicle ID is correct in the URL

**Issue**: "Failed to load" error
- **Solution**: Check SANITY_API_TOKEN is set
- **Solution**: Verify token has proper permissions

**Issue**: Real-time updates not working
- **Solution**: Check CORS settings in Sanity
- **Solution**: Ensure you're using HTTPS in production

**Issue**: Comments not posting
- **Solution**: Check browser console for API errors
- **Solution**: Verify user session is active

### 8. Debug Mode

The components now log detailed information. Check the browser console for:
- API responses
- Real-time update events
- Error messages

### 9. Quick Test

1. Open a vehicle detail page
2. Open browser console (F12)
3. Try posting a comment
4. Check console for errors
5. Check Sanity Studio to see if the comment was created

If you see specific error messages in the console, that will help identify the exact issue.