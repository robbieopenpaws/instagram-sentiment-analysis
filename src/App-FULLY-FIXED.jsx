import React, { useState, useEffect } from 'react'
import './App.css'
import { dbHelpers } from './supabaseClient'

function App() {
  // State management
  const [userInfo, setUserInfo] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [posts, setPosts] = useState([])
  const [selectedPostComments, setSelectedPostComments] = useState({})
  const [showComments, setShowComments] = useState({})
  const [loadingComments, setLoadingComments] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [demoMode, setDemoMode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize Facebook SDK
  useEffect(() => {
    const initFacebookSDK = () => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '760837916843241',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        })
        
        console.log('Checking login status and restoring session...')
        checkLoginAndRestoreSession()
      }

      // Load Facebook SDK
      if (!document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script')
        js.id = 'facebook-jssdk'
        js.src = 'https://connect.facebook.net/en_US/sdk.js'
        document.head.appendChild(js)
      }
    }

    initFacebookSDK()
  }, [])

  // Check login status and restore session
  const checkLoginAndRestoreSession = () => {
    const savedSession = localStorage.getItem('facebook_session')
    if (savedSession) {
      try {
        console.log('Found saved Facebook session, validating...')
        const sessionData = JSON.parse(savedSession)
        
        // Validate token with Facebook
        window.FB.api('/me', { access_token: sessionData.accessToken }, (response) => {
          if (response && !response.error) {
            console.log('Token validated successfully')
            setUserInfo(sessionData.userInfo)
            setAccessToken(sessionData.accessToken)
            setPages(sessionData.pages || [])
            
            if (sessionData.selectedPage) {
              console.log('Restored selected page:', sessionData.selectedPage.name)
              setSelectedPage(sessionData.selectedPage)
              
              if (sessionData.posts && sessionData.posts.length > 0) {
                console.log('Restored posts:', sessionData.posts.length)
                setPosts(sessionData.posts)
              } else {
                fetchInstagramPosts(sessionData.selectedPage, sessionData.accessToken)
              }
            }
          } else {
            console.log('Token invalid, clearing session')
            localStorage.removeItem('facebook_session')
          }
        })
      } catch (error) {
        console.error('Error restoring session:', error)
        localStorage.removeItem('facebook_session')
      }
    }
  }

  // Enhanced Facebook login
  const loginWithFacebook = () => {
    setError('')
    setLoading(true)
    
    window.FB.login((response) => {
      if (response.authResponse) {
        const { accessToken, userID } = response.authResponse
        setAccessToken(accessToken)
        
        // Get user info
        window.FB.api('/me', { fields: 'name,email' }, (userResponse) => {
          if (userResponse && !userResponse.error) {
            const userData = {
              id: userID,
              name: userResponse.name,
              email: userResponse.email
            }
            setUserInfo(userData)
            
            // Get user's Facebook pages
            window.FB.api('/me/accounts', { access_token: accessToken }, (pagesResponse) => {
              if (pagesResponse && pagesResponse.data) {
                setPages(pagesResponse.data)
                setLoading(false)
              }
            })
          }
        })
      } else {
        setError('Facebook login failed')
        setLoading(false)
      }
    }, {
      scope: 'email,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments,instagram_manage_insights'
    })
  }

  // Enhanced Instagram posts fetching with pagination and image handling
  const fetchInstagramPosts = async (page, token) => {
    setLoading(true)
    setError('')
    
    try {
      console.log('Fetching Instagram posts for page:', page.name)
      
      // Get Instagram account connected to the page
      const instagramResponse = await new Promise((resolve, reject) => {
        window.FB.api(`/${page.id}`, {
          fields: 'instagram_business_account',
          access_token: page.access_token
        }, (response) => {
          if (response.error) {
            reject(response.error)
          } else {
            resolve(response)
          }
        })
      })

      if (!instagramResponse.instagram_business_account) {
        throw new Error('No Instagram business account connected to this page')
      }

      const instagramAccountId = instagramResponse.instagram_business_account.id
      console.log('Instagram account ID:', instagramAccountId)

      // Fetch posts with pagination - get up to 100 posts
      let allPosts = []
      let nextUrl = null
      let fetchCount = 0
      const maxFetches = 4 // Fetch 4 batches of 25 = 100 posts

      do {
        const postsResponse = await new Promise((resolve, reject) => {
          const apiCall = nextUrl || `/${instagramAccountId}/media`
          const params = nextUrl ? {} : {
            fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,thumbnail_url',
            access_token: page.access_token,
            limit: 25
          }

          window.FB.api(apiCall, params, (response) => {
            if (response.error) {
              reject(response.error)
            } else {
              resolve(response)
            }
          })
        })

        if (postsResponse.data && postsResponse.data.length > 0) {
          // Process posts with proper image URLs
          const processedPosts = postsResponse.data.map(post => {
            // Use thumbnail_url for videos, media_url for images
            const imageUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url
            
            return {
              ...post,
              media_url: imageUrl, // Ensure we have a valid image URL
              analysis: analyzeSentiment(post.caption || ''),
              keywords: extractKeywords(post.caption || ''),
              topics: extractTopics(post.caption || '')
            }
          })

          allPosts = [...allPosts, ...processedPosts]
          nextUrl = postsResponse.paging?.next
          fetchCount++
          
          console.log(`Fetched batch ${fetchCount}: ${processedPosts.length} posts (Total: ${allPosts.length})`)
        } else {
          break
        }
      } while (nextUrl && fetchCount < maxFetches)

      console.log(`Total posts fetched: ${allPosts.length}`)
      setPosts(allPosts)

      // Save to database
      try {
        await dbHelpers.savePosts(userInfo.id, allPosts)
        console.log('Posts saved to database successfully')
      } catch (dbError) {
        console.error('Error saving posts to database:', dbError)
      }

      // Save session with posts
      const sessionData = {
        userInfo,
        accessToken: token,
        pages,
        selectedPage: page,
        posts: allPosts
      }
      localStorage.setItem('facebook_session', JSON.stringify(sessionData))

    } catch (error) {
      console.error('Error fetching Instagram posts:', error)
      setError(`Failed to fetch posts: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced comment fetching with better error handling
  const fetchComments = async (postId) => {
    if (loadingComments[postId]) return
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    setError('')
    
    try {
      if (demoMode) {
        console.log('Loading demo comments for post:', postId)
        
        // Enhanced demo comments
        const demoCommentsData = {
          'demo_post_1': [
            { id: 'c1', text: 'This is amazing! Love what you are doing for the environment! 🌍', username: 'eco_lover_123', like_count: 15 },
            { id: 'c2', text: 'Finally a company that cares about sustainability!', username: 'green_warrior', like_count: 23 },
            { id: 'c3', text: 'Just received my order and I am so impressed! Zero waste achieved! 🎉', username: 'zero_waste_mom', like_count: 18 }
          ]
        }
        
        const comments = demoCommentsData[postId] || []
        const analyzedComments = comments.map(comment => ({
          ...comment,
          analysis: analyzeSentiment(comment.text),
          keywords: extractKeywords(comment.text),
          topics: extractTopics(comment.text)
        }))
        
        setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
        setShowComments(prev => ({ ...prev, [postId]: true }))
        
        // Save to database
        await dbHelpers.saveComments('demo_user', postId, analyzedComments)
        
      } else if (selectedPage && accessToken) {
        console.log('Fetching real comments for post:', postId)
        
        // Use HTTPS for Facebook API calls
        const commentsResponse = await fetch(`https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp&access_token=${selectedPage.access_token}&limit=100`)
        
        if (!commentsResponse.ok) {
          throw new Error(`HTTP error! status: ${commentsResponse.status}`)
        }
        
        const commentsData = await commentsResponse.json()
        
        if (commentsData.error) {
          throw new Error(commentsData.error.message)
        }
        
        if (commentsData.data && commentsData.data.length > 0) {
          console.log('Found', commentsData.data.length, 'comments')
          
          const analyzedComments = commentsData.data.map(comment => ({
            ...comment,
            analysis: analyzeSentiment(comment.text || ''),
            keywords: extractKeywords(comment.text || ''),
            topics: extractTopics(comment.text || '')
          }))
          
          setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
          setShowComments(prev => ({ ...prev, [postId]: true }))
          
          // Save to database
          await dbHelpers.saveComments(userInfo.id, postId, analyzedComments)
          console.log('Real comments saved to database successfully')
        } else {
          console.log('No comments found for this post')
          setSelectedPostComments(prev => ({ ...prev, [postId]: [] }))
          setShowComments(prev => ({ ...prev, [postId]: true }))
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError(`Failed to fetch comments: ${error.message}`)
      
      // Show empty comments section on error
      setSelectedPostComments(prev => ({ ...prev, [postId]: [] }))
      setShowComments(prev => ({ ...prev, [postId]: true }))
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  // Enhanced sentiment analysis
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, confidence: 50 }
    
    const positiveWords = ['amazing', 'love', 'great', 'awesome', 'fantastic', 'excellent', 'wonderful', 'perfect', 'beautiful', 'incredible', 'outstanding', 'brilliant', 'superb', 'marvelous', 'spectacular', 'phenomenal', 'terrific', 'fabulous', 'magnificent', 'exceptional']
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'horrible', 'disgusting', 'worst', 'pathetic', 'useless', 'disappointing', 'frustrating', 'annoying', 'ridiculous', 'stupid', 'waste', 'fail', 'disaster', 'nightmare', 'outrageous', 'unacceptable']
    
    const words = text.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++
      if (negativeWords.includes(word)) negativeCount++
    })
    
    const totalSentimentWords = positiveCount + negativeCount
    if (totalSentimentWords === 0) {
      return { sentiment: 'neutral', score: 0.5, confidence: 50 }
    }
    
    const positiveRatio = positiveCount / totalSentimentWords
    const confidence = Math.min(90, (totalSentimentWords / words.length) * 100 + 50)
    
    if (positiveRatio > 0.6) {
      return { sentiment: 'positive', score: 0.7 + (positiveRatio * 0.3), confidence: Math.round(confidence) }
    } else if (positiveRatio < 0.4) {
      return { sentiment: 'negative', score: 0.3 - (positiveRatio * 0.3), confidence: Math.round(confidence) }
    } else {
      return { sentiment: 'neutral', score: 0.5, confidence: Math.round(confidence) }
    }
  }

  // Extract keywords
  const extractKeywords = (text) => {
    if (!text) return []
    const words = text.toLowerCase().split(/\s+/)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']
    return words.filter(word => word.length > 3 && !stopWords.includes(word)).slice(0, 5)
  }

  // Extract topics
  const extractTopics = (text) => {
    if (!text) return []
    const topicKeywords = {
      'sustainability': ['environment', 'eco', 'green', 'sustainable', 'organic', 'natural', 'climate', 'carbon', 'renewable'],
      'health': ['health', 'healthy', 'nutrition', 'wellness', 'fitness', 'medical', 'doctor', 'treatment'],
      'technology': ['tech', 'digital', 'software', 'app', 'online', 'internet', 'computer', 'mobile'],
      'business': ['business', 'company', 'market', 'sales', 'profit', 'revenue', 'customer', 'service'],
      'community': ['community', 'social', 'people', 'family', 'friends', 'together', 'support', 'help']
    }
    
    const lowerText = text.toLowerCase()
    const topics = []
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic)
      }
    })
    
    return topics.slice(0, 3)
  }

  // Demo mode functions
  const enterDemoMode = () => {
    setDemoMode(true)
    setUserInfo({ id: 'demo_user', name: 'Demo User', email: 'demo@example.com' })
    setSelectedPage({ id: 'demo_page', name: 'Eco-Friendly Business', access_token: 'demo_token' })
    
    // Enhanced demo posts with proper image URLs
    const demoPosts = [
      {
        id: 'demo_post_1',
        caption: 'Excited to announce our new sustainable packaging initiative! 🌱 Every order now ships in 100% recyclable materials. Small changes, big impact! #Sustainability #EcoFriendly #ZeroWaste',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
        permalink: 'https://instagram.com/p/demo1',
        timestamp: '2025-09-15T10:30:00+0000',
        like_count: 245,
        comments_count: 18,
        analysis: { sentiment: 'positive', score: 0.85, confidence: 92 }
      },
      {
        id: 'demo_post_2',
        caption: 'Update on recent supply chain delays: We are working around the clock to resolve shipping issues. Thank you for your patience as we navigate these challenges. Your orders matter to us! 📦',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400',
        permalink: 'https://instagram.com/p/demo2',
        timestamp: '2025-09-14T14:20:00+0000',
        like_count: 89,
        comments_count: 12,
        analysis: { sentiment: 'neutral', score: 0.45, confidence: 78 }
      },
      {
        id: 'demo_post_3',
        caption: 'Behind the scenes: Our partnership with local farmers ensures fresh, organic ingredients in every product. Supporting local communities while delivering quality! 🚜🌾 #LocalPartnership #OrganicFarming',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400',
        permalink: 'https://instagram.com/p/demo3',
        timestamp: '2025-09-13T09:15:00+0000',
        like_count: 156,
        comments_count: 24,
        analysis: { sentiment: 'positive', score: 0.78, confidence: 85 }
      },
      {
        id: 'demo_post_4',
        caption: 'Quality control in action! Our team inspects every batch to ensure you receive the best products. No compromises on quality, ever. 🔍✅ #QualityControl #BehindTheScenes',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
        permalink: 'https://instagram.com/p/demo4',
        timestamp: '2025-09-12T16:45:00+0000',
        like_count: 78,
        comments_count: 8,
        analysis: { sentiment: 'neutral', score: 0.65, confidence: 72 }
      },
      {
        id: 'demo_post_5',
        caption: 'Customer spotlight: Sarah from Portland reduced her family\'s waste by 80% using our products! Stories like these inspire us every day. What\'s your sustainability win? 🌟 #CustomerSpotlight #SustainabilityWins',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        permalink: 'https://instagram.com/p/demo5',
        timestamp: '2025-09-11T11:20:00+0000',
        like_count: 198,
        comments_count: 31,
        analysis: { sentiment: 'positive', score: 0.88, confidence: 94 }
      }
    ]
    
    setPosts(demoPosts)
  }

  const exitDemoMode = () => {
    setDemoMode(false)
    setUserInfo(null)
    setSelectedPage(null)
    setPosts([])
    setSelectedPostComments({})
    setShowComments({})
  }

  const logout = () => {
    window.FB.logout(() => {
      setUserInfo(null)
      setAccessToken(null)
      setPages([])
      setSelectedPage(null)
      setPosts([])
      setSelectedPostComments({})
      setShowComments({})
      setDemoMode(false)
      localStorage.removeItem('facebook_session')
    })
  }

  // Calculate comprehensive stats
  const stats = {
    totalPosts: posts.length,
    positiveCount: posts.filter(p => p.analysis?.sentiment === 'positive').length,
    negativeCount: posts.filter(p => p.analysis?.sentiment === 'negative').length,
    neutralCount: posts.filter(p => p.analysis?.sentiment === 'neutral').length,
    avgSentiment: posts.length > 0 
      ? posts.reduce((sum, post) => sum + (post.analysis?.score || 0.5), 0) / posts.length
      : 0.5,
    totalComments: Object.values(selectedPostComments).reduce((sum, comments) => sum + comments.length, 0)
  }

  // Render functions
  const renderLogin = () => (
    <div className="login-container">
      <div className="login-card">
        <h2>Connect Your Instagram Business Account</h2>
        <div className="login-options">
          <button 
            className="facebook-login-btn" 
            onClick={loginWithFacebook}
            disabled={loading}
          >
            <span className="btn-icon">🔗</span>
            {loading ? 'Connecting...' : 'Login with Facebook'}
          </button>
          <button className="demo-btn" onClick={enterDemoMode}>
            <span className="btn-icon">🎭</span>
            Try Demo Mode
          </button>
        </div>
      </div>
    </div>
  )

  const renderPageSelection = () => (
    <div className="account-selection">
      <h2>Select Instagram Business Account</h2>
      {pages.map(page => (
        <div 
          key={page.id}
          className="page-card"
          onClick={() => {
            setSelectedPage(page)
            fetchInstagramPosts(page, accessToken)
          }}
        >
          <img 
            src={`https://graph.facebook.com/${page.id}/picture?type=large`}
            alt={page.name}
            className="profile-pic"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/60x60/cccccc/666666?text=Page'
            }}
          />
          <div className="page-info">
            <h3>{page.name}</h3>
            <p>@{page.name.toLowerCase().replace(/\s+/g, '_')}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderOverview = () => (
    <div>
      {demoMode && (
        <div className="demo-banner">
          🎭 Demo Mode Active - Showing sample data for demonstration
        </div>
      )}
      
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
        <div className="metric-card info">
          <div className="metric-number">{Math.round(stats.avgSentiment * 100)}%</div>
          <div className="metric-label">Avg Sentiment</div>
        </div>
        <div className="metric-card info">
          <div className="metric-number">{stats.totalComments}</div>
          <div className="metric-label">Total Comments</div>
        </div>
      </div>

      <div className="posts-analysis">
        <h3>Post Analysis</h3>
        <div className="posts-container">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                {post.media_url && (
                  <img 
                    src={post.media_url}
                    alt="Post content"
                    className="post-image"
                    onError={(e) => {
                      console.log('Image failed to load:', post.media_url)
                      e.target.style.display = 'none'
                    }}
                  />
                )}
                <div className="post-meta">
                  <div className="post-caption">{post.caption}</div>
                  <div className="post-stats">
                    <span>❤️ {post.like_count} likes</span>
                    <span>💬 {post.comments_count} comments</span>
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                      View on Instagram
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="sentiment-analysis">
                <div className={`sentiment-badge ${post.analysis?.sentiment || 'neutral'}`}>
                  {post.analysis?.sentiment === 'positive' ? '😊' : 
                   post.analysis?.sentiment === 'negative' ? '😞' : '😐'} {' '}
                  {post.analysis?.sentiment || 'Neutral'} ({post.analysis?.confidence || 50}% confidence)
                </div>
                
                {post.keywords && post.keywords.length > 0 && (
                  <div className="keywords">
                    <strong>Keywords:</strong> {post.keywords.join(', ')}
                  </div>
                )}
                
                {post.topics && post.topics.length > 0 && (
                  <div className="topics">
                    <strong>Topics:</strong> {post.topics.join(', ')}
                  </div>
                )}
                
                <button 
                  className="comments-btn"
                  onClick={() => fetchComments(post.id)}
                  disabled={loadingComments[post.id]}
                >
                  💬 {loadingComments[post.id] ? 'Loading...' : 'Analyze Comments'}
                </button>
              </div>
              
              {showComments[post.id] && (
                <div className="comments-section">
                  <h4>Comments Analysis ({selectedPostComments[post.id]?.length || 0} comments)</h4>
                  {selectedPostComments[post.id] && selectedPostComments[post.id].length > 0 ? (
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
                          {comment.keywords && comment.keywords.length > 0 && (
                            <div className="comment-keywords">
                              <small><strong>Keywords:</strong> {comment.keywords.join(', ')}</small>
                            </div>
                          )}
                          <div className="comment-stats">
                            ❤️ {comment.like_count} likes
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No comments found for this post.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSinglePost = () => (
    <div className="single-post-tab">
      <h2>Single Post Analysis</h2>
      <p>Enter an Instagram post URL to analyze individual posts.</p>
      <div className="url-input-container">
        <input 
          type="text"
          className="url-input"
          placeholder="https://instagram.com/p/..."
        />
        <button className="analyze-btn">Analyze Post</button>
      </div>
    </div>
  )

  const renderBusinessIntelligence = () => (
    <div className="business-intelligence-tab">
      <h2>Business Intelligence</h2>
      <p>Advanced analytics and insights for your Instagram performance.</p>
      <div className="bi-metrics">
        <div className="bi-card">
          <h3>Brand Health Score</h3>
          <div className="bi-value">
            {Math.round(((stats.positiveCount - stats.negativeCount) / Math.max(stats.totalPosts, 1)) * 50 + 50)}
          </div>
        </div>
        <div className="bi-card">
          <h3>Engagement Rate</h3>
          <div className="bi-value">
            {posts.length > 0 ? 
              Math.round(posts.reduce((sum, post) => sum + (post.like_count + post.comments_count), 0) / posts.length) 
              : 0}
          </div>
        </div>
        <div className="bi-card">
          <h3>Crisis Risk Level</h3>
          <div className="bi-value">
            {stats.negativeCount > stats.totalPosts * 0.3 ? 'High' : 
             stats.negativeCount > stats.totalPosts * 0.15 ? 'Medium' : 'Low'}
          </div>
        </div>
      </div>
    </div>
  )

  // Main render
  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">📊</span>
              <h1>Instagram Sentiment Analysis</h1>
            </div>
            <p className="tagline">
              Analyze the sentiment of your Instagram posts and comments with AI-powered insights
            </p>
            
            {userInfo && (
              <div className="user-info">
                <span>Welcome, {userInfo.name}!</span>
                <button className="logout-btn" onClick={demoMode ? exitDemoMode : logout}>
                  {demoMode ? 'Exit Demo' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="main-content">
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          {!userInfo ? (
            renderLogin()
          ) : !selectedPage ? (
            renderPageSelection()
          ) : (
            <>
              <nav className="tab-navigation">
                <button 
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <span className="tab-icon">📊</span>
                  Overview
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                  onClick={() => setActiveTab('single')}
                >
                  <span className="tab-icon">🔍</span>
                  Single Post
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
                  onClick={() => setActiveTab('business')}
                >
                  <span className="tab-icon">💼</span>
                  Business Intelligence
                </button>
              </nav>

              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'single' && renderSinglePost()}
              {activeTab === 'business' && renderBusinessIntelligence()}
            </>
          )}
        </main>

        <footer className="app-footer">
          <p><strong>Powered by Open Paws AI</strong></p>
        </footer>
      </div>
    </div>
  )
}

export default App
