import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';

function App() {
  const [user, setUser] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState({});

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

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  // Login with Facebook
  const login = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        loadUserData();
      }
    }, { scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments' });
  };

  // Load user and page data
  const loadUserData = () => {
    window.FB.api('/me', { fields: 'name' }, (userResponse) => {
      setUser(userResponse);
      
      window.FB.api('/me/accounts', { fields: 'name,access_token,instagram_business_account' }, (pagesResponse) => {
        const instagramPages = pagesResponse.data.filter(page => page.instagram_business_account);
        if (instagramPages.length > 0) {
          const page = instagramPages[0];
          setSelectedPage(page);
          loadPosts(page);
        }
      });
    });
  };

  // Load Instagram posts
  const loadPosts = (page) => {
    const url = `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_url,permalink,like_count,comments_count,timestamp&access_token=${page.access_token}&limit=10`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.data) {
          setPosts(data.data);
          console.log(`Loaded ${data.data.length} posts`);
        }
      })
      .catch(error => console.error('Error loading posts:', error));
  };

  // Load ALL comments for a post with proper pagination
  const loadAllComments = async (postId) => {
    if (loading[postId] || comments[postId]) return;
    
    setLoading(prev => ({ ...prev, [postId]: true }));
    console.log(`Starting to load comments for post: ${postId}`);
    
    try {
      let allComments = [];
      let url = `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp&access_token=${selectedPage.access_token}&limit=50`;
      let pageCount = 0;
      
      while (url && pageCount < 20) { // Safety limit
        pageCount++;
        console.log(`Fetching page ${pageCount}: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          break;
        }
        
        if (data.data && data.data.length > 0) {
          allComments = [...allComments, ...data.data];
          console.log(`Page ${pageCount}: Got ${data.data.length} comments. Total: ${allComments.length}`);
          
          // Get next page URL
          url = data.paging && data.paging.next ? data.paging.next : null;
        } else {
          console.log(`Page ${pageCount}: No more comments`);
          break;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`FINISHED: Loaded ${allComments.length} total comments for post ${postId}`);
      setComments(prev => ({ ...prev, [postId]: allComments }));
      
    } catch (error) {
      console.error('Error loading comments:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Calculate total comments loaded
  const totalCommentsLoaded = Object.values(comments).reduce((sum, postComments) => sum + postComments.length, 0);

  if (!user) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h1>Instagram Comment Analyzer</h1>
        <p>Analyze comments from your Instagram business account</p>
        <button 
          onClick={login}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Login with Facebook
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
        <h1>Instagram Comment Analyzer</h1>
        <p>Connected as: <strong>{user.name}</strong></p>
        <p>Instagram Account: <strong>{selectedPage?.name}</strong></p>
        <p>Total Comments Loaded: <strong>{totalCommentsLoaded}</strong></p>
      </header>

      <div>
        <h2>Posts ({posts.length})</h2>
        {posts.map(post => (
          <div key={post.id} style={{ 
            border: '1px solid #ddd', 
            margin: '20px 0', 
            padding: '20px', 
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <strong>Post from {new Date(post.timestamp).toLocaleDateString()}</strong>
              <br />
              <span>❤️ {post.like_count || 0} likes • 💬 {post.comments_count || 0} comments</span>
            </div>
            
            {post.media_url && (
              <img 
                src={post.media_url} 
                alt="Post" 
                style={{ maxWidth: '300px', height: 'auto', marginBottom: '15px' }}
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            
            <p style={{ marginBottom: '15px', fontStyle: 'italic' }}>
              {post.caption ? post.caption.substring(0, 200) + '...' : 'No caption'}
            </p>
            
            <button
              onClick={() => loadAllComments(post.id)}
              disabled={loading[post.id]}
              style={{
                padding: '10px 20px',
                backgroundColor: loading[post.id] ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading[post.id] ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {loading[post.id] ? 'Loading Comments...' : 'Load All Comments'}
            </button>
            
            <a 
              href={post.permalink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#1877f2', textDecoration: 'none' }}
            >
              View on Instagram →
            </a>
            
            {comments[post.id] && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
                <h4>Comments Loaded: {comments[post.id].length}</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {comments[post.id].slice(0, 10).map(comment => (
                    <div key={comment.id} style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #eee',
                      marginBottom: '10px'
                    }}>
                      <strong>@{comment.username}</strong>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>{comment.text}</p>
                      <small style={{ color: '#666' }}>
                        ❤️ {comment.like_count} • {new Date(comment.timestamp).toLocaleDateString()}
                      </small>
                    </div>
                  ))}
                  {comments[post.id].length > 10 && (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                      Showing first 10 of {comments[post.id].length} comments
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
