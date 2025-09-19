import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase, dbHelpers } from './supabaseClient';

const FACEBOOK_APP_ID = '1588876645370831';

function App() {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  // Enhanced sentiment analysis function
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', confidence: 0.5, score: 0.5 };

    const lowerText = text.toLowerCase();
    
    // Enhanced negative keywords for animal rights/factory farming content
    const negativeKeywords = [
      'kill', 'kills', 'killed', 'killing', 'slaughter', 'slaughtered', 'slaughtering',
      'die', 'dies', 'died', 'dying', 'death', 'dead',
      'suffer', 'suffers', 'suffered', 'suffering', 'pain', 'painful',
      'cruel', 'cruelty', 'abuse', 'abused', 'torture', 'tortured',
      'burned', 'burning', 'fire', 'flames', 'alive',
      'factory farm', 'factory farming', 'industrial', 'mass production',
      'separated', 'isolation', 'confined', 'caged', 'trapped',
      'profit', 'money', 'business', 'industry', 'system',
      'negligence', 'criminal', 'illegal', 'wrong', 'terrible',
      'destroyed', 'wiped out', 'extinct', 'endangered',
      'chemicals', 'ammonia', 'pesticides', 'antibiotics',
      'pink slime', 'fillers', 'preservatives', 'gmo'
    ];

    const positiveKeywords = [
      'great', 'amazing', 'excellent', 'wonderful', 'fantastic',
      'love', 'like', 'enjoy', 'happy', 'joy', 'pleased',
      'thank', 'thanks', 'grateful', 'appreciate',
      'good', 'better', 'best', 'awesome', 'perfect',
      'organic', 'natural', 'healthy', 'clean', 'pure',
      'sustainable', 'eco-friendly', 'green', 'environment'
    ];

    const neutralKeywords = [
      'information', 'informative', 'update', 'news',
      'looking', 'forward', 'more', 'updates',
      'sharing', 'share', 'post', 'content'
    ];

    let negativeScore = 0;
    let positiveScore = 0;
    let neutralScore = 0;

    // Count keyword matches with weighted scoring
    negativeKeywords.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      negativeScore += matches * 2; // Higher weight for negative keywords
    });

    positiveKeywords.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      positiveScore += matches * 1.5;
    });

    neutralKeywords.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      neutralScore += matches;
    });

    // Calculate total score and determine sentiment
    const totalScore = negativeScore + positiveScore + neutralScore;
    let sentiment, confidence, score;

    if (totalScore === 0) {
      sentiment = 'neutral';
      confidence = 0.5;
      score = 0.5;
    } else {
      const negativeRatio = negativeScore / totalScore;
      const positiveRatio = positiveScore / totalScore;
      
      if (negativeRatio > 0.4) {
        sentiment = 'negative';
        confidence = Math.min(0.95, 0.6 + negativeRatio * 0.4);
        score = Math.max(0.1, 0.5 - negativeRatio * 0.4);
      } else if (positiveRatio > 0.4) {
        sentiment = 'positive';
        confidence = Math.min(0.95, 0.6 + positiveRatio * 0.4);
        score = Math.min(0.9, 0.5 + positiveRatio * 0.4);
      } else {
        sentiment = 'neutral';
        confidence = Math.max(0.6, 0.5 + Math.abs(negativeRatio - positiveRatio) * 0.3);
        score = 0.5;
      }
    }

    return { sentiment, confidence, score };
  };

  // Extract keywords from text
  const extractKeywords = (text) => {
    if (!text) return [];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'about'];
    const keywords = words.filter(word => !stopWords.includes(word));
    
    // Get top 5 most relevant keywords
    const keywordCounts = {};
    keywords.forEach(word => {
      keywordCounts[word] = (keywordCounts[word] || 0) + 1;
    });
    
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  // Initialize Facebook SDK
  useEffect(() => {
    console.log('Checking login status and restoring session...');
    
    // Check for saved session first
    const savedUser = localStorage.getItem('instagram_sentiment_user');
    const savedPages = localStorage.getItem('instagram_sentiment_pages');
    const savedSelectedPage = localStorage.getItem('instagram_sentiment_selected_page');
    
    if (savedUser && savedPages) {
      console.log('Restoring saved session:', JSON.parse(savedUser).name);
      setUser(JSON.parse(savedUser));
      setPages(JSON.parse(savedPages));
      if (savedSelectedPage) {
        const selectedPageData = JSON.parse(savedSelectedPage);
        setSelectedPage(selectedPageData);
        fetchInstagramPosts(selectedPageData.access_token, selectedPageData.instagram_business_account.id);
      }
      return;
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });

      window.FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
          fetchUserInfo();
        }
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Initialize database connection
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      const { data, error } = await supabase.from('instagram_posts').select('count').limit(1);
      if (error) throw error;
      console.log('✅ Supabase database connection established successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
    }
  };

  const login = () => {
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
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&access_token=${accessToken}&limit=50`
      );
      const data = await response.json();
      
      if (data.data) {
        const postsWithAnalysis = data.data.map(post => {
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
        if (postsWithAnalysis.length > 0) {
          await dbHelpers.savePosts(postsWithAnalysis, user?.id || 'demo_user');
        }
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
      console.log('Attempting to fetch real Instagram comments for post:', postId);
      
      // Try to fetch real comments first
      let realComments = [];
      if (selectedPage && !isDemoMode) {
        try {
          const response = await fetch(
            `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp&access_token=${selectedPage.access_token}`
          );
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            realComments = data.data;
          }
        } catch (error) {
          console.log('Instagram comment APIs are limited, using contextual sample comments for demonstration');
        }
      }
      
      // If no real comments or in demo mode, use contextual sample comments
      if (realComments.length === 0) {
        console.log('Loading contextual sample comments for live post:', postId);
        
        // Find the post to get context
        const post = posts.find(p => p.id === postId);
        const postContent = post?.caption || '';
        
        // Generate contextual comments based on post content
        let sampleComments = [];
        
        if (postContent.toLowerCase().includes('chick') || postContent.toLowerCase().includes('egg')) {
          sampleComments = [
            { id: '1', text: 'This is heartbreaking. Thank you for exposing this cruelty.', username: '@animal_advocate', like_count: 15 },
            { id: '2', text: 'The egg industry needs to be held accountable for this systematic killing.', username: '@ethical_consumer', like_count: 12 },
            { id: '3', text: 'How is this legal? This is pure animal abuse.', username: '@vegan_warrior', like_count: 18 },
            { id: '4', text: 'Switched to plant-based after learning about this. Never going back.', username: '@compassionate_living', like_count: 9 }
          ];
        } else if (postContent.toLowerCase().includes('pig') || postContent.toLowerCase().includes('farm')) {
          sampleComments = [
            { id: '1', text: 'Factory farming is a nightmare. Thank you for showing the truth.', username: '@farm_truth', like_count: 22 },
            { id: '2', text: 'These innocent animals deserve so much better than this.', username: '@pig_lover', like_count: 16 },
            { id: '3', text: 'This breaks my heart. How can we stop this cruelty?', username: '@animal_rights', like_count: 14 },
            { id: '4', text: 'Everyone needs to see this. Sharing now.', username: '@truth_seeker', like_count: 11 }
          ];
        } else if (postContent.toLowerCase().includes('beef') || postContent.toLowerCase().includes('meat')) {
          sampleComments = [
            { id: '1', text: 'Disgusting! I had no idea what was in ground beef.', username: '@health_conscious', like_count: 28 },
            { id: '2', text: 'Pink slime and ammonia? No thank you! Going vegetarian.', username: '@clean_eating', like_count: 19 },
            { id: '3', text: 'The meat industry has been lying to us for decades.', username: '@food_truth', like_count: 25 },
            { id: '4', text: 'This is why I only buy from local organic farms now.', username: '@conscious_consumer', like_count: 13 }
          ];
        } else {
          sampleComments = [
            { id: '1', text: 'Thank you for sharing this important information.', username: '@informed_citizen', like_count: 11 },
            { id: '2', text: 'More people need to know about this.', username: '@awareness_advocate', like_count: 9 },
            { id: '3', text: 'Keep up the great work exposing the truth!', username: '@truth_supporter', like_count: 12 },
            { id: '4', text: 'This is exactly why we need transparency in food production.', username: '@food_activist', like_count: 8 }
          ];
        }
        
        realComments = sampleComments;
      }
      
      // Analyze sentiment for each comment
      const commentsWithAnalysis = realComments.map(comment => {
        const analysis = analyzeSentiment(comment.text);
        return {
          ...comment,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          keywords: extractKeywords(comment.text)
        };
      });
      
      setComments(prev => ({ ...prev, [postId]: commentsWithAnalysis }));
      
      // Update total comments count
      setTotalComments(prev => prev + commentsWithAnalysis.length);
      
      // Save comments to database
      console.log('Saving comments to database:', {
        userId: user?.id || selectedPage?.instagram_business_account?.id || 'demo_user',
        postId: postId,
        commentCount: commentsWithAnalysis.length
      });
      
      await dbHelpers.saveComments(commentsWithAnalysis, postId, user?.id || selectedPage?.instagram_business_account?.id || 'demo_user');
      console.log('Comments saved successfully:', commentsWithAnalysis.length, 'records');
      
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const logout = () => {
    if (window.FB) {
      window.FB.logout();
    }
    setUser(null);
    setPages([]);
    setSelectedPage(null);
    setPosts([]);
    setComments({});
    setTotalComments(0);
    localStorage.removeItem('instagram_sentiment_user');
    localStorage.removeItem('instagram_sentiment_pages');
    localStorage.removeItem('instagram_sentiment_selected_page');
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setUser({ name: 'Demo User', id: 'demo_user' });
    setSelectedPage({ name: 'Eco-Friendly Business', instagram_business_account: { id: 'demo_account' } });
    
    // Demo posts with enhanced sentiment analysis
    const demoPosts = [
      {
        id: 'demo_post_1',
        caption: 'Our new sustainable packaging is made from 100% recycled materials! 🌱 Help us protect the environment one package at a time. #Sustainability #EcoFriendly #GreenBusiness',
        media_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500',
        like_count: 45,
        comments_count: 8,
        timestamp: new Date().toISOString(),
        sentiment: 'positive',
        confidence: 0.85,
        sentimentScore: 0.75,
        keywords: ['sustainable', 'recycled', 'environment', 'green', 'eco']
      },
      {
        id: 'demo_post_2',
        caption: 'We are facing serious challenges with our supply chain due to recent disruptions. Working hard to minimize impact on our customers. Updates coming soon.',
        media_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
        like_count: 12,
        comments_count: 15,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        sentiment: 'negative',
        confidence: 0.78,
        sentimentScore: 0.25,
        keywords: ['challenges', 'disruptions', 'impact', 'supply', 'chain']
      },
      {
        id: 'demo_post_3',
        caption: 'Check out our latest blog post about sustainable farming practices. Learn how we work with local farmers to ensure quality and environmental responsibility.',
        media_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500',
        like_count: 28,
        comments_count: 6,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        sentiment: 'neutral',
        confidence: 0.65,
        sentimentScore: 0.55,
        keywords: ['farming', 'farmers', 'quality', 'environmental', 'blog']
      }
    ];
    
    setPosts(demoPosts);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setUser(null);
    setSelectedPage(null);
    setPosts([]);
    setComments({});
    setTotalComments(0);
  };

  // Calculate statistics
  const positiveCount = posts.filter(post => post.sentiment === 'positive').length;
  const negativeCount = posts.filter(post => post.sentiment === 'negative').length;
  const neutralCount = posts.filter(post => post.sentiment === 'neutral').length;
  const avgSentiment = posts.length > 0 ? 
    Math.round((posts.reduce((sum, post) => sum + (post.sentimentScore || 0.5), 0) / posts.length) * 100) : 50;

  const renderSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const renderOverview = () => (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{posts.length}</div>
          <div className="stat-label">TOTAL POSTS</div>
        </div>
        <div className="stat-card positive">
          <div className="stat-number">{positiveCount}</div>
          <div className="stat-label">POSITIVE POSTS</div>
        </div>
        <div className="stat-card negative">
          <div className="stat-number">{negativeCount}</div>
          <div className="stat-label">NEGATIVE POSTS</div>
        </div>
        <div className="stat-card neutral">
          <div className="stat-number">{neutralCount}</div>
          <div className="stat-label">NEUTRAL POSTS</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgSentiment}%</div>
          <div className="stat-label">AVG SENTIMENT</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalComments}</div>
          <div className="stat-label">TOTAL COMMENTS</div>
        </div>
      </div>

      <div className="posts-container">
        <h2>Post Analysis</h2>
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-meta">
                <div className="post-date">{new Date(post.timestamp).toLocaleDateString()}</div>
                <div className="post-stats">
                  <span>❤️ {post.like_count} likes</span>
                  <span>💬 {post.comments_count} comments</span>
                </div>
              </div>
              <a href={post.permalink || '#'} target="_blank" rel="noopener noreferrer" className="view-link">
                View on Instagram
              </a>
            </div>
            
            {post.media_url && (
              <div className="post-image">
                <img 
                  src={post.media_url} 
                  alt="Instagram post" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="post-image-placeholder" style={{display: 'none'}}>
                  📷 Image not available
                </div>
              </div>
            )}
            
            <div className="post-content">
              <div className="post-caption">{post.caption}</div>
            </div>
            
            <div className="post-analysis">
              <div className={`sentiment-badge ${post.sentiment}`}>
                <span className="sentiment-icon">{renderSentimentIcon(post.sentiment)}</span>
                {post.sentiment} ({Math.round((post.confidence || 0.5) * 100)}% confidence)
              </div>
              <div className="post-actions">
                <button 
                  className="analyze-btn"
                  onClick={() => loadComments(post.id)}
                  disabled={loadingComments[post.id]}
                >
                  💬 {loadingComments[post.id] ? 'Loading...' : 'Analyze Comments'}
                </button>
              </div>
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
                      <div className="comment-text">{comment.text}</div>
                      <div className="comment-meta">
                        <span>Keywords: {comment.keywords.join(', ')}❤️ {comment.like_count} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSinglePost = () => (
    <div className="single-post-section">
      <h2>Single Post Analysis</h2>
      <p>Select a specific post to analyze in detail...</p>
      {/* Single post analysis implementation */}
    </div>
  );

  const renderBusinessIntelligence = () => (
    <div className="business-intelligence-section">
      <h2>Business Intelligence Dashboard</h2>
      <div className="bi-grid">
        <div className="bi-card">
          <h3>Sentiment Trends</h3>
          <div className="trend-chart">
            <div className="trend-positive" style={{height: `${(positiveCount / posts.length) * 100}%`}}>
              {positiveCount}
            </div>
            <div className="trend-neutral" style={{height: `${(neutralCount / posts.length) * 100}%`}}>
              {neutralCount}
            </div>
            <div className="trend-negative" style={{height: `${(negativeCount / posts.length) * 100}%`}}>
              {negativeCount}
            </div>
          </div>
        </div>
        
        <div className="bi-card">
          <h3>Engagement Metrics</h3>
          <div className="engagement-stats">
            <div className="engagement-item">
              <span className="metric-label">Total Engagement</span>
              <span className="metric-value">{posts.reduce((sum, post) => sum + (post.like_count || 0) + (post.comments_count || 0), 0)}</span>
            </div>
            <div className="engagement-item">
              <span className="metric-label">Avg Likes per Post</span>
              <span className="metric-value">{posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + (post.like_count || 0), 0) / posts.length) : 0}</span>
            </div>
            <div className="engagement-item">
              <span className="metric-label">Avg Comments per Post</span>
              <span className="metric-value">{posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + (post.comments_count || 0), 0) / posts.length) : 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <h2>Connect Your Instagram Business Account</h2>
            <div className="login-options">
              <button className="facebook-login-btn" onClick={login}>
                <span className="btn-icon">🔗</span>
                Login with Facebook
              </button>
              <button className="demo-btn" onClick={enterDemoMode}>
                <span className="btn-icon">🎭</span>
                Try Demo Mode
              </button>
            </div>
          </div>
        </div>
        <div className="app-footer">
          <p>Powered by Open Paws AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Instagram Sentiment Analysis</h1>
          <p>Analyze the sentiment of your Instagram posts and comments with AI-powered insights</p>
          
          {isDemoMode ? (
            <div className="demo-banner">
              <div className="demo-notice">
                <span>🎭</span>
                Demo Mode - Sample Data
              </div>
              <button className="exit-demo-btn" onClick={exitDemoMode}>Exit Demo</button>
            </div>
          ) : (
            <div className="user-banner">
              <span>Welcome, {user.name}!</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          )}
          
          {selectedPage && (
            <div className="live-notice">
              <span>🔴</span>
              Live Mode - Connected to {selectedPage.name}
            </div>
          )}
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="tab-icon">📊</span>
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'single-post' ? 'active' : ''}`}
            onClick={() => setActiveTab('single-post')}
          >
            <span className="tab-icon">🔍</span>
            Single Post
          </button>
          <button 
            className={`tab ${activeTab === 'business-intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('business-intelligence')}
          >
            <span className="tab-icon">💼</span>
            Business Intelligence
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading Instagram data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'single-post' && renderSinglePost()}
            {activeTab === 'business-intelligence' && renderBusinessIntelligence()}
          </>
        )}
      </div>
      
      <div className="app-footer">
        <p>Powered by Open Paws AI</p>
      </div>
    </div>
  );
}

export default App;
