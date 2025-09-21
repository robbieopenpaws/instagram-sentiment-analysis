import React, { useState, useEffect } from 'react';
import './App-INTELLIGENT.css';

const FACEBOOK_APP_ID = '760837916843241';

// Simple working Instagram Sentiment Analysis App
function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('Facebook login failed');
        setLoading(false);
      }
    }, {
      scope: 'instagram_basic,pages_show_list,instagram_manage_insights'
    });
  };

  // Load Instagram Posts (Demo)
  const loadInstagramPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Demo posts for testing
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
            impact: 'high'
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
            impact: 'very-high'
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
            impact: 'medium'
          }
        }
      ];
      
      setPosts(demoPosts);
      setLoading(false);
    } catch (err) {
      setError('Failed to load posts: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌱 Instagram Sentiment Analysis</h1>
        <p>AI-Powered Vegan Advocacy Analytics</p>
      </header>

      <main className="app-main">
        {!user ? (
          <div className="login-section">
            <h2>Connect Your Instagram Account</h2>
            <p>Analyze your Instagram posts and comments to measure advocacy effectiveness</p>
            <button 
              onClick={handleFacebookLogin}
              disabled={loading}
              className="facebook-login-btn"
            >
              {loading ? 'Connecting...' : 'Login with Facebook'}
            </button>
          </div>
        ) : (
          <div className="dashboard">
            <div className="user-info">
              <h2>Welcome! 👋</h2>
              <p>Connected to Instagram via Facebook</p>
            </div>

            <div className="actions">
              <button 
                onClick={loadInstagramPosts}
                disabled={loading}
                className="load-posts-btn"
              >
                {loading ? 'Loading...' : 'Load Instagram Posts'}
              </button>
            </div>

            {posts.length > 0 && (
              <div className="posts-section">
                <h3>📊 Analysis Results</h3>
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
                          Score: {(post.analysis.score * 100).toFixed(0)}%
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
            ⚠️ {error}
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
