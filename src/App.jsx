import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '760837916843241',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  // Analyze advocacy impact of a comment
  const analyzeAdvocacyImpact = (text) => {
    const lowerText = text.toLowerCase();
    
    // Keywords for different categories
    const antiAnimalAg = ['factory farm', 'animal cruelty', 'slaughter', 'abuse', 'suffering', 'torture', 'cruel', 'inhumane', 'barbaric', 'murder'];
    const questioning = ['interesting', 'never thought', 'makes me think', 'good point', 'eye opening', 'didnt know', 'wow', 'really?', 'is this true'];
    const defensive = ['personal choice', 'stop preaching', 'mind your business', 'respect my choice', 'not your decision', 'leave me alone', 'annoying'];
    const proAnimalAg = ['farmers care', 'humane treatment', 'necessary', 'natural', 'food chain', 'protein', 'tradition', 'culture', 'livelihood'];
    const alreadyVegan = ['already vegan', 'been vegan', 'plant based', 'cruelty free', 'animal rights', 'go vegan', 'vegan for'];

    let category = 'defensive'; // Default
    let score = 0;
    let conversion_potential = 0;
    let resistance_level = 0;

    // Determine category and scores
    if (antiAnimalAg.some(keyword => lowerText.includes(keyword))) {
      category = 'anti_animal_ag';
      score = 85;
      conversion_potential = 0.9;
      resistance_level = 0.1;
    } else if (questioning.some(keyword => lowerText.includes(keyword))) {
      category = 'questioning';
      score = 70;
      conversion_potential = 0.8;
      resistance_level = 0.2;
    } else if (alreadyVegan.some(keyword => lowerText.includes(keyword))) {
      category = 'already_vegan';
      score = 95;
      conversion_potential = 0.1;
      resistance_level = 0.0;
    } else if (proAnimalAg.some(keyword => lowerText.includes(keyword))) {
      category = 'pro_animal_ag';
      score = 20;
      conversion_potential = 0.2;
      resistance_level = 0.8;
    } else {
      category = 'defensive';
      score = 30;
      conversion_potential = 0.1;
      resistance_level = 0.9;
    }

    return {
      category,
      score,
      conversion_potential,
      resistance_level,
      advocacy_impact: score > 70 ? 'high' : score > 40 ? 'medium' : 'low'
    };
  };

  // Login with Facebook
  const loginWithFacebook = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        const { accessToken, userID } = response.authResponse;
        setUser({ accessToken, userID });
        
        // Fetch available accounts after login
        fetchAvailableAccounts(accessToken)
          .then((accounts) => {
            setAvailableAccounts(accounts);
            if (accounts.length === 1) {
              setSelectedAccountId(accounts[0].id);
            }
          })
          .catch((err) => {
            console.error('Error fetching accounts:', err);
            setError('Failed to fetch Instagram accounts. Please try again.');
          });
      } else {
        setError('Facebook login failed');
      }
    }, { scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments' });
  };

  // Fetch available Instagram accounts
  const fetchAvailableAccounts = async (accessToken) => {
    try {
      // Get Facebook pages
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data) {
        throw new Error('No Facebook pages found');
      }

      const accounts = [];
      
      // For each page, check if it has an Instagram Business account
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
          const igData = await igResponse.json();
          
          if (igData.instagram_business_account) {
            // Get Instagram account details
            const igDetailsResponse = await fetch(`https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username,name&access_token=${page.access_token}`);
            const igDetails = await igDetailsResponse.json();
            
            accounts.push({
              id: igData.instagram_business_account.id,
              username: igDetails.username || 'Unknown',
              name: igDetails.name || page.name,
              pageId: page.id,
              pageAccessToken: page.access_token
            });
          }
        } catch (err) {
          console.log(`No Instagram account for page ${page.name}`);
        }
      }
      
      return accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setAvailableAccounts([]);
    setSelectedAccountId('');
    setPosts([]);
    setError('');
  };

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
      
      // Step 3: Get Instagram media - fetch more posts with pagination
      addDebugLog('Starting enhanced post fetching with pagination...');
      let allPosts = [];
      let postsNextUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=100&access_token=${user.accessToken}`;
      let pageCount = 0;
      
      // Fetch up to 1000 posts (10 pages) to find older content
      while (postsNextUrl && pageCount < 10) {
        pageCount++;
        addDebugLog(`Fetching posts page ${pageCount}...`);
        
        const mediaResponse = await fetch(postsNextUrl);
        
        if (!mediaResponse.ok) {
          throw new Error(`Instagram API error: ${mediaResponse.status} ${mediaResponse.statusText}`);
        }
        
        const mediaData = await mediaResponse.json();
        
        if (mediaData.data && mediaData.data.length > 0) {
          allPosts = allPosts.concat(mediaData.data);
          addDebugLog(`Page ${pageCount}: Found ${mediaData.data.length} posts. Total: ${allPosts.length}`);
        }
        
        // Check for next page
        postsNextUrl = mediaData.paging?.next || null;
        if (!postsNextUrl) {
          addDebugLog('No more pages of posts to fetch');
          break;
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      addDebugLog(`Total posts fetched: ${allPosts.length} across ${pageCount} pages (searched up to 1000 posts)`);
      
      if (allPosts.length === 0) {
        throw new Error('No posts found in Instagram account');
      }
      
      // Find the target post by shortcode
      let targetPost = null;
      const shortcodes = [];
      
      for (const post of allPosts) {
        if (post.permalink) {
          const postShortcode = post.permalink.match(/\/p\/([A-Za-z0-9_-]+)/);
          if (postShortcode) {
            shortcodes.push(postShortcode[1]);
            if (postShortcode[1] === shortcode) {
              targetPost = post;
              addDebugLog(`Found target post! Date: ${new Date(post.timestamp).toLocaleDateString()}, Comments: ${post.comments_count}`);
              break;
            }
          }
        }
      }
      
      if (!targetPost) {
        const recentPosts = allPosts.slice(0, 10).map(post => {
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
      
      addDebugLog(`Starting chunked fetch for post with ${targetPost.comments_count} total comments`);
      
      // Clear any existing comments for this post in Supabase
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
      let allComments = [];
      
      while (nextUrl && chunkCount < 20) {
        chunkCount++;
        setCurrentOperation(`Fetching chunk ${chunkCount}, total comments so far: ${totalCommentsFetched}`);
        const chunkProgress = 30 + (chunkCount * 3);
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
          const sentiment = analyzeAdvocacyImpact(comment.text || '');
          
          return {
            post_id: targetPost.id,
            comment_id: comment.id || `${targetPost.id}_${Date.now()}_${index}`,
            text: comment.text || '',
            username: comment.username || 'unknown',
            timestamp: comment.timestamp || new Date().toISOString(),
            advocacy_category: sentiment.category || 'defensive',
            sentiment_score: typeof sentiment.score === 'number' ? sentiment.score : 0
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
          addDebugLog('Has next page, continuing...');
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
      
      const addDebugLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logEntry);
        setDebugLogs(prev => [...prev, { message, type, timestamp }]);
      };
      
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

  // Analyze individual post
  const analyzePost = (post) => {
    if (!post.comments) return null;

    const analysis = {
      total_comments: post.comments.length,
      categories: {
        anti_animal_ag: 0,
        questioning: 0,
        defensive: 0,
        pro_animal_ag: 0,
        already_vegan: 0
      },
      impact_score: 0,
      conversion_potential: 0,
      resistance_level: 0
    };

    let totalScore = 0;
    let totalConversion = 0;
    let totalResistance = 0;

    post.comments.forEach(comment => {
      const sentiment = analyzeAdvocacyImpact(comment.text);
      analysis.categories[sentiment.category]++;
      totalScore += sentiment.score;
      totalConversion += sentiment.conversion_potential;
      totalResistance += sentiment.resistance_level;
    });

    analysis.impact_score = Math.round(totalScore / post.comments.length);
    analysis.conversion_potential = Math.round((totalConversion / post.comments.length) * 100);
    analysis.resistance_level = Math.round((totalResistance / post.comments.length) * 100);

    return analysis;
  };

  // Generate AI analysis
  const generateAIAnalysis = (post, analysis) => {
    const totalComments = analysis.total_comments;
    const impactScore = analysis.impact_score;
    const conversionPotential = analysis.conversion_potential;
    
    return `This post generated significant engagement with ${totalComments} comments, revealing important insights into audience attitudes toward animal agriculture and veganism. The content shows ${impactScore > 60 ? 'strong' : 'moderate'} advocacy impact with ${conversionPotential}% of responses indicating potential for attitude change. Notably, ${analysis.categories.anti_animal_ag} commenters expressed strong anti-animal agriculture sentiments, suggesting the content effectively reinforced existing beliefs and potentially converted fence-sitters. The ${impactScore > 70 ? 'high' : 'moderate'} emotional intensity in responses suggests the content successfully evoked strong feelings, which is crucial for memorable advocacy impact. Strategic recommendation: This content format appears ${impactScore > 60 ? 'highly' : 'moderately'} effective - ${impactScore > 60 ? 'replicate similar messaging and themes' : 'consider adjusting approach'} for maximum advocacy impact.`;
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🌱 Instagram Sentiment Analysis</h1>
        <p>AI-Powered Vegan Advocacy Analytics</p>
        {user && (
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        )}
      </header>

      <main className="main-content">
        {!user ? (
          <div className="login-section">
            <div className="login-card">
              <h2>🌱 Vegan Advocacy Impact Analysis</h2>
              <p>Measure how effectively your content influences attitudes toward animal agriculture</p>
              
              <div className="features-preview">
                <div className="feature">📊 Specialized vegan advocacy analysis</div>
                <div className="feature">🎯 Measure conversion potential</div>
                <div className="feature">📈 Track advocacy effectiveness</div>
                <div className="feature">🔍 Intelligent content filtering</div>
              </div>
              
              <button onClick={loginWithFacebook} className="facebook-login-btn">
                📘 Login with Facebook
              </button>
              
              <p className="note">
                Note: You need an Instagram Business or Creator account connected to a Facebook page.
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome! 👋</h2>
              <p>Connected to Instagram via Facebook</p>
            </div>

            {availableAccounts.length > 0 && (
              <div className="account-selector">
                <label htmlFor="account-select">Select Instagram Account:</label>
                <select 
                  id="account-select"
                  value={selectedAccountId} 
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="account-dropdown"
                >
                  <option value="">Choose an account...</option>
                  {availableAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      @{account.username} ({account.name})
                    </option>
                  ))}
                </select>
                {selectedAccountId && (
                  <p className="selected-account">📸 Using: @{availableAccounts.find(a => a.id === selectedAccountId)?.username}</p>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="post-analysis-section">
              <h3>📱 Individual Post Analysis</h3>
              
              <div className="url-input-section">
                <input
                  type="text"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="Paste Instagram post URL here..."
                  className="url-input"
                />
                <button 
                  onClick={loadInstagramPostFromUrl} 
                  disabled={loading || !selectedAccountId}
                  className="analyze-btn"
                >
                  {analyzing ? `Analyzing... ${progress}%` : 'Analyze Post'}
                </button>
              </div>

              {(loading || analyzing) && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{currentOperation}</p>
                </div>
              )}

              {debugLogs.length > 0 && (
                <div className="debug-section">
                  <h4>🔍 Debug Logs</h4>
                  <div className="debug-logs">
                    {debugLogs.map((log, index) => (
                      <div key={index} className={`debug-log ${log.type}`}>
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div className="results-section">
                  <h3>📊 Analysis Results</h3>
                  {posts.map((post, index) => {
                    const analysis = analyzePost(post);
                    const aiAnalysis = generateAIAnalysis(post, analysis);
                    
                    return (
                      <div key={index} className="post-result">
                        <div className="post-info">
                          <p className="post-caption">{post.caption}</p>
                          <p className="post-stats">❤️ {post.like_count} 💬 {post.comments_count}</p>
                        </div>

                        <div className="ai-analysis">
                          <h4>🧠 AI Analysis</h4>
                          <p>{aiAnalysis}</p>
                        </div>

                        <div className="metrics">
                          <div className="metric">
                            <span className="metric-label">Impact Score:</span>
                            <span className="metric-value">{analysis.impact_score}%</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Conversion:</span>
                            <span className="metric-value">{analysis.conversion_potential}%</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Resistance:</span>
                            <span className="metric-value">{analysis.resistance_level}%</span>
                          </div>
                        </div>

                        <div className="categories">
                          <h4>Response Categories:</h4>
                          <div className="category-list">
                            <div className="category anti-animal-ag">anti animal-ag: {analysis.categories.anti_animal_ag}</div>
                            <div className="category questioning">questioning: {analysis.categories.questioning}</div>
                            <div className="category defensive">defensive: {analysis.categories.defensive}</div>
                            <div className="category pro-animal-ag">pro animal-ag: {analysis.categories.pro_animal_ag}</div>
                            <div className="category already-vegan">already vegan: {analysis.categories.already_vegan}</div>
                          </div>
                        </div>

                        <div className="comments-analysis">
                          <h4>Comment Analysis:</h4>
                          <div className="comments-list">
                            {post.comments.slice(0, 10).map((comment, idx) => {
                              const sentiment = analyzeAdvocacyImpact(comment.text);
                              return (
                                <div key={idx} className="comment-item">
                                  <p className="comment-text">"{comment.text}"</p>
                                  <p className="comment-analysis">
                                    <span className={`category ${sentiment.category}`}>{sentiment.category}</span>
                                    <span className="impact">Impact: {sentiment.advocacy_impact}</span>
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
