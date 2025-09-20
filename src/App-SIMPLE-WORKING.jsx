import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';

function App() {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

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
    window.FB.login(function(response) {
      if (response.authResponse) {
        fetchUserInfo();
      }
    }, {
      scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights'
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
      
      if (data.data) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId) => {
    if (loadingComments[postId] || comments[postId]) return;
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    
    try {
      console.log('Loading comments for post:', postId);
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp,from&access_token=${selectedPage.access_token}&limit=100`
      );
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.error) {
        console.error('API Error:', data.error);
        alert(`Error: ${data.error.message}`);
        return;
      }
      
      if (data.data) {
        console.log(`Found ${data.data.length} comments`);
        setComments(prev => ({ ...prev, [postId]: data.data }));
      } else {
        console.log('No comments found');
        setComments(prev => ({ ...prev, [postId]: [] }));
      }
      
    } catch (error) {
      console.error('Error loading comments:', error);
      alert(`Error loading comments: ${error.message}`);
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
    localStorage.clear();
    window.FB.logout();
  };

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
        <div className="user-info">
          <span>🔴 Live Mode - {selectedPage?.name}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="overview-tab">
        <div className="posts-section">
          <h2>Post Analysis</h2>
          {loading ? (
            <div className="loading">Loading posts...</div>
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
                    <button 
                      onClick={() => loadComments(post.id)}
                      className="analyze-btn"
                      disabled={loadingComments[post.id]}
                    >
                      {loadingComments[post.id] ? '⏳ Loading...' : '💬 Load Comments'}
                    </button>
                  </div>

                  {comments[post.id] && (
                    <div className="comments-section">
                      <h4>Comments ({comments[post.id].length})</h4>
                      <div className="comments-list">
                        {comments[post.id].map(comment => (
                          <div key={comment.id} className="comment-card">
                            <div className="comment-header">
                              <span className="comment-username">
                                {comment.from?.username || comment.username || 'Unknown'}
                              </span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                            <div className="comment-meta">
                              <span>❤️ {comment.like_count || 0} likes</span>
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

      <footer className="app-footer">
        <p>Powered by Open Paws AI</p>
      </footer>
    </div>
  );
}

export default App;
