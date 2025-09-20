import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase, dbHelpers } from './supabaseClient';

const FACEBOOK_APP_ID = '760837916843241';

function App() {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [totalComments, setTotalComments] = useState(0);

  // Enhanced sentiment analysis function
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', confidence: 0, score: 50 };
    
    const lowerText = text.toLowerCase();
    
    // Comprehensive negative keywords for factory farming/animal rights content
    const negativeKeywords = [
      'killing', 'slaughter', 'abuse', 'cruelty', 'suffering', 'torture', 'pain',
      'factory farm', 'cage', 'confined', 'brutal', 'horrific', 'disgusting',
      'terrible', 'awful', 'sick', 'wrong', 'evil', 'heartbreaking', 'sad',
      'nightmare', 'hell', 'violence', 'murder', 'death', 'blood', 'cruel',
      'inhumane', 'barbaric', 'shocking', 'appalling', 'outrageous'
    ];
    
    const positiveKeywords = [
      'amazing', 'great', 'love', 'excellent', 'wonderful', 'fantastic',
      'awesome', 'good', 'best', 'perfect', 'beautiful', 'incredible',
      'outstanding', 'brilliant', 'superb', 'magnificent', 'thank you',
      'grateful', 'appreciate', 'support', 'help', 'save', 'rescue',
      'compassion', 'kindness', 'hope', 'better', 'improvement'
    ];
    
    const neutralKeywords = [
      'information', 'data', 'facts', 'study', 'research', 'report',
      'article', 'news', 'update', 'announcement', 'statement'
    ];
    
    let score = 50; // Start neutral
    let negativeCount = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    
    // Count keyword matches with weighted scoring
    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        negativeCount++;
        score -= 15; // Heavy negative weight
      }
    });
    
    positiveKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        positiveCount++;
        score += 10; // Positive weight
      }
    });
    
    neutralKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        neutralCount++;
        score += 2; // Slight positive for informational content
      }
    });
    
    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));
    
    // Determine sentiment based on score
    let sentiment = 'neutral';
    let confidence = 50;
    
    if (score < 35) {
      sentiment = 'negative';
      confidence = Math.min(95, 60 + (35 - score) * 2);
    } else if (score > 65) {
      sentiment = 'positive';
      confidence = Math.min(95, 60 + (score - 65) * 2);
    } else {
      sentiment = 'neutral';
      confidence = Math.max(50, 70 - Math.abs(score - 50));
    }
    
    return { sentiment, confidence: Math.round(confidence), score: Math.round(score) };
  };

  const extractKeywords = (text) => {
    if (!text) return [];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'would', 'there'].includes(word));
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  useEffect(() => {
    // Load saved session data
    const savedUser = localStorage.getItem('instagram_sentiment_user');
    const savedPages = localStorage.getItem('instagram_sentiment_pages');
    const savedSelectedPage = localStorage.getItem('instagram_sentiment_selected_page');
    
    if (savedUser && savedPages && savedSelectedPage) {
      const user = JSON.parse(savedUser);
      const pages = JSON.parse(savedPages);
      const selectedPage = JSON.parse(savedSelectedPage);
      
      setUser(user);
      setPages(pages);
      setSelectedPage(selectedPage);
      
      // Fetch posts for the selected page
      if (selectedPage.access_token && selectedPage.instagram_business_account) {
        fetchInstagramPosts(selectedPage.access_token, selectedPage.instagram_business_account.id);
      }
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load Facebook SDK
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const loginWithFacebook = () => {
    window.FB.login(function(response) {
      if (response.authResponse) {
        fetchUserInfo();
      }
    }, {
      scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,business_management'
    });
  };

  const fetchUserInfo = () => {
    window.FB.api('/me', { fields: 'name,email' }, function(response) {
      setUser(response);
      localStorage.setItem('instagram_sentiment_user', JSON.stringify(response));
      fetchPages();
    });
  };

  const fetchPages = () => {
    window.FB.api('/me/accounts', { fields: 'name,access_token,instagram_business_account' }, function(response) {
      const pagesWithInstagram = response.data.filter(page => page.instagram_business_account);
      setPages(pagesWithInstagram);
      localStorage.setItem('instagram_sentiment_pages', JSON.stringify(pagesWithInstagram));
      
      if (pagesWithInstagram.length > 0) {
        const firstPage = pagesWithInstagram[0];
        setSelectedPage(firstPage);
        localStorage.setItem('instagram_sentiment_selected_page', JSON.stringify(firstPage));
        fetchInstagramPosts(firstPage.access_token, firstPage.instagram_business_account.id);
      }
    });
  };

  const fetchInstagramPosts = async (accessToken, instagramAccountId) => {
    setLoading(true);
    try {
      // Fetch more posts with pagination
      let allPosts = [];
      let nextUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&access_token=${accessToken}&limit=100`;
      
      // Fetch multiple pages of posts
      for (let i = 0; i < 3; i++) { // Fetch up to 3 pages (300 posts max)
        const response = await fetch(nextUrl);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          allPosts = [...allPosts, ...data.data];
          
          if (data.paging && data.paging.next) {
            nextUrl = data.paging.next;
          } else {
            break; // No more pages
          }
        } else {
          break;
        }
      }
      
      if (allPosts.length > 0) {
        const postsWithAnalysis = allPosts.map(post => {
          const analysis = analyzeSentiment(post.caption || '');
          return {
            ...post,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            sentimentScore: analysis.score,
            keywords: extractKeywords(post.caption || '')
          };
        });
        
        setPosts(postsWithAnalysis);
        
        // Save posts to database
        await dbHelpers.savePosts(postsWithAnalysis, user?.id || selectedPage?.instagram_business_account?.id || 'live_user');
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId) => {
    if (loadingComments[postId] || comments[postId]) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    
    try {
      console.log('Fetching ALL real Instagram comments for post:', postId);
      
      if (!selectedPage || !selectedPage.access_token) {
        throw new Error('No access token available');
      }
      
      let allComments = [];
      let nextUrl = `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp,from&access_token=${selectedPage.access_token}&limit=100`;
      
      // Fetch ALL comments with pagination
      while (nextUrl) {
        console.log('Fetching comments from:', nextUrl);
        const response = await fetch(nextUrl);
        const data = await response.json();
        
        if (data.error) {
          console.error('Instagram API Error:', data.error);
          throw new Error(`Instagram API Error: ${data.error.message}`);
        }
        
        if (data.data && data.data.length > 0) {
          allComments = [...allComments, ...data.data];
          console.log(`Fetched ${data.data.length} comments, total so far: ${allComments.length}`);
          
          // Check for next page
          if (data.paging && data.paging.next) {
            nextUrl = data.paging.next;
          } else {
            nextUrl = null; // No more pages
          }
        } else {
          nextUrl = null; // No more data
        }
      }
      
      console.log(`Total comments fetched: ${allComments.length}`);
      
      if (allComments.length === 0) {
        console.log('No comments found for this post');
        setComments(prev => ({ ...prev, [postId]: [] }));
        return;
      }
      
      // Analyze sentiment for each real comment
      const commentsWithAnalysis = allComments.map(comment => {
        const analysis = analyzeSentiment(comment.text);
        return {
          ...comment,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          keywords: extractKeywords(comment.text),
          username: comment.from?.username || comment.username || 'Unknown User'
        };
      });
      
      setComments(prev => ({ ...prev, [postId]: commentsWithAnalysis }));
      
      // Update total comments count
      setTotalComments(prev => prev + commentsWithAnalysis.length);
      
      // Save real comments to database
      console.log('Saving real comments to database:', {
        userId: user?.id || selectedPage?.instagram_business_account?.id || 'live_user',
        postId: postId,
        commentCount: commentsWithAnalysis.length
      });
      
      await dbHelpers.saveComments(commentsWithAnalysis, postId, user?.id || selectedPage?.instagram_business_account?.id || 'live_user');
      console.log('Real comments saved successfully:', commentsWithAnalysis.length, 'records');
      
    } catch (error) {
      console.error('Error loading real comments:', error);
      // Don't fall back to demo data - show error instead
      alert(`Error loading comments: ${error.message}. Please check your Instagram API permissions.`);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const logout = () => {
    setUser(null);
    setPages([]);
    setSelectedPage(null);
    setPosts([]);
    setComments({});
    setTotalComments(0);
    localStorage.removeItem('instagram_sentiment_user');
    localStorage.removeItem('instagram_sentiment_pages');
    localStorage.removeItem('instagram_sentiment_selected_page');
    window.FB.logout();
  };

  const calculateMetrics = () => {
    const totalPosts = posts.length;
    const positivePosts = posts.filter(post => post.sentiment === 'positive').length;
    const negativePosts = posts.filter(post => post.sentiment === 'negative').length;
    const neutralPosts = posts.filter(post => post.sentiment === 'neutral').length;
    const avgSentiment = posts.length > 0 
      ? Math.round(posts.reduce((sum, post) => sum + post.sentimentScore, 0) / posts.length)
      : 0;

    return { totalPosts, positivePosts, negativePosts, neutralPosts, avgSentiment };
  };

  const metrics = calculateMetrics();

  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <h1>Connect Your Instagram Business Account</h1>
            <button onClick={loginWithFacebook} className="facebook-login-btn">
              🔗 Login with Facebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Instagram Sentiment Analysis</h1>
        <p>Analyze the sentiment of your Instagram posts and comments with AI-powered insights</p>
        
        <div className="user-info">
          <span>🔴 Live Mode - Connected to {selectedPage?.name || 'Instagram Account'}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'single-post' ? 'active' : ''}`}
          onClick={() => setActiveTab('single-post')}
        >
          🔍 Single Post
        </button>
        <button 
          className={`tab-btn ${activeTab === 'business-intelligence' ? 'active' : ''}`}
          onClick={() => setActiveTab('business-intelligence')}
        >
          💼 Business Intelligence
        </button>
      </nav>

      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-number">{metrics.totalPosts}</div>
              <div className="metric-label">TOTAL POSTS</div>
            </div>
            <div className="metric-card positive">
              <div className="metric-number">{metrics.positivePosts}</div>
              <div className="metric-label">POSITIVE POSTS</div>
            </div>
            <div className="metric-card negative">
              <div className="metric-number">{metrics.negativePosts}</div>
              <div className="metric-label">NEGATIVE POSTS</div>
            </div>
            <div className="metric-card neutral">
              <div className="metric-number">{metrics.neutralPosts}</div>
              <div className="metric-label">NEUTRAL POSTS</div>
            </div>
            <div className="metric-card">
              <div className="metric-number">{metrics.avgSentiment}%</div>
              <div className="metric-label">AVG SENTIMENT</div>
            </div>
            <div className="metric-card">
              <div className="metric-number">{totalComments}</div>
              <div className="metric-label">TOTAL COMMENTS</div>
            </div>
          </div>

          <div className="posts-section">
            <h2>Post Analysis</h2>
            {loading ? (
              <div className="loading">Loading Instagram posts...</div>
            ) : (
              <div className="posts-grid">
                {posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <span className="post-date">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                      <div className="post-stats">
                        ❤️ {post.like_count} likes • 💬 {post.comments_count} comments
                      </div>
                    </div>
                    
                    {post.media_url && (
                      <div className="post-image">
                        <img 
                          src={post.media_url} 
                          alt="Instagram post"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="post-content">
                      <p>{post.caption}</p>
                    </div>
                    
                    <div className="post-analysis">
                      <div className={`sentiment-badge ${post.sentiment}`}>
                        {post.sentiment === 'positive' ? '😊' : post.sentiment === 'negative' ? '😞' : '😐'} 
                        {post.sentiment} ({post.confidence}% confidence)
                      </div>
                      
                      <button 
                        onClick={() => loadComments(post.id)}
                        className="analyze-btn"
                        disabled={loadingComments[post.id]}
                      >
                        {loadingComments[post.id] ? '⏳ Loading...' : '💬 Analyze Comments'}
                      </button>
                    </div>

                    {comments[post.id] && (
                      <div className="comments-section">
                        <h4>Comments Analysis ({comments[post.id].length} comments)</h4>
                        <div className="comments-list">
                          {comments[post.id].map(comment => (
                            <div key={comment.id} className="comment-card">
                              <div className="comment-header">
                                <span className="comment-username">{comment.username}</span>
                                <span className={`comment-sentiment ${comment.sentiment}`}>
                                  {comment.sentiment}
                                </span>
                              </div>
                              <p className="comment-text">{comment.text}</p>
                              <div className="comment-meta">
                                <span>Keywords: {comment.keywords.join(', ')}</span>
                                <span>❤️ {comment.like_count} likes</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="post-footer">
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="view-post-btn">
                        View on Instagram
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'single-post' && (
        <div className="single-post-tab">
          <h2>Single Post Analysis</h2>
          <p>Select a post above to analyze individual post performance and comments.</p>
        </div>
      )}

      {activeTab === 'business-intelligence' && (
        <div className="business-intelligence-tab">
          <h2>Business Intelligence</h2>
          <div className="bi-metrics">
            <div className="bi-card">
              <h3>Engagement Insights</h3>
              <p>Average likes per post: {posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + (post.like_count || 0), 0) / posts.length) : 0}</p>
              <p>Average comments per post: {posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + (post.comments_count || 0), 0) / posts.length) : 0}</p>
            </div>
            <div className="bi-card">
              <h3>Sentiment Trends</h3>
              <p>Positive sentiment ratio: {posts.length > 0 ? Math.round((metrics.positivePosts / posts.length) * 100) : 0}%</p>
              <p>Negative sentiment ratio: {posts.length > 0 ? Math.round((metrics.negativePosts / posts.length) * 100) : 0}%</p>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Powered by Open Paws AI</p>
      </footer>
    </div>
  );
}

export default App;
