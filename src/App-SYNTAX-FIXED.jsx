// This is a clean version of the App.jsx with proper try-catch structure
// Copy the content from the original App.jsx and replace the problematic function

// Load individual post from URL
const loadInstagramPostFromUrl = async () => {
  try {
    if (!postUrl.trim()) {
      setError('Please enter an Instagram post URL');
      return;
    }

    if (!user || !user.accessToken) {
      setError('Please login with Facebook first');
      return;
    }

    if (!selectedAccountId) {
      setError('Please select an Instagram account first');
      return;
    }

    // Clear previous state
    setLoading(true);
    setAnalyzing(true);
    setError('');
    setPosts([]);
    setDebugLogs([]);
    setCurrentOperation('Starting analysis...');
    setProgress(0);

    const addDebugLog = (message, type = 'info') => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
      console.log(logEntry);
      setDebugLogs(prev => [...prev, { message, type, timestamp }]);
    };

    // Step 1: Extract shortcode from URL
    setCurrentOperation('Parsing Instagram URL...');
    setProgress(5);
    addDebugLog(`Analyzing URL: ${postUrl}`);
    
    const postIdMatch = postUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
    if (!postIdMatch) {
      throw new Error('Invalid Instagram URL format. Please use a URL like: https://www.instagram.com/p/POST_ID/');
    }
    
    const shortcode = postIdMatch[1];
    addDebugLog(`Extracted shortcode: ${shortcode}`);
    
    // Step 2: Use the selected Instagram account
    setCurrentOperation('Using selected Instagram account...');
    setProgress(10);
    const instagramAccountId = selectedAccountId;
    addDebugLog(`Using selected Instagram account ID: ${instagramAccountId}`);
    
    // Step 3: Get Instagram media - fetch more posts to increase chances of finding the target
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=100&access_token=${user.accessToken}`);
    
    if (!mediaResponse.ok) {
      throw new Error(`Instagram API error: ${mediaResponse.status} ${mediaResponse.statusText}`);
    }
    
    const mediaData = await mediaResponse.json();
    addDebugLog(`Found ${mediaData.data?.length || 0} posts in Instagram account`);
    
    if (!mediaData.data || mediaData.data.length === 0) {
      throw new Error('No posts found in Instagram account');
    }
    
    // Find the target post by shortcode
    let targetPost = null;
    const shortcodes = [];
    
    for (const post of mediaData.data) {
      if (post.permalink) {
        const postShortcode = post.permalink.match(/\/p\/([A-Za-z0-9_-]+)/);
        if (postShortcode) {
          shortcodes.push(postShortcode[1]);
          if (postShortcode[1] === shortcode) {
            targetPost = post;
            break;
          }
        }
      }
    }
    
    if (!targetPost) {
      const recentPosts = mediaData.data.slice(0, 5).map(post => {
        const postDate = new Date(post.timestamp).toLocaleDateString();
        const caption = post.caption ? post.caption.substring(0, 50) + '...' : 'No caption';
        return `• ${postDate}: "${caption}" (${post.comments_count || 0} comments)`;
      }).join('\n');
      
      throw new Error(`Post not found. Looking for shortcode "${shortcode}" but found: ${shortcodes.join(', ')}.

Recent posts from your account:
${recentPosts}

Try using a more recent post URL, or contact support if this is a recent post.`);
    }

    // Step 4: Fetch all comments using chunked approach
    setCurrentOperation('Fetching comments in chunks...');
    setProgress(30);
    
    let allComments = []; // Declare outside try block to fix scope issue
    
    addDebugLog(`Starting chunked fetch for post with ${targetPost.comments_count} total comments`);
    
    // First, clear any existing comments for this post in Supabase
    const { error: deleteError } = await supabase
      .from('advocacy_comments')
      .delete()
      .eq('post_id', targetPost.id);
    
    if (deleteError) {
      addDebugLog(`Warning: Could not clear existing comments: ${deleteError.message}`, 'warn');
    }
    
    let nextUrl = `https://graph.facebook.com/v18.0/${targetPost.id}/comments?fields=id,text,username,timestamp&limit=50&access_token=${user.accessToken}`;
    let chunkCount = 0;
    let totalCommentsFetched = 0;
    
    while (nextUrl && chunkCount < 20) { // Limit to 20 chunks (1000 comments max)
      chunkCount++;
      setCurrentOperation(`Fetching chunk ${chunkCount}, total comments so far: ${totalCommentsFetched}`);
      const chunkProgress = 30 + (chunkCount * 3); // Progress from 30% to 90%
      setProgress(Math.min(chunkProgress, 85));
      
      addDebugLog(`Fetching chunk ${chunkCount}, total comments so far: ${totalCommentsFetched}`);
      
      const commentsResponse = await fetch(nextUrl);
      
      if (!commentsResponse.ok) {
        throw new Error(`Comments API error: ${commentsResponse.status} ${commentsResponse.statusText}`);
      }
      
      addDebugLog('Comments API response OK, parsing JSON...');
      const commentsData = await commentsResponse.json();
      
      if (!commentsData.data || commentsData.data.length === 0) {
        addDebugLog('No comments in this chunk, stopping');
        break;
      }
      
      const chunkComments = commentsData.data;
      addDebugLog(`Chunk ${chunkCount}: Received ${chunkComments.length} comments`);
      
      // Store this chunk in Supabase immediately
      setCurrentOperation(`Storing chunk ${chunkCount} in database...`);
      
      const commentsToStore = chunkComments.map((comment, index) => {
        // Quick sentiment analysis for database storage
        const sentiment = analyzeAdvocacyImpact(comment.text || '');
        
        // Ensure all values are valid and not null
        const validCategory = sentiment.category || 'defensive';
        const validScore = typeof sentiment.score === 'number' ? sentiment.score : 0;
        
        return {
          post_id: targetPost.id,
          comment_id: comment.id || `${targetPost.id}_${Date.now()}_${index}`,
          text: comment.text || '',
          username: comment.username || 'unknown',
          timestamp: comment.timestamp || new Date().toISOString(),
          advocacy_category: validCategory,
          sentiment_score: validScore
        };
      });
      
      const { error: insertError } = await supabase
        .from('advocacy_comments')
        .insert(commentsToStore);
      
      if (insertError) {
        throw new Error(`Failed to store comments in database: ${insertError.message}`);
      }
      
      totalCommentsFetched += chunkComments.length;
      addDebugLog(`Chunk ${chunkCount}: Stored ${chunkComments.length} comments. Total: ${totalCommentsFetched}`);
      
      // Check for next page
      nextUrl = commentsData.paging?.next || null;
      if (nextUrl) {
        addDebugLog('Has next page, continuing... (chunk ' + chunkCount + ' complete)');
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        addDebugLog('No more pages to fetch');
      }
    }
    
    addDebugLog(`Successfully fetched and stored ${totalCommentsFetched} total comments in ${chunkCount} chunks`);
    
    // Retrieve all comments from database for analysis
    const { data: storedComments, error: retrieveError } = await supabase
      .from('advocacy_comments')
      .select('*')
      .eq('post_id', targetPost.id)
      .order('timestamp', { ascending: true });
    
    if (retrieveError) {
      throw new Error(`Failed to retrieve comments from database: ${retrieveError.message}`);
    }
    
    addDebugLog(`Retrieved ${storedComments?.length || 0} comments from database for analysis`);
    
    // Convert Supabase format back to Instagram format for analysis
    allComments = (storedComments || []).map(comment => ({
      text: comment.text,
      username: comment.username,
      timestamp: comment.timestamp,
      id: comment.comment_id
    }));
    
    // Step 5: Create post object and complete analysis
    setProgress(90);
    
    const post = {
      id: targetPost.id,
      caption: targetPost.caption || '',
      media_type: targetPost.media_type,
      like_count: targetPost.like_count || 0,
      comments_count: targetPost.comments_count || 0,
      timestamp: targetPost.timestamp,
      url: postUrl,
      comments: allComments
    };
    
    console.log(`Created post object with ${allComments.length} comments`);
    
    setPosts([post]);
    setProgress(100);
    setLoading(false);
    setAnalyzing(false);
    
  } catch (err) {
    const errorMessage = `Failed to load post: ${err.message}`;
    addDebugLog(`FATAL ERROR: ${err.message}`, 'error');
    addDebugLog(`Error stack: ${err.stack}`, 'error');
    console.error('Error in loadInstagramPostFromUrl:', err);
    
    setError(errorMessage);
    setCurrentOperation('Error occurred');
    setLoading(false);
    setAnalyzing(false);
    setProgress(0);
  }
};
