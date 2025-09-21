import React, { useState, useEffect } from 'react';
import './App-CLEAN.css';

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

    setLoading(true);
    setError('');
    
    try {
      // Demo post data (in real implementation, this would fetch from Instagram API)
      const demoPost = {
        id: '1',
        caption: 'Check out this amazing plant-based meal! 🌱 #vegan #plantbased',
        media_type: 'IMAGE',
        like_count: 45,
        comments_count: 12,
        timestamp: '2024-01-15T10:30:00Z',
        url: postUrl,
        comments: [
          { text: 'This looks amazing! Going vegan after seeing this', username: 'user1' },
          { text: 'Disgusting, animals are meant to be eaten', username: 'user2' },
          { text: 'Interesting perspective, makes me think', username: 'user3' },
          { text: 'Personal choice, stop being preachy', username: 'user4' },
          { text: 'Been vegan for 5 years, love this message!', username: 'user5' }
        ]
      };
      
      setPosts([demoPost]);
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
    setAnalyzing(true);
    setProgress(0);
    setError('');
    
    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Demo account analysis data
      const accountData = {
        total_posts_analyzed: 15,
        total_comments_analyzed: 342,
        date_range: `Last ${dateRange} months`,
        filter_settings: {
          min_comments: minComments,
          sort_by: sortBy,
          max_posts: maxPosts
        },
        overall_metrics: {
          avg_impact_score: 77,
          avg_conversion_potential: 68,
          avg_resistance_level: 23,
          total_engagement: 1247
        },
        category_distribution: {
          'anti-animal-ag': 89,
          'questioning': 127,
          'defensive': 78,
          'pro-animal-ag': 34,
          'already-vegan': 14
        },
        top_performing_posts: [
          {
            caption: 'The environmental impact of animal agriculture is staggering 🌍',
            impact_score: 92,
            comments_count: 67,
            conversion_potential: 85
          },
          {
            caption: 'Why I chose to go vegan for the animals 💚',
            impact_score: 88,
            comments_count: 45,
            conversion_potential: 82
          },
          {
            caption: 'Plant-based nutrition myths debunked 🌱',
            impact_score: 84,
            comments_count: 38,
            conversion_potential: 79
          }
        ]
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
