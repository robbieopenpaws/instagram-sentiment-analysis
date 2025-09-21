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
  const [totalComments, setTotalComments] = useState(0);

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
    // Updated scope to include the correct Instagram comment permissions
    window.FB.login(function(response) {
      if (response.authResponse) {
        fetchUserInfo();
      }
    }, {
      scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,instagram_manage_comments,instagram_business_manage_comments'
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
      console.log('Using access token:', selectedPage.access_token);
      
      // Try multiple API endpoints for comment access
      let commentsData = null;
      let apiError = null;
      
      // Method 1: Direct Instagram media comments (requires instagram_manage_comments)
      try {
        console.log('Trying Method 1: Direct Instagram media comments');
        const response1 = await fetch(
          `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp,from&access_token=${selectedPage.access_token}&limit=100`
        );
        const data1 = await response1.json();
        
        if (!data1.error && data1.data) {
          commentsData = data1;
          console.log('Method 1 successful:', data1);
        } else {
          console.log('Method 1 failed:', data1.error);
          apiError = data1.error;
        }
      } catch (error) {
        console.log('Method 1 exception:', error);
      }
      
      // Method 2: Try Instagram Business API (requires instagram_business_manage_comments)
      if (!commentsData) {
        try {
          console.log('Trying Method 2: Instagram Business API');
          const response2 = await fetch(
            `https://graph.facebook.com/v18.0/${selectedPage.instagram_business_account.id}?fields=media.limit(1){comments.limit(100){id,text,username,like_count,timestamp,from}}&access_token=${selectedPage.access_token}`
          );
          const data2 = await response2.json();
          
          if (!data2.error && data2.media && data2.media.data) {
            // Find the specific post's comments
            const postMedia = data2.media.data.find(media => media.id === postId);
            if (postMedia && postMedia.comments) {
              commentsData = postMedia.comments;
              console.log('Method 2 successful:', commentsData);
            }
          } else {
            console.log('Method 2 failed:', data2.error);
          }
        } catch (error) {
          console.log('Method 2 exception:', error);
        }
      }
      
      // Method 3: Try page-level access
      if (!commentsData) {
        try {
          console.log('Trying Method 3: Page-level access');
          const response3 = await fetch(
            `https://graph.facebook.com/v18.0/${selectedPage.id}?fields=instagram_business_account{media.limit(25){id,comments.limit(100){id,text,username,like_count,timestamp,from}}}&access_token=${selectedPage.access_token}`
          );
          const data3 = await response3.json();
          
          if (!data3.error && data3.instagram_business_account && data3.instagram_business_account.media) {
            const postMedia = data3.instagram_business_account.media.data.find(media => media.id === postId);
            if (postMedia && postMedia.comments) {
              commentsData = postMedia.comments;
              console.log('Method 3 successful:', commentsData);
            }
          } else {
            console.log('Method 3 failed:', data3.error);
          }
        } catch (error) {
          console.log('Method 3 exception:', error);
        }
      }
      
      if (commentsData && commentsData.data) {
        // Ensure data is an array before setting
        const commentsArray = Array.isArray(commentsData.data) ? commentsData.data : [];
        console.log(`Successfully loaded ${commentsArray.length} comments`);
        
        setComments(prev => ({ ...prev, [postId]: commentsArray }));
        setTotalComments(prev => prev + commentsArray.length);
        
        if (commentsArray.length === 0) {
          alert('No comments found for this post. This might be because:\n1. The post has no comments\n2. Comments are private\n3. Additional permissions may be needed');
        }
      } else {
        console.log('All methods failed. API Error:', apiError);
        
        // Provide helpful error message
        let errorMessage = 'Unable to load comments. ';
        if (apiError) {
          if (apiError.code === 10) {
            errorMessage += 'Permission denied. You may need to request "instagram_business_manage_comments" permission for full comment access.';
          } else if (apiError.code === 100) {
            errorMessage += 'Invalid parameter. The post may not support comment access.';
          } else {
            errorMessage += `API Error: ${apiError.message}`;
          }
        } else {
          errorMessage += 'Please check your Instagram API permissions in Facebook Developer Console.';
        }
        
        alert(errorMessage);
        setComments(prev => ({ ...prev, [postId]: [] }));
      }
      
    } catch (error) {
      console.error('Error loading comments:', error);
      alert(`Error loading comments: ${error.message}`);
      setComments(prev => ({ ...prev, [postId]: [] }));
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
    localStorage.clear();
    window.FB.logout();
  };

  const calculateMetrics = () => {
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const avgLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
    const totalPostComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    
    return { totalPosts, totalLikes, avgLikes, totalPostComments };
  };

  const metrics = calculateMetrics();

  if (!user) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1>Instagram Sentiment Analysis</h1>
              <p>Connect your Instagram Business Account to analyze sentiment and engagement</p>
            </div>
            <button onClick={loginWithFacebook} className="facebook-login-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Connect with Facebook
            </button>
            <div className="permissions-note">
              <p><small>This app requires Instagram comment permissions. Make sure you have approved the necessary permissions in your Facebook Developer Console.</small></p>
            </div>
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
              <div className="metric-icon">💬</div>
              <div className="metric-content">
                <div className="metric-value">{totalComments}</div>
                <div className="metric-label">Analyzed Comments</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <div className="metric-value">{metrics.avgLikes}</div>
                <div className="metric-label">Avg Likes/Post</div>
              </div>
            </div>
          </div>
        </div>

        <div className="posts-section">
          <div className="section-header">
            <h2>Post Analysis</h2>
            <p>Analyze sentiment and engagement for your Instagram posts</p>
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your Instagram posts...</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map(post => (
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
                  
                  <div className="post-actions">
                    <button 
                      onClick={() => loadComments(post.id)}
                      className={`analyze-btn ${loadingComments[post.id] ? 'loading' : ''}`}
                      disabled={loadingComments[post.id]}
                    >
                      {loadingComments[post.id] ? (
                        <>
                          <div className="btn-spinner"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">🔍</span>
                          Load Comments
                        </>
                      )}
                    </button>
                    
                    <a 
                      href={post.permalink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-post-btn"
                    >
                      View Post
                    </a>
                  </div>

                  {comments[post.id] && Array.isArray(comments[post.id]) && (
                    <div className="comments-section">
                      <div className="comments-header">
                        <h4>Comments Analysis</h4>
                        <span className="comments-count">
                          {comments[post.id].length} comment{comments[post.id].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {comments[post.id].length > 0 ? (
                        <div className="comments-list">
                          {comments[post.id].slice(0, 5).map(comment => (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-header">
                                <span className="comment-username">
                                  @{comment.from?.username || comment.username || 'user'}
                                </span>
                                <span className="comment-likes">
                                  ❤️ {comment.like_count || 0}
                                </span>
                              </div>
                              <p className="comment-text">{comment.text}</p>
                            </div>
                          ))}
                          
                          {comments[post.id].length > 5 && (
                            <div className="comments-more">
                              +{comments[post.id].length - 5} more comments
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-comments">
                          <p>No comments found for this post</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by <strong>Open Paws AI</strong></p>
      </footer>
    </div>
  );
}

export default App;
