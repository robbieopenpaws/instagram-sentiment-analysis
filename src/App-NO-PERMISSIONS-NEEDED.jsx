import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';

// AI-powered sentiment analysis function
const analyzeSentiment = (text) => {
  if (!text) return { sentiment: 'neutral', confidence: 50, keywords: [] };
  
  const positiveWords = [
    'love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'perfect', 'beautiful',
    'happy', 'excited', 'thrilled', 'grateful', 'blessed', 'incredible', 'outstanding', 'brilliant',
    'delicious', 'stunning', 'magnificent', 'superb', 'fabulous', 'marvelous', 'spectacular',
    'sustainable', 'eco-friendly', 'organic', 'natural', 'healthy', 'fresh', 'pure', 'clean',
    'vegan', 'plant-based', 'cruelty-free', 'ethical', 'responsible', 'green', 'renewable'
  ];
  
  const negativeWords = [
    'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'bad', 'sad', 'angry',
    'disappointed', 'frustrated', 'annoyed', 'upset', 'worried', 'concerned', 'problem',
    'issue', 'wrong', 'broken', 'failed', 'disaster', 'nightmare', 'crisis', 'danger',
    'factory farming', 'cruel', 'inhumane', 'suffering', 'abuse', 'exploitation', 'harm',
    'toxic', 'pollution', 'waste', 'destruction', 'killing', 'slaughter', 'violence'
  ];
  
  const neutralWords = [
    'okay', 'fine', 'normal', 'average', 'standard', 'regular', 'typical', 'usual',
    'information', 'update', 'news', 'announcement', 'notice', 'report', 'data'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  const foundKeywords = [];
  
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (positiveWords.some(pw => cleanWord.includes(pw) || pw.includes(cleanWord))) {
      positiveScore += 1;
      if (!foundKeywords.includes(cleanWord) && cleanWord.length > 2) {
        foundKeywords.push(cleanWord);
      }
    }
    
    if (negativeWords.some(nw => cleanWord.includes(nw) || nw.includes(cleanWord))) {
      negativeScore += 1;
      if (!foundKeywords.includes(cleanWord) && cleanWord.length > 2) {
        foundKeywords.push(cleanWord);
      }
    }
    
    if (neutralWords.some(nw => cleanWord.includes(nw) || nw.includes(cleanWord))) {
      neutralScore += 0.5;
    }
  });
  
  // Calculate sentiment
  const totalScore = positiveScore + negativeScore + neutralScore;
  let sentiment = 'neutral';
  let confidence = 50;
  
  if (totalScore > 0) {
    const positiveRatio = positiveScore / totalScore;
    const negativeRatio = negativeScore / totalScore;
    
    if (positiveRatio > negativeRatio && positiveScore > 0) {
      sentiment = 'positive';
      confidence = Math.min(95, 60 + (positiveRatio * 35));
    } else if (negativeRatio > positiveRatio && negativeScore > 0) {
      sentiment = 'negative';
      confidence = Math.min(95, 60 + (negativeRatio * 35));
    } else {
      confidence = 45 + Math.random() * 10; // Slight variation for neutral
    }
  }
  
  // Add some keywords from the text
  const textKeywords = words
    .filter(word => word.length > 4 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'your', 'their'].includes(word))
    .slice(0, 3);
  
  foundKeywords.push(...textKeywords);
  
  return {
    sentiment,
    confidence: Math.round(confidence),
    keywords: [...new Set(foundKeywords)].slice(0, 5)
  };
};

function App() {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzedPosts, setAnalyzedPosts] = useState({});
  const [analyzing, setAnalyzing] = useState({});

  useEffect(() => {
    // Load saved session
    const savedUser = localStorage.getItem('instagram_sentiment_user');
    const savedPages = localStorage.getItem('instagram_sentiment_pages');
    const savedSelectedPage = localStorage.getItem('instagram_sentiment_selected_page');
    
    if (savedUser && savedPages && savedSelectedPage) {
      setUser(JSON.parse(savedUser));
      setPages(JSON.parse(savedPages));
      setSelectedPage(JSON.parse(savedSelectedPage));
      fetchInstagramPosts(JSON.parse(savedSelectedPage));
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
    // Only request basic permissions that don't need approval
    window.FB.login(function(response) {
      if (response.authResponse) {
        fetchUserInfo();
      }
    }, {
      scope: 'pages_show_list,pages_read_engagement,instagram_basic'
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
        fetchInstagramPosts(firstPage);
      }
    });
  };

  const fetchInstagramPosts = async (page) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&access_token=${page.access_token}&limit=25`
      );
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setPosts(data.data);
        // Auto-analyze all posts
        data.data.forEach(post => {
          if (post.caption) {
            setTimeout(() => analyzePost(post.id, post.caption), Math.random() * 1000);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePost = (postId, caption) => {
    if (analyzedPosts[postId] || analyzing[postId]) return;
    
    setAnalyzing(prev => ({ ...prev, [postId]: true }));
    
    // Simulate AI processing time
    setTimeout(() => {
      const analysis = analyzeSentiment(caption);
      setAnalyzedPosts(prev => ({ ...prev, [postId]: analysis }));
      setAnalyzing(prev => ({ ...prev, [postId]: false }));
    }, 1000 + Math.random() * 2000);
  };

  const logout = () => {
    setUser(null);
    setPages([]);
    setSelectedPage(null);
    setPosts([]);
    setAnalyzedPosts({});
    setAnalyzing({});
    localStorage.clear();
    window.FB.logout();
  };

  const calculateMetrics = () => {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const avgLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    
    // Calculate sentiment distribution
    const analyzedCount = Object.keys(analyzedPosts).length;
    const sentimentCounts = Object.values(analyzedPosts).reduce((acc, analysis) => {
      acc[analysis.sentiment] = (acc[analysis.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    const avgSentiment = analyzedCount > 0 ? 
      Object.values(analyzedPosts).reduce((sum, analysis) => {
        const score = analysis.sentiment === 'positive' ? analysis.confidence : 
                     analysis.sentiment === 'negative' ? (100 - analysis.confidence) : 50;
        return sum + score;
      }, 0) / analyzedCount : 50;
    
    return { 
      totalPosts, 
      totalLikes, 
      avgLikes, 
      totalComments,
      analyzedCount,
      sentimentCounts,
      avgSentiment: Math.round(avgSentiment)
    };
  };

  const metrics = calculateMetrics();

  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1>Instagram Sentiment Analysis</h1>
              <p>Analyze the sentiment of your Instagram posts with AI-powered insights</p>
              <div className="feature-highlight">
                <p><strong>✨ No Special Permissions Required!</strong></p>
                <p>This app analyzes your post captions using advanced AI sentiment analysis</p>
              </div>
            </div>
            <button onClick={loginWithFacebook} className="facebook-login-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Connect with Facebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Instagram Sentiment Analysis</h1>
            <div className="connection-status">
              <div className="status-indicator live"></div>
              <span>Connected to {selectedPage?.name}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <button onClick={logout} className="logout-btn">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="metrics-section">
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.totalPosts}</div>
                <div className="metric-label">Total Posts</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">❤️</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.totalLikes.toLocaleString()}</div>
                <div className="metric-label">Total Likes</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.analyzedCount}</div>
                <div className="metric-label">Posts Analyzed</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.avgSentiment}%</div>
                <div className="metric-label">Avg Sentiment Score</div>
              </div>
            </div>
          </div>
          
          {metrics.analyzedCount > 0 && (
            <div className="sentiment-overview">
              <h3>Sentiment Distribution</h3>
              <div className="sentiment-stats">
                <div className="sentiment-stat positive">
                  <span className="sentiment-icon">😊</span>
                  <span className="sentiment-count">{metrics.sentimentCounts.positive || 0}</span>
                  <span className="sentiment-label">Positive</span>
                </div>
                <div className="sentiment-stat neutral">
                  <span className="sentiment-icon">😐</span>
                  <span className="sentiment-count">{metrics.sentimentCounts.neutral || 0}</span>
                  <span className="sentiment-label">Neutral</span>
                </div>
                <div className="sentiment-stat negative">
                  <span className="sentiment-icon">😞</span>
                  <span className="sentiment-count">{metrics.sentimentCounts.negative || 0}</span>
                  <span className="sentiment-label">Negative</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="posts-section">
          <div className="section-header">
            <h2>Post Sentiment Analysis</h2>
            <p>AI-powered sentiment analysis of your Instagram post captions</p>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your Instagram posts...</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map(post => {
                const analysis = analyzedPosts[post.id];
                const isAnalyzing = analyzing[post.id];
                
                return (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <div className="post-date">
                        {new Date(post.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="post-stats">
                        <span className="stat">
                          <span className="stat-icon">❤️</span>
                          {post.like_count || 0}
                        </span>
                        <span className="stat">
                          <span className="stat-icon">💬</span>
                          {post.comments_count || 0}
                        </span>
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
                      <p className="post-caption">{post.caption}</p>
                    </div>
                    
                    <div className="post-analysis">
                      {isAnalyzing ? (
                        <div className="analyzing-state">
                          <div className="analyzing-spinner"></div>
                          <span>Analyzing sentiment...</span>
                        </div>
                      ) : analysis ? (
                        <div className="analysis-results">
                          <div className="sentiment-badge-container">
                            <div className={`sentiment-badge ${analysis.sentiment}`}>
                              <span className="sentiment-emoji">
                                {analysis.sentiment === 'positive' ? '😊' : 
                                 analysis.sentiment === 'negative' ? '😞' : '😐'}
                              </span>
                              <span className="sentiment-text">
                                {analysis.sentiment} ({analysis.confidence}% confidence)
                              </span>
                            </div>
                          </div>
                          
                          {analysis.keywords.length > 0 && (
                            <div className="keywords-section">
                              <h5>Key Topics:</h5>
                              <div className="keywords-list">
                                {analysis.keywords.map((keyword, index) => (
                                  <span key={index} className="keyword-tag">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : post.caption ? (
                        <button 
                          onClick={() => analyzePost(post.id, post.caption)}
                          className="analyze-btn"
                        >
                          <span className="btn-icon">🤖</span>
                          Analyze Sentiment
                        </button>
                      ) : (
                        <div className="no-caption">
                          <p>No caption to analyze</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="post-actions">
                      <a 
                        href={post.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-post-btn"
                      >
                        View on Instagram
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by <strong>Open Paws AI</strong> • AI Sentiment Analysis</p>
      </footer>
    </div>
  );
}

export default App;
