import React, { useState, useEffect } from 'react';
import './App-INTELLIGENT.css';

const FACEBOOK_APP_ID = '760837916843241';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  
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

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setPosts([]);
    setError('');
  };

  // Simulate analysis with progress
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
      
      // Demo posts with analysis results
      const demoPosts = [
        {
          id: '1',
          caption: 'Check out this amazing plant-based meal! 🌱 #vegan #plantbased',
          media_type: 'IMAGE',
          like_count: 45,
          comments_count: 12,
          timestamp: '2024-01-15T10:30:00Z',
          analysis: {
            sentiment: 'positive',
            score: 0.8,
            category: 'pro-vegan',
            impact: 'high',
            conversion_potential: 0.7,
            resistance_level: 0.2
          }
        },
        {
          id: '2',
          caption: 'Why I chose to go vegan for the animals 💚',
          media_type: 'IMAGE',
          like_count: 67,
          comments_count: 23,
          timestamp: '2024-01-14T15:45:00Z',
          analysis: {
            sentiment: 'positive',
            score: 0.9,
            category: 'advocacy',
            impact: 'very-high',
            conversion_potential: 0.8,
            resistance_level: 0.1
          }
        },
        {
          id: '3',
          caption: 'The environmental impact of animal agriculture is staggering 🌍',
          media_type: 'IMAGE',
          like_count: 89,
          comments_count: 34,
          timestamp: '2024-01-13T12:20:00Z',
          analysis: {
            sentiment: 'neutral',
            score: 0.6,
            category: 'educational',
            impact: 'medium',
            conversion_potential: 0.6,
            resistance_level: 0.4
          }
        }
      ];
      
      setPosts(demoPosts);
      setAnalyzing(false);
      setProgress(100);
    } catch (err) {
      setError('Analysis failed: ' + err.message);
      setAnalyzing(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
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

      <main className="app-main">
        {!user ? (
          <div className="login-section">
            <div className="login-card">
              <h2>Connect Your Instagram Account</h2>
              <p>Analyze your Instagram posts and comments to measure advocacy effectiveness</p>
              
              <div className="features-preview">
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <span>Specialized vegan advocacy analysis</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <span>Measure conversion potential</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📈</span>
                  <span>Track advocacy effectiveness</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔍</span>
                  <span>Intelligent content filtering</span>
                </div>
              </div>
              
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

            <div className="filter-controls">
              <h3>🎯 Analysis Settings</h3>
              <div className="controls-grid">
                <div className="control-group">
                  <label>Minimum Comments</label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={minComments}
                    onChange={(e) => setMinComments(e.target.value)}
                  />
                  <span>{minComments}+ comments</span>
                </div>

                <div className="control-group">
                  <label>Date Range</label>
                  <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                    <option value={24}>Last 24 months</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="comments">Most Comments</option>
                    <option value="likes">Most Likes</option>
                    <option value="recent">Most Recent</option>
                    <option value="engagement">Best Engagement</option>
                  </select>
                </div>

                <div className="control-group">
                  <label>Max Posts</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={maxPosts}
                    onChange={(e) => setMaxPosts(e.target.value)}
                  />
                  <span>{maxPosts} posts</span>
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
                    <span className="analyze-icon">🚀</span>
                    Run Account-Wide Analysis
                  </span>
                )}
              </button>
              
              {analyzing && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${progress}%`}}></div>
                </div>
              )}
            </div>

            {posts.length > 0 && (
              <div className="results-section">
                <h3>📊 Analysis Results</h3>
                
                <div className="summary-stats">
                  <div className="stat-card">
                    <div className="stat-value">{posts.length}</div>
                    <div className="stat-label">Posts Analyzed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {Math.round(posts.reduce((sum, post) => sum + post.analysis.score, 0) / posts.length * 100)}%
                    </div>
                    <div className="stat-label">Avg Impact Score</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {Math.round(posts.reduce((sum, post) => sum + post.analysis.conversion_potential, 0) / posts.length * 100)}%
                    </div>
                    <div className="stat-label">Conversion Potential</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {posts.reduce((sum, post) => sum + post.comments_count, 0)}
                    </div>
                    <div className="stat-label">Total Comments</div>
                  </div>
                </div>

                <div className="posts-grid">
                  {posts.map(post => (
                    <div key={post.id} className="post-card">
                      <div className="post-content">
                        <p className="post-caption">{post.caption}</p>
                        <div className="post-stats">
                          <span>❤️ {post.like_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                      </div>
                      <div className="post-analysis">
                        <div className={`sentiment ${post.analysis.sentiment}`}>
                          {post.analysis.sentiment.toUpperCase()}
                        </div>
                        <div className="score">
                          Impact Score: {Math.round(post.analysis.score * 100)}%
                        </div>
                        <div className="conversion">
                          Conversion: {Math.round(post.analysis.conversion_potential * 100)}%
                        </div>
                        <div className="category">
                          Category: {post.analysis.category}
                        </div>
                        <div className={`impact ${post.analysis.impact}`}>
                          Impact: {post.analysis.impact}
                        </div>
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

      <footer className="app-footer">
        <p>Built for vegan advocacy impact measurement</p>
      </footer>
    </div>
  );
}

export default App;
