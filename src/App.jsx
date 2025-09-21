import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';

// Specialized Animal Agriculture Sentiment Analysis
const analyzeAnimalAgricultureSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return { 
      category: 'neutral', 
      confidence: 0, 
      score: 0, 
      advocacy_impact: 'none',
      conversion_potential: 0,
      resistance_level: 0
    };
  }

  const text_lower = text.toLowerCase();

  // Anti-Animal Agriculture indicators (your content is working!)
  const antiAnimalAg = {
    keywords: [
      'horrific', 'disgusting', 'cruel', 'inhumane', 'torture', 'abuse', 'suffering',
      'heartbreaking', 'devastating', 'shocking', 'appalling', 'barbaric', 'evil',
      'murder', 'killing', 'slaughter', 'violence', 'exploitation', 'slavery',
      'going vegan', 'never again', 'stop eating', 'quit meat', 'plant based',
      'eye opening', 'wake up call', 'changed my mind', 'never knew', 'had no idea'
    ],
    phrases: [
      'going vegan', 'stop eating meat', 'never eating meat again', 'opened my eyes',
      'changed my perspective', 'had no idea', 'this is horrible', 'so cruel',
      'makes me sick', 'cant support this', 'switching to plant based'
    ]
  };

  // Questioning/Curious indicators
  const questioning = {
    keywords: [
      'interesting', 'didnt know', 'really?', 'wow', 'hmm', 'makes me think',
      'never thought', 'good point', 'valid', 'maybe', 'perhaps', 'considering',
      'looking into', 'researching', 'learning', 'educating myself'
    ],
    phrases: [
      'makes me think', 'never thought about it', 'good point', 'interesting perspective',
      'didnt know that', 'maybe i should', 'worth considering', 'looking into this'
    ]
  };

  // Defensive indicators
  const defensive = {
    keywords: [
      'but', 'however', 'still', 'personal choice', 'my decision', 'respect',
      'judging', 'preachy', 'extreme', 'radical', 'forcing', 'pushing',
      'not for me', 'tried before', 'too hard', 'expensive', 'unrealistic'
    ],
    phrases: [
      'personal choice', 'respect my decision', 'not judging', 'too extreme',
      'not for everyone', 'tried it before', 'too expensive', 'not realistic'
    ]
  };

  // Pro-Animal Agriculture indicators
  const proAnimalAg = {
    keywords: [
      'farmers', 'farming', 'agriculture', 'necessary', 'natural', 'tradition',
      'protein', 'nutrition', 'healthy', 'balanced diet', 'food chain',
      'humane', 'ethical farming', 'grass fed', 'free range', 'local farm',
      'jobs', 'economy', 'livelihood', 'moderation', 'freedom'
    ],
    phrases: [
      'farmers work hard', 'support local farmers', 'ethical farming', 'humane treatment',
      'personal choice', 'everything in moderation', 'need protein', 'always eaten meat'
    ]
  };

  // Already Vegan indicators
  const alreadyVegan = {
    keywords: [
      'vegan', 'plant based', 'already', 'been vegan', 'years ago', 'love this',
      'exactly', 'absolutely', 'agree', 'thank you', 'spreading awareness',
      'keep it up', 'important message', 'more people need to see'
    ],
    phrases: [
      'been vegan for', 'already plant based', 'love this message', 'exactly right',
      'thank you for sharing', 'keep spreading awareness', 'more people need to know'
    ]
  };

  let scores = {
    'anti-animal-ag': 0,
    'questioning': 0,
    'defensive': 0,
    'pro-animal-ag': 0,
    'already-vegan': 0
  };

  // Score based on keywords
  antiAnimalAg.keywords.forEach(keyword => {
    if (text_lower.includes(keyword)) scores['anti-animal-ag'] += 2;
  });
  antiAnimalAg.phrases.forEach(phrase => {
    if (text_lower.includes(phrase)) scores['anti-animal-ag'] += 3;
  });

  questioning.keywords.forEach(keyword => {
    if (text_lower.includes(keyword)) scores['questioning'] += 2;
  });
  questioning.phrases.forEach(phrase => {
    if (text_lower.includes(phrase)) scores['questioning'] += 3;
  });

  defensive.keywords.forEach(keyword => {
    if (text_lower.includes(keyword)) scores['defensive'] += 2;
  });
  defensive.phrases.forEach(phrase => {
    if (text_lower.includes(phrase)) scores['defensive'] += 3;
  });

  proAnimalAg.keywords.forEach(keyword => {
    if (text_lower.includes(keyword)) scores['pro-animal-ag'] += 2;
  });
  proAnimalAg.phrases.forEach(phrase => {
    if (text_lower.includes(phrase)) scores['pro-animal-ag'] += 3;
  });

  alreadyVegan.keywords.forEach(keyword => {
    if (text_lower.includes(keyword)) scores['already-vegan'] += 2;
  });
  alreadyVegan.phrases.forEach(phrase => {
    if (text_lower.includes(phrase)) scores['already-vegan'] += 3;
  });

  // Determine category
  const maxScore = Math.max(...Object.values(scores));
  const category = Object.keys(scores).find(key => scores[key] === maxScore) || 'neutral';
  
  // Calculate advocacy impact
  let advocacy_impact = 'low';
  let conversion_potential = 0;
  let resistance_level = 0;

  if (category === 'anti-animal-ag') {
    advocacy_impact = 'very-high';
    conversion_potential = 0.9;
    resistance_level = 0.1;
  } else if (category === 'questioning') {
    advocacy_impact = 'high';
    conversion_potential = 0.7;
    resistance_level = 0.2;
  } else if (category === 'already-vegan') {
    advocacy_impact = 'medium';
    conversion_potential = 0.1;
    resistance_level = 0.0;
  } else if (category === 'defensive') {
    advocacy_impact = 'low';
    conversion_potential = 0.2;
    resistance_level = 0.8;
  } else if (category === 'pro-animal-ag') {
    advocacy_impact = 'very-low';
    conversion_potential = 0.1;
    resistance_level = 0.9;
  }

  return {
    category,
    confidence: Math.min(maxScore / 10, 1),
    score: maxScore / 10,
    advocacy_impact,
    conversion_potential,
    resistance_level
  };
};

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [accountAnalysis, setAccountAnalysis] = useState(null);
  const [postUrl, setPostUrl] = useState('');
  
  // Filter settings
  const [minComments, setMinComments] = useState(100);
  const [dateRange, setDateRange] = useState(6);
  const [sortBy, setSortBy] = useState('comments');
  const [maxPosts, setMaxPosts] = useState(50);

  // Initialize Facebook SDK
  useEffect(() => {
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

  // Facebook Login
  const handleFacebookLogin = () => {
    setLoading(true);
    setError('');
    
    window.FB.login((response) => {
      if (response.authResponse) {
        setUser({
          id: response.authResponse.userID,
          accessToken: response.authResponse.accessToken
        });
        setLoading(false);
      } else {
        setError('Facebook login failed. Please try again.');
        setLoading(false);
      }
    }, {
      scope: 'instagram_basic,pages_show_list,instagram_manage_insights'
    });
  };

  // Load individual post from URL
  const loadInstagramPostFromUrl = async () => {
    if (!postUrl.trim()) {
      setError('Please enter an Instagram post URL');
      return;
    }

    if (!user || !user.accessToken) {
      setError('Please login with Facebook first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Extract post ID from Instagram URL
      const postIdMatch = postUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
      if (!postIdMatch) {
        throw new Error('Invalid Instagram post URL. Please use format: https://www.instagram.com/p/POST_ID/');
      }
      
      const shortcode = postIdMatch[1];
      
      // First, get Instagram Business Account ID
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${user.accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found. You need a Facebook page connected to an Instagram Business account.');
      }
      
      let instagramAccountId = null;
      
      // Find Instagram Business Account
      console.log('Available Facebook pages:', pagesData.data.map(page => ({ id: page.id, name: page.name })));
      
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${user.accessToken}`);
          const igData = await igResponse.json();
          
          console.log(`Page "${page.name}" Instagram data:`, igData);
          
          if (igData.instagram_business_account) {
            instagramAccountId = igData.instagram_business_account.id;
            console.log('Found Instagram Business Account ID:', instagramAccountId);
            break;
          }
        } catch (err) {
          console.log('No Instagram account for page:', page.name, err);
        }
      }
      
      if (!instagramAccountId) {
        throw new Error('No Instagram Business account found. Please connect your Instagram Business account to your Facebook page.');
      }
      
      // Get Instagram media using the shortcode
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${user.accessToken}`);
      const mediaData = await mediaResponse.json();
      
      if (!mediaData.data) {
        throw new Error('Could not fetch Instagram posts. Make sure your Instagram account is connected.');
      }
      
      // Debug: Log available posts
      console.log('Available posts:', mediaData.data.map(post => ({
        id: post.id,
        permalink: post.permalink,
        caption: post.caption?.substring(0, 50) + '...'
      })));
      console.log('Looking for shortcode:', shortcode);
      
      // Find the post that matches our URL
      const targetPost = mediaData.data.find(post => post.permalink && post.permalink.includes(shortcode));
      
      if (!targetPost) {
        // More detailed error message
        const availableShortcodes = mediaData.data
          .filter(post => post.permalink)
          .map(post => {
            const match = post.permalink.match(/\/p\/([A-Za-z0-9_-]+)/);
            return match ? match[1] : 'unknown';
          });
        
        throw new Error(`Post not found. Looking for shortcode "${shortcode}" but found: ${availableShortcodes.slice(0, 5).join(', ')}${availableShortcodes.length > 5 ? '...' : ''}. Make sure this post belongs to your Instagram account and is public.`);
      }
      
      // Get comments for this post
      const commentsResponse = await fetch(`https://graph.facebook.com/v18.0/${targetPost.id}/comments?fields=text,username,timestamp&limit=100&access_token=${user.accessToken}`);
      const commentsData = await commentsResponse.json();
      
      const post = {
        id: targetPost.id,
        caption: targetPost.caption || '',
        media_type: targetPost.media_type,
        like_count: targetPost.like_count || 0,
        comments_count: targetPost.comments_count || 0,
        timestamp: targetPost.timestamp,
        url: postUrl,
        comments: commentsData.data || []
      };
      
      setPosts([post]);
      setLoading(false);
      
    } catch (err) {
      setError('Failed to load post: ' + err.message);
      setLoading(false);
    }
  };

  // Analyze individual post
  const analyzePost = (post) => {
    if (!post.comments) return null;

    const analysis = {
      total_comments: post.comments.length,
      categories: {
        'anti-animal-ag': 0,
        'questioning': 0,
        'defensive': 0,
        'pro-animal-ag': 0,
        'already-vegan': 0
      },
      detailed_comments: []
    };

    post.comments.forEach(comment => {
      const sentiment = analyzeAnimalAgricultureSentiment(comment.text);
      analysis.categories[sentiment.category]++;
      analysis.detailed_comments.push({
        text: comment.text,
        username: comment.username,
        analysis: sentiment
      });
    });

    // Calculate overall impact score
    const totalComments = analysis.total_comments;
    const impactScore = (
      (analysis.categories['anti-animal-ag'] * 5) +
      (analysis.categories['questioning'] * 3) +
      (analysis.categories['already-vegan'] * 2) +
      (analysis.categories['defensive'] * 1) +
      (analysis.categories['pro-animal-ag'] * 0)
    ) / (totalComments * 5);

    analysis.impact_score = Math.round(impactScore * 100);
    analysis.conversion_potential = Math.round(
      ((analysis.categories['anti-animal-ag'] + analysis.categories['questioning']) / totalComments) * 100
    );
    analysis.resistance_level = Math.round(
      ((analysis.categories['defensive'] + analysis.categories['pro-animal-ag']) / totalComments) * 100
    );

    return analysis;
  };

  // Run account-wide analysis
  const runAccountWideAnalysis = async () => {
    if (!user || !user.accessToken) {
      setError('Please login with Facebook first');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError('');
    
    try {
      setProgress(10);
      
      // Get Instagram Business Account ID
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${user.accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found. You need a Facebook page connected to an Instagram Business account.');
      }
      
      let instagramAccountId = null;
      
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${user.accessToken}`);
          const igData = await igResponse.json();
          
          if (igData.instagram_business_account) {
            instagramAccountId = igData.instagram_business_account.id;
            break;
          }
        } catch (err) {
          console.log('No Instagram account for page:', page.name);
        }
      }
      
      if (!instagramAccountId) {
        throw new Error('No Instagram Business account found. Please connect your Instagram Business account to your Facebook page.');
      }
      
      setProgress(20);
      
      // Calculate date filter
      const dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - dateRange);
      const since = Math.floor(dateFilter.getTime() / 1000);
      
      // Get Instagram media with filtering
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,permalink,timestamp,like_count,comments_count&since=${since}&limit=${maxPosts}&access_token=${user.accessToken}`);
      const mediaData = await mediaResponse.json();
      
      if (!mediaData.data) {
        throw new Error('Could not fetch Instagram posts. Make sure your Instagram account is connected.');
      }
      
      setProgress(40);
      
      // Filter posts by minimum comments
      const filteredPosts = mediaData.data.filter(post => 
        (post.comments_count || 0) >= minComments
      );
      
      // Sort posts based on sortBy setting
      filteredPosts.sort((a, b) => {
        switch (sortBy) {
          case 'comments':
            return (b.comments_count || 0) - (a.comments_count || 0);
          case 'likes':
            return (b.like_count || 0) - (a.like_count || 0);
          case 'recent':
            return new Date(b.timestamp) - new Date(a.timestamp);
          case 'engagement':
            const aEngagement = (a.like_count || 0) + (a.comments_count || 0);
            const bEngagement = (b.like_count || 0) + (b.comments_count || 0);
            return bEngagement - aEngagement;
          default:
            return 0;
        }
      });
      
      setProgress(60);
      
      // Analyze posts with rate limiting
      const analyzedPosts = [];
      const categoryTotals = {
        'anti-animal-ag': 0,
        'questioning': 0,
        'defensive': 0,
        'pro-animal-ag': 0,
        'already-vegan': 0
      };
      
      let totalComments = 0;
      let totalImpactScore = 0;
      let totalConversionPotential = 0;
      let totalResistanceLevel = 0;
      
      for (let i = 0; i < Math.min(filteredPosts.length, maxPosts); i++) {
        const post = filteredPosts[i];
        
        try {
          // Get comments for this post with rate limiting
          await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
          
          const commentsResponse = await fetch(`https://graph.facebook.com/v18.0/${post.id}/comments?fields=text,username,timestamp&limit=100&access_token=${user.accessToken}`);
          const commentsData = await commentsResponse.json();
          
          if (commentsData.data && commentsData.data.length > 0) {
            const postWithComments = {
              ...post,
              comments: commentsData.data
            };
            
            const analysis = analyzePost(postWithComments);
            if (analysis) {
              analyzedPosts.push({
                ...postWithComments,
                analysis
              });
              
              // Aggregate data
              Object.keys(categoryTotals).forEach(category => {
                categoryTotals[category] += analysis.categories[category];
              });
              
              totalComments += analysis.total_comments;
              totalImpactScore += analysis.impact_score;
              totalConversionPotential += analysis.conversion_potential;
              totalResistanceLevel += analysis.resistance_level;
            }
          }
          
          // Update progress
          const progressPercent = 60 + (i / Math.min(filteredPosts.length, maxPosts)) * 35;
          setProgress(Math.round(progressPercent));
          
        } catch (err) {
          console.error('Error analyzing post:', err);
        }
      }
      
      setProgress(95);
      
      // Calculate averages
      const postsAnalyzed = analyzedPosts.length;
      const avgImpactScore = postsAnalyzed > 0 ? Math.round(totalImpactScore / postsAnalyzed) : 0;
      const avgConversionPotential = postsAnalyzed > 0 ? Math.round(totalConversionPotential / postsAnalyzed) : 0;
      const avgResistanceLevel = postsAnalyzed > 0 ? Math.round(totalResistanceLevel / postsAnalyzed) : 0;
      
      // Get top performing posts
      const topPosts = analyzedPosts
        .sort((a, b) => b.analysis.impact_score - a.analysis.impact_score)
        .slice(0, 3)
        .map(post => ({
          caption: post.caption || 'No caption',
          impact_score: post.analysis.impact_score,
          comments_count: post.comments_count || 0,
          conversion_potential: post.analysis.conversion_potential
        }));
      
      const accountData = {
        total_posts_analyzed: postsAnalyzed,
        total_comments_analyzed: totalComments,
        date_range: `Last ${dateRange} months`,
        filter_settings: {
          min_comments: minComments,
          sort_by: sortBy,
          max_posts: maxPosts
        },
        overall_metrics: {
          avg_impact_score: avgImpactScore,
          avg_conversion_potential: avgConversionPotential,
          avg_resistance_level: avgResistanceLevel,
          total_engagement: analyzedPosts.reduce((sum, post) => sum + (post.like_count || 0) + (post.comments_count || 0), 0)
        },
        category_distribution: categoryTotals,
        top_performing_posts: topPosts
      };
      
      setAccountAnalysis(accountData);
      setAnalyzing(false);
      setProgress(100);
      
    } catch (err) {
      setError('Analysis failed: ' + err.message);
      setAnalyzing(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setPosts([]);
    setAccountAnalysis(null);
    setError('');
    setPostUrl('');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🌱 Instagram Sentiment Analysis</h1>
          <p>AI-Powered Vegan Advocacy Analytics</p>
          {user && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {!user ? (
          <div className="login-section">
            <div className="login-card">
              <h2>🌱 Vegan Advocacy Impact Analysis</h2>
              <p>Measure how effectively your content influences attitudes toward animal agriculture</p>
              
              <button 
                onClick={handleFacebookLogin}
                disabled={loading}
                className="facebook-login-btn"
              >
                {loading ? (
                  <span>
                    <span className="spinner"></span>
                    Connecting...
                  </span>
                ) : (
                  <span>
                    <span className="fb-icon">📘</span>
                    Login with Facebook
                  </span>
                )}
              </button>
              
              <div className="login-note">
                <p><strong>Note:</strong> You need an Instagram Business or Creator account connected to a Facebook page to use this tool.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome! 👋</h2>
              <p>Connected to Instagram via Facebook</p>
            </div>

            {/* Individual Post Analysis Section */}
            <div className="section">
              <h3>📱 Individual Post Analysis</h3>
              <div className="url-input-section">
                <div className="input-group">
                  <label htmlFor="post-url">Instagram Post URL:</label>
                  <input
                    id="post-url"
                    type="url"
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    className="url-input"
                  />
                </div>
                <button 
                  onClick={loadInstagramPostFromUrl}
                  disabled={loading}
                  className="load-btn"
                >
                  {loading ? 'Loading...' : 'Analyze Post'}
                </button>
              </div>

              {posts.length > 0 && (
                <div className="posts-section">
                  {posts.map(post => {
                    const analysis = analyzePost(post);
                    return (
                      <div key={post.id} className="post-card">
                        <div className="post-content">
                          <p className="post-caption">{post.caption}</p>
                          <div className="post-stats">
                            <span>❤️ {post.like_count}</span>
                            <span>💬 {post.comments_count}</span>
                          </div>
                        </div>
                        
                        {analysis && (
                          <div className="post-analysis">
                            <div className="impact-score">
                              <div className="score-circle">
                                <span className="score-number">{analysis.impact_score}%</span>
                                <span className="score-label">Impact Score</span>
                              </div>
                            </div>
                            
                            <div className="metrics">
                              <div className="metric">
                                <span className="metric-label">Conversion:</span>
                                <span className="metric-value">{analysis.conversion_potential}%</span>
                              </div>
                              <div className="metric">
                                <span className="metric-label">Resistance:</span>
                                <span className="metric-value">{analysis.resistance_level}%</span>
                              </div>
                            </div>

                            <div className="category-breakdown">
                              <h4>Response Categories:</h4>
                              {Object.entries(analysis.categories).map(([category, count]) => (
                                <div key={category} className="category-item">
                                  <span className={`category-label ${category}`}>
                                    {category.replace('-', ' ')}
                                  </span>
                                  <span className="category-count">{count}</span>
                                </div>
                              ))}
                            </div>

                            <div className="detailed-comments">
                              <h4>Comment Analysis:</h4>
                              {analysis.detailed_comments.map((comment, idx) => (
                                <div key={idx} className="comment-analysis">
                                  <div className="comment-text">"{comment.text}"</div>
                                  <div className="comment-meta">
                                    <span className={`comment-category ${comment.analysis.category}`}>
                                      {comment.analysis.category.replace('-', ' ')}
                                    </span>
                                    <span className="comment-impact">
                                      Impact: {comment.analysis.advocacy_impact}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Account-Wide Analysis Section */}
            <div className="section">
              <h3>🎯 Account-Wide Analysis</h3>
              
              <div className="filter-controls">
                <h4>Analysis Settings:</h4>
                <div className="controls-grid">
                  <div className="control-group">
                    <label>Minimum Comments: {minComments}+</label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={minComments}
                      onChange={(e) => setMinComments(e.target.value)}
                      className="range-input"
                    />
                  </div>

                  <div className="control-group">
                    <label>Date Range:</label>
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="select-input">
                      <option value={3}>Last 3 months</option>
                      <option value={6}>Last 6 months</option>
                      <option value={12}>Last 12 months</option>
                      <option value={24}>Last 24 months</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label>Sort By:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-input">
                      <option value="comments">Most Comments</option>
                      <option value="likes">Most Likes</option>
                      <option value="recent">Most Recent</option>
                      <option value="engagement">Best Engagement</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label>Max Posts: {maxPosts}</label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={maxPosts}
                      onChange={(e) => setMaxPosts(e.target.value)}
                      className="range-input"
                    />
                  </div>
                </div>
              </div>

              <div className="actions-section">
                <button 
                  onClick={runAccountWideAnalysis}
                  disabled={analyzing}
                  className="analyze-btn"
                >
                  {analyzing ? (
                    <span>
                      <span className="spinner"></span>
                      Analyzing... {progress}%
                    </span>
                  ) : (
                    <span>
                      🚀 Run Account-Wide Analysis
                    </span>
                  )}
                </button>
                
                {analyzing && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${progress}%`}}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Analysis Results */}
            {accountAnalysis && (
              <div className="section">
                <h3>📊 Analysis Results</h3>
                
                <div className="summary-stats">
                  <div className="stat-card">
                    <div className="stat-value">{accountAnalysis.total_posts_analyzed}</div>
                    <div className="stat-label">Posts Analyzed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{accountAnalysis.overall_metrics.avg_impact_score}%</div>
                    <div className="stat-label">Avg Impact Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{accountAnalysis.overall_metrics.avg_conversion_potential}%</div>
                    <div className="stat-label">Conversion Potential</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{accountAnalysis.total_comments_analyzed}</div>
                    <div className="stat-label">Total Comments</div>
                  </div>
                </div>

                <div className="category-distribution">
                  <h4>Response Distribution:</h4>
                  <div className="distribution-grid">
                    {Object.entries(accountAnalysis.category_distribution).map(([category, count]) => (
                      <div key={category} className="distribution-item">
                        <span className={`category-label ${category}`}>
                          {category.replace('-', ' ')}
                        </span>
                        <span className="category-count">{count} comments</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="top-posts">
                  <h4>Top Performing Posts:</h4>
                  {accountAnalysis.top_performing_posts.map((post, idx) => (
                    <div key={idx} className="top-post-item">
                      <div className="post-caption">"{post.caption}"</div>
                      <div className="post-metrics">
                        <span>Impact: {post.impact_score}%</span>
                        <span>Comments: {post.comments_count}</span>
                        <span>Conversion: {post.conversion_potential}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built for vegan advocacy impact measurement</p>
      </footer>
    </div>
  );
}

export default App;
