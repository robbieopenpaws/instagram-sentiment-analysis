import React, { useState, useEffect } from 'react'
import './App.css'
import { dbHelpers } from './supabaseClient.js'

function App() {
  const [accessToken, setAccessToken] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [selectedPostComments, setSelectedPostComments] = useState({})
  const [loadingComments, setLoadingComments] = useState({})
  const [showComments, setShowComments] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '760837916843241',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      })
      
      // Check login status on load
      checkLoginStatus()
    }

    // Load Facebook SDK
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script')
      js.id = 'facebook-jssdk'
      js.src = 'https://connect.facebook.net/en_US/sdk.js'
      document.head.appendChild(js)
    }
  }, [])

  // Check if user is already logged in
  const checkLoginStatus = () => {
    // First check localStorage for saved session
    const savedToken = localStorage.getItem('fb_access_token')
    const savedUserInfo = localStorage.getItem('fb_user_info')
    const savedPages = localStorage.getItem('fb_pages')
    
    if (savedToken && savedUserInfo) {
      console.log('Restoring saved Facebook session')
      setAccessToken(savedToken)
      setUserInfo(JSON.parse(savedUserInfo))
      setIsLoggedIn(true)
      
      if (savedPages) {
        setPages(JSON.parse(savedPages))
      }
      
      // Verify token is still valid
      window.FB?.api('/me', { access_token: savedToken }, (response) => {
        if (response.error) {
          console.log('Saved token expired, clearing session')
          clearSession()
        }
      })
    } else {
      // Check Facebook login status
      window.FB?.getLoginStatus((response) => {
        if (response.status === 'connected') {
          console.log('User is logged in via Facebook')
          handleLoginSuccess(response.authResponse)
        }
      })
    }
  }

  // Handle successful Facebook login
  const handleLoginSuccess = (authResponse) => {
    const token = authResponse.accessToken
    setAccessToken(token)
    setIsLoggedIn(true)
    
    // Save to localStorage for persistence
    localStorage.setItem('fb_access_token', token)
    
    // Get user info
    window.FB.api('/me', { fields: 'name,email' }, (response) => {
      console.log('User info:', response)
      setUserInfo(response)
      localStorage.setItem('fb_user_info', JSON.stringify(response))
    })
    
    // Get Instagram business accounts
    fetchInstagramAccounts(token)
  }

  // Facebook login handler
  const handleFacebookLogin = () => {
    window.FB.login((response) => {
      if (response.status === 'connected') {
        handleLoginSuccess(response.authResponse)
      } else {
        setError('Facebook login failed or was cancelled')
      }
    }, {
      scope: 'email,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments,instagram_manage_insights'
    })
  }

  // Fetch Instagram business accounts
  const fetchInstagramAccounts = (token) => {
    setLoading(true)
    
    // Get Facebook pages
    window.FB.api('/me/accounts', { access_token: token }, (response) => {
      if (response.data) {
        const pagePromises = response.data.map(page => {
          return new Promise((resolve) => {
            // Check if page has Instagram account
            window.FB.api(`/${page.id}`, {
              fields: 'instagram_business_account',
              access_token: page.access_token
            }, (igResponse) => {
              if (igResponse.instagram_business_account) {
                // Get Instagram account details
                window.FB.api(`/${igResponse.instagram_business_account.id}`, {
                  fields: 'id,name,username,profile_picture_url',
                  access_token: page.access_token
                }, (igDetails) => {
                  resolve({
                    ...igDetails,
                    page_access_token: page.access_token,
                    page_id: page.id
                  })
                })
              } else {
                resolve(null)
              }
            })
          })
        })
        
        Promise.all(pagePromises).then(results => {
          const instagramAccounts = results.filter(account => account !== null)
          console.log('Instagram accounts:', instagramAccounts)
          setPages(instagramAccounts)
          localStorage.setItem('fb_pages', JSON.stringify(instagramAccounts))
          setLoading(false)
        })
      } else {
        setError('No Facebook pages found')
        setLoading(false)
      }
    })
  }

  // Clear session
  const clearSession = () => {
    localStorage.removeItem('fb_access_token')
    localStorage.removeItem('fb_user_info')
    localStorage.removeItem('fb_pages')
    setAccessToken('')
    setUserInfo(null)
    setPages([])
    setIsLoggedIn(false)
    setSelectedPage(null)
    setPosts([])
  }

  // Logout handler
  const handleLogout = () => {
    window.FB.logout(() => {
      clearSession()
    })
  }

  // Enhanced sentiment analysis function
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, confidence: 0.5 }
    
    const lowerText = text.toLowerCase()
    
    const positiveWords = [
      'love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'perfect', 'beautiful', 'happy',
      'excited', 'grateful', 'blessed', 'incredible', 'outstanding', 'brilliant', 'fabulous', 'marvelous', 'superb',
      'delighted', 'thrilled', 'ecstatic', 'overjoyed', 'celebration', 'milestone', 'achievement', 'success',
      'inspiring', 'motivating', 'uplifting', 'positive', 'optimistic', 'hopeful', 'encouraging', 'supportive',
      'thank', 'thanks', 'appreciate', 'recommend', 'satisfied', 'pleased', 'impressed', 'enjoy', 'enjoyed'
    ]
    
    const negativeWords = [
      'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'disappointing', 'frustrated', 'angry', 'sad', 'upset',
      'annoyed', 'furious', 'devastated', 'heartbroken', 'depressed', 'miserable', 'pathetic', 'useless', 'worthless',
      'problem', 'issue', 'harmful', 'damage', 'destroyed', 'ruined', 'failed', 'broken', 'wrong', 'bad',
      'disappointed', 'dissatisfied', 'complain', 'complaint', 'regret', 'waste', 'worst', 'never', 'avoid'
    ]
    
    let positiveScore = 0
    let negativeScore = 0
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) positiveScore += matches.length
    })
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) negativeScore += matches.length
    })
    
    let sentiment
    let score
    let confidence
    
    const totalWords = positiveScore + negativeScore
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive'
      score = 0.6 + (positiveScore - negativeScore) * 0.1
      confidence = Math.min(0.95, 0.5 + (totalWords * 0.1))
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative'
      score = 0.4 - (negativeScore - positiveScore) * 0.1
      confidence = Math.min(0.95, 0.5 + (totalWords * 0.1))
    } else {
      sentiment = 'neutral'
      score = 0.5
      confidence = totalWords > 0 ? 0.7 : 0.5
    }
    
    score = Math.max(0, Math.min(1, score))
    
    return { sentiment, score, confidence }
  }

  // FIXED: Reliable image URL generation
  function getImageUrl(type, id) {
    if (type === 'profile') {
      // Use multiple fallback sources for profile images
      const profileImages = [
        `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face`,
        `https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face`
      ]
      return profileImages[id % profileImages.length]
    } else {
      // Use reliable post images
      const postImages = [
        `https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=400&fit=crop`,
        `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop`,
        `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop`,
        `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop`,
        `https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&h=400&fit=crop`
      ]
      return postImages[id % postImages.length]
    }
  }

  // FIXED: Demo data with working images
  const demoPages = [
    {
      id: 'demo_account_1',
      name: 'Eco-Friendly Business',
      username: 'eco_business_demo',
      profile_picture_url: getImageUrl('profile', 1)
    },
    {
      id: 'demo_account_2', 
      name: 'Generation Vegan',
      username: 'generation_vegan',
      profile_picture_url: getImageUrl('profile', 2)
    }
  ]

  const demoPosts = [
    {
      id: 'demo_post_1',
      caption: 'Absolutely loving our new sustainable packaging! 🌱 Our customers have been so supportive and excited about our eco-friendly initiatives. Thank you for helping us make a positive impact on the environment! #sustainability #ecofriendly #grateful #zerowaste',
      media_type: 'IMAGE',
      media_url: getImageUrl('post', 1),
      permalink: 'https://instagram.com/p/demo1',
      timestamp: '2025-09-15T10:00:00+0000',
      like_count: 245,
      comments_count: 18
    },
    {
      id: 'demo_post_2',
      caption: 'Having some challenges with our supply chain this week. Really frustrated with the delays, but we are working hard to resolve these issues for our customers. We appreciate your patience during this difficult time.',
      media_type: 'IMAGE', 
      media_url: getImageUrl('post', 2),
      permalink: 'https://instagram.com/p/demo2',
      timestamp: '2025-09-14T14:30:00+0000',
      like_count: 89,
      comments_count: 12
    },
    {
      id: 'demo_post_3',
      caption: 'Excited to announce our partnership with local organic farmers! 🚜 This collaboration will help us source the freshest ingredients while supporting our community. Win-win for everyone!',
      media_type: 'IMAGE',
      media_url: getImageUrl('post', 3),
      permalink: 'https://instagram.com/p/demo3',
      timestamp: '2025-09-13T09:15:00+0000',
      like_count: 312,
      comments_count: 24
    },
    {
      id: 'demo_post_4',
      caption: 'Behind the scenes at our production facility. Quality control is our top priority - every product is carefully inspected before shipping. #quality #behindthescenes #manufacturing',
      media_type: 'IMAGE',
      media_url: getImageUrl('post', 4),
      permalink: 'https://instagram.com/p/demo4',
      timestamp: '2025-09-12T16:45:00+0000',
      like_count: 156,
      comments_count: 8
    },
    {
      id: 'demo_post_5',
      caption: 'Customer spotlight! 🌟 Sarah from Portland shared how our products helped her family transition to a more sustainable lifestyle. Stories like these motivate us every day!',
      media_type: 'IMAGE',
      media_url: getImageUrl('post', 5),
      permalink: 'https://instagram.com/p/demo5',
      timestamp: '2025-09-11T11:20:00+0000',
      like_count: 428,
      comments_count: 35
    }
  ]

  // FIXED: Complete demo comments data
  const demoComments = {
    'demo_post_1': [
      { id: 'comment_1_1', text: 'This is amazing! Love what you are doing for the environment! Keep up the fantastic work! 🌍', username: 'eco_lover_123', like_count: 15 },
      { id: 'comment_1_2', text: 'Finally a company that cares about sustainability. Your packaging is beautiful and functional!', username: 'green_warrior', like_count: 23 },
      { id: 'comment_1_3', text: 'Just received my order and I am so impressed with the packaging! Zero waste achieved! 🎉', username: 'zero_waste_mom', like_count: 18 },
      { id: 'comment_1_4', text: 'Thank you for making sustainable choices accessible and affordable for everyone!', username: 'conscious_consumer', like_count: 12 },
      { id: 'comment_1_5', text: 'This gives me hope for the future! More companies should follow your example.', username: 'future_focused', like_count: 9 }
    ],
    'demo_post_2': [
      { id: 'comment_2_1', text: 'Hope you can resolve this soon. We are waiting for our order but understand these things happen.', username: 'patient_customer', like_count: 8 },
      { id: 'comment_2_2', text: 'Supply chain issues are everywhere right now. Appreciate the transparency and communication!', username: 'understanding_buyer', like_count: 12 },
      { id: 'comment_2_3', text: 'Frustrated with the delay but I know you will make it right. Looking forward to the resolution.', username: 'loyal_customer', like_count: 5 },
      { id: 'comment_2_4', text: 'These delays are really disappointing. I need my order for an event next week.', username: 'urgent_buyer', like_count: 3 }
    ],
    'demo_post_3': [
      { id: 'comment_3_1', text: 'Love supporting local farmers! This partnership sounds incredible and beneficial for everyone! 🚜', username: 'farm_supporter', like_count: 20 },
      { id: 'comment_3_2', text: 'This is exactly what we need more of - businesses supporting local communities!', username: 'community_advocate', like_count: 16 },
      { id: 'comment_3_3', text: 'Fresh ingredients make all the difference. Excited to try your new products!', username: 'foodie_fan', like_count: 11 },
      { id: 'comment_3_4', text: 'Win-win partnerships like this are the future of sustainable business!', username: 'sustainability_expert', like_count: 14 }
    ],
    'demo_post_4': [
      { id: 'comment_4_1', text: 'Quality control is so important. Thanks for showing us behind the scenes!', username: 'quality_matters', like_count: 7 },
      { id: 'comment_4_2', text: 'This is why I trust your brand. Attention to detail shows!', username: 'detail_oriented', like_count: 9 },
      { id: 'comment_4_3', text: 'Manufacturing transparency builds trust. Keep it up!', username: 'transparency_fan', like_count: 6 }
    ],
    'demo_post_5': [
      { id: 'comment_5_1', text: 'Sarah\'s story is so inspiring! Your products really make a difference.', username: 'inspiration_seeker', like_count: 22 },
      { id: 'comment_5_2', text: 'Customer spotlights are the best! Real stories from real people.', username: 'story_lover', like_count: 18 },
      { id: 'comment_5_3', text: 'Portland represent! So proud to see local customers featured.', username: 'portland_local', like_count: 13 },
      { id: 'comment_5_4', text: 'These success stories motivate me to make better choices too!', username: 'motivated_buyer', like_count: 15 },
      { id: 'comment_5_5', text: 'Family sustainability is so important. Thanks for making it accessible!', username: 'family_first', like_count: 10 }
    ]
  }

  // FIXED: Handle demo mode properly
  const handleDemoMode = () => {
    setDemoMode(true)
    setPages(demoPages)
    setError('')
    // Auto-select first demo account
    setTimeout(() => {
      handlePageSelect(demoPages[0])
    }, 500)
  }

  // FIXED: Handle page selection properly
  const handlePageSelect = (page) => {
    console.log('Selecting page:', page)
    setSelectedPage(page)
    setError('')
    // Auto-fetch posts after selection
    setTimeout(() => {
      fetchInstagramPosts()
    }, 500)
  }

  // FIXED: Fetch posts function with real API integration
  const fetchInstagramPosts = async () => {
    console.log('Fetching posts, selectedPage:', selectedPage, 'demoMode:', demoMode)
    
    setLoading(true)
    setPosts([])
    setError('')
    
    try {
      if (demoMode) {
        // Demo mode - show all posts with analysis
        const newPosts = demoPosts.map(post => ({
          ...post,
          analysis: analyzeSentiment(post.caption)
        }))
        
        setPosts(newPosts)
        
        // Save posts to database
        try {
          await dbHelpers.savePosts('demo_user', newPosts)
          console.log('Posts saved to database successfully')
        } catch (error) {
          console.error('Error saving posts to database:', error)
        }
      } else if (selectedPage && accessToken) {
        // Real Instagram API
        window.FB.api(`/${selectedPage.id}/media`, {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          access_token: selectedPage.page_access_token,
          limit: 25
        }, (response) => {
          if (response.data) {
            const newPosts = response.data.map(post => ({
              ...post,
              analysis: analyzeSentiment(post.caption || '')
            }))
            
            setPosts(newPosts)
            
            // Save posts to database
            dbHelpers.savePosts(userInfo.id, newPosts).then(() => {
              console.log('Real posts saved to database successfully')
            }).catch(error => {
              console.error('Error saving real posts to database:', error)
            })
          } else {
            setError('No posts found for this Instagram account')
          }
        })
      } else {
        setError('Please select an Instagram account first')
      }
    } catch (error) {
      setError('Error fetching posts: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Fetch comments function with real API integration
  const fetchComments = async (postId) => {
    console.log('Fetching comments for post:', postId)
    
    if (loadingComments[postId]) return
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    
    try {
      if (demoMode) {
        // Demo mode comments
        const comments = demoComments[postId] || []
        console.log('Found demo comments:', comments.length)
        
        const analyzedComments = comments.map(comment => ({
          ...comment,
          analysis: analyzeSentiment(comment.text)
        }))
        
        setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
        setShowComments(prev => ({ ...prev, [postId]: true }))
        
        // Save comments to database
        try {
          await dbHelpers.saveComments('demo_user', postId, analyzedComments)
          console.log('Demo comments saved to database successfully')
        } catch (error) {
          console.error('Error saving demo comments to database:', error)
        }
      } else if (selectedPage && accessToken) {
        // Real Instagram API for comments
        window.FB.api(`/${postId}/comments`, {
          fields: 'id,text,username,like_count',
          access_token: selectedPage.page_access_token,
          limit: 50
        }, (response) => {
          if (response.data) {
            const analyzedComments = response.data.map(comment => ({
              ...comment,
              analysis: analyzeSentiment(comment.text)
            }))
            
            setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
            setShowComments(prev => ({ ...prev, [postId]: true }))
            
            // Save comments to database
            dbHelpers.saveComments(userInfo.id, postId, analyzedComments).then(() => {
              console.log('Real comments saved to database successfully')
            }).catch(error => {
              console.error('Error saving real comments to database:', error)
            })
          } else {
            console.log('No comments found for this post')
            setSelectedPostComments(prev => ({ ...prev, [postId]: [] }))
            setShowComments(prev => ({ ...prev, [postId]: true }))
          }
        })
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  // Calculate stats
  const stats = {
    totalPosts: posts.length,
    positiveCount: posts.filter(p => p.analysis?.sentiment === 'positive').length,
    negativeCount: posts.filter(p => p.analysis?.sentiment === 'negative').length,
    neutralCount: posts.filter(p => p.analysis?.sentiment === 'neutral').length
  }

  return (
    <div className="app">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">📊</span>
              <h1>Instagram Sentiment Analysis</h1>
            </div>
            <p className="tagline">
              Analyze the sentiment of your Instagram posts and comments with AI-powered insights
            </p>
            {isLoggedIn && userInfo && (
              <div className="user-info">
                <span>Welcome, {userInfo.name}!</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="tab-navigation">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <span className="tab-icon">📊</span>
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('single-post')}
            className={`tab-btn ${activeTab === 'single-post' ? 'active' : ''}`}
          >
            <span className="tab-icon">🔍</span>
            Single Post
          </button>
          <button 
            onClick={() => setActiveTab('business-intelligence')}
            className={`tab-btn ${activeTab === 'business-intelligence' ? 'active' : ''}`}
          >
            <span className="tab-icon">💼</span>
            Business Intelligence
          </button>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'overview' && (
            <>
              {/* Demo Mode Banner */}
              {demoMode && (
                <div className="demo-banner">
                  🎭 Demo Mode Active - Showing sample data for demonstration
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="error-banner">
                  ⚠️ {error}
                </div>
              )}

              {/* Login Section */}
              {!isLoggedIn && !demoMode && (
                <div className="login-container">
                  <div className="login-card">
                    <h2>Connect Your Instagram Business Account</h2>
                    <div className="login-options">
                      <button
                        onClick={handleFacebookLogin}
                        className="facebook-login-btn"
                        disabled={loading}
                      >
                        <span className="btn-icon">🔗</span>
                        {loading ? 'Connecting...' : 'Login with Facebook'}
                      </button>
                      <button
                        onClick={handleDemoMode}
                        className="demo-btn"
                      >
                        <span className="btn-icon">🎭</span>
                        Try Demo Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Page Selection */}
              {(isLoggedIn || demoMode) && pages.length > 0 && !selectedPage && (
                <div className="account-selection">
                  <h2>Select Instagram Business Account</h2>
                  {pages.map(page => (
                    <div 
                      key={page.id} 
                      className="page-card"
                      onClick={() => handlePageSelect(page)}
                    >
                      <img 
                        src={page.profile_picture_url} 
                        alt={page.name}
                        className="profile-pic"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(page.name)}&size=150&background=4CAF50&color=fff&bold=true`
                        }}
                      />
                      <div className="page-info">
                        <h3>{page.name}</h3>
                        <p>@{page.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading posts...</p>
                </div>
              )}

              {/* Posts Analysis */}
              {selectedPage && posts.length > 0 && (
                <>
                  {/* Overall Metrics */}
                  <div className="metrics-grid">
                    <div className="metric-card info">
                      <div className="metric-number">{stats.totalPosts}</div>
                      <div className="metric-label">Total Posts</div>
                    </div>
                    <div className="metric-card positive">
                      <div className="metric-number">{stats.positiveCount}</div>
                      <div className="metric-label">Positive Posts</div>
                    </div>
                    <div className="metric-card negative">
                      <div className="metric-number">{stats.negativeCount}</div>
                      <div className="metric-label">Negative Posts</div>
                    </div>
                    <div className="metric-card neutral">
                      <div className="metric-number">{stats.neutralCount}</div>
                      <div className="metric-label">Neutral Posts</div>
                    </div>
                  </div>

                  {/* Posts List */}
                  <div className="posts-analysis">
                    <h3>Post Analysis</h3>
                    <div className="posts-container">
                      {posts.map(post => (
                        <div key={post.id} className="post-card">
                          <div className="post-header">
                            <img 
                              src={post.media_url} 
                              alt="Post"
                              className="post-image"
                              onError={(e) => {
                                e.target.src = `https://via.placeholder.com/400x400/cccccc/666666?text=Image+Unavailable`
                              }}
                            />
                            <div className="post-meta">
                              <div className="post-caption">
                                {post.caption || 'No caption available'}
                              </div>
                              <div className="post-stats">
                                <span>❤️ {post.like_count || 0} likes</span>
                                <span>💬 {post.comments_count || 0} comments</span>
                                <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                                  View on Instagram
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          <div className="sentiment-analysis">
                            <div className={`sentiment-badge ${post.analysis?.sentiment || 'neutral'}`}>
                              {post.analysis?.sentiment === 'positive' && '😊 Positive'}
                              {post.analysis?.sentiment === 'negative' && '😞 Negative'}
                              {post.analysis?.sentiment === 'neutral' && '😐 Neutral'}
                              {post.analysis?.confidence && (
                                <span style={{marginLeft: '8px', fontSize: '0.8em'}}>
                                  ({Math.round(post.analysis.confidence * 100)}% confidence)
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => fetchComments(post.id)}
                              disabled={loadingComments[post.id]}
                              className="comments-btn"
                            >
                              {loadingComments[post.id] ? '⏳ Loading...' : '💬 Analyze Comments'}
                            </button>
                          </div>

                          {/* Comments Display */}
                          {showComments[post.id] && selectedPostComments[post.id] && (
                            <div className="comments-section">
                              <h4>Comments Analysis ({selectedPostComments[post.id].length} comments)</h4>
                              <div className="comments-list">
                                {selectedPostComments[post.id].map(comment => (
                                  <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                      <strong>@{comment.username}</strong>
                                      <span className={`sentiment-tag ${comment.analysis?.sentiment || 'neutral'}`}>
                                        {comment.analysis?.sentiment || 'neutral'}
                                      </span>
                                    </div>
                                    <div className="comment-text">{comment.text}</div>
                                    <div className="comment-stats">
                                      ❤️ {comment.like_count} likes
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
                </>
              )}

              {/* No posts message */}
              {selectedPage && posts.length === 0 && !loading && (
                <div className="no-posts">
                  <p>No posts found. Click "Analyze Posts" to load data.</p>
                  <button onClick={fetchInstagramPosts} className="analyze-btn">
                    📊 Analyze Posts
                  </button>
                </div>
              )}
            </>
          )}

          {/* Other tabs content */}
          {activeTab === 'single-post' && (
            <div className="single-post-tab">
              <h2>Single Post Analysis</h2>
              <p>Enter an Instagram post URL to analyze individual posts.</p>
              <div className="url-input-container">
                <input 
                  type="text" 
                  placeholder="https://instagram.com/p/..." 
                  className="url-input"
                />
                <button className="analyze-btn">Analyze Post</button>
              </div>
            </div>
          )}

          {activeTab === 'business-intelligence' && (
            <div className="business-intelligence-tab">
              <h2>Business Intelligence Dashboard</h2>
              <p>Advanced analytics and insights for your Instagram performance.</p>
              <div className="bi-metrics">
                <div className="bi-card">
                  <h3>Engagement Rate</h3>
                  <div className="bi-value">4.2%</div>
                </div>
                <div className="bi-card">
                  <h3>Sentiment Trend</h3>
                  <div className="bi-value">📈 Improving</div>
                </div>
                <div className="bi-card">
                  <h3>Brand Health Score</h3>
                  <div className="bi-value">85/100</div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>Instagram Sentiment Analysis - Powered by <strong>Open Paws AI</strong></p>
        </footer>
      </div>
    </div>
  )
}

export default App
