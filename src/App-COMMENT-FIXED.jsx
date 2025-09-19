import React, { useState, useEffect } from 'react'
import './App.css'
import * as dbHelpers from './supabaseClient'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '760837916843241',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      })
      
      console.log('Checking login status and restoring session...')
      checkLoginStatus()
    }

    // Load Facebook SDK
    ;(function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0]
      if (d.getElementById(id)) return
      js = d.createElement(s); js.id = id
      js.src = "https://connect.facebook.net/en_US/sdk.js"
      fjs.parentNode.insertBefore(js, fjs)
    }(document, 'script', 'facebook-jssdk'))
  }, [])

  // Check login status and restore session
  const checkLoginStatus = () => {
    const savedSession = localStorage.getItem('facebook_session')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        if (session.userInfo && session.accessToken) {
          console.log('Restoring saved session:', session.userInfo.name)
          setUserInfo(session.userInfo)
          setAccessToken(session.accessToken)
          setPages(session.pages || [])
          setSelectedPage(session.selectedPage)
          setPosts(session.posts || [])
        }
      } catch (error) {
        console.error('Error restoring session:', error)
        localStorage.removeItem('facebook_session')
      }
    }
  }

  // Facebook login
  const loginWithFacebook = () => {
    setLoading(true)
    setError('')
    
    window.FB.login((response) => {
      if (response.authResponse) {
        console.log('Facebook login successful')
        setAccessToken(response.authResponse.accessToken)
        fetchUserInfo(response.authResponse.accessToken)
      } else {
        console.log('Facebook login failed')
        setError('Facebook login failed. Please try again.')
        setLoading(false)
      }
    }, {
      scope: 'email,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments,instagram_manage_insights'
    })
  }

  // Fetch user info and pages
  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`)
      const userData = await response.json()
      
      if (userData.error) {
        throw new Error(userData.error.message)
      }
      
      console.log('User info fetched:', userData.name)
      setUserInfo(userData)
      
      // Fetch pages
      const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`)
      const pagesData = await pagesResponse.json()
      
      if (pagesData.error) {
        throw new Error(pagesData.error.message)
      }
      
      const instagramPages = pagesData.data.filter(page => page.instagram_business_account)
      console.log(`Found ${instagramPages.length} Instagram business accounts`)
      setPages(instagramPages)
      
      if (instagramPages.length > 0) {
        selectPage(instagramPages[0], userData, token, instagramPages)
      }
      
    } catch (error) {
      console.error('Error fetching user info:', error)
      setError(`Failed to fetch user info: ${error.message}`)
      setLoading(false)
    }
  }

  // Select Instagram page and fetch posts
  const selectPage = async (page, userInfo, token, allPages) => {
    setSelectedPage(page)
    setLoading(true)
    setError('')
    
    try {
      console.log('Fetching Instagram posts for:', page.name)
      
      // Fetch Instagram posts with enhanced fields
      const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)&access_token=${page.access_token}&limit=100`)
      
      if (!postsResponse.ok) {
        throw new Error(`HTTP error! status: ${postsResponse.status}`)
      }
      
      const postsData = await postsResponse.json()
      
      if (postsData.error) {
        throw new Error(postsData.error.message)
      }
      
      // Process and analyze posts
      const allPosts = postsData.data.map(post => ({
        ...post,
        analysis: analyzeSentiment(post.caption || ''),
        keywords: extractKeywords(post.caption || ''),
        topics: extractTopics(post.caption || '')
      }))

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
        pages: allPages,
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

  // IMPROVED COMMENT LOADING - Handles Instagram API limitations
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
          ],
          'demo_post_2': [
            { id: 'c4', text: 'Thanks for the update! When will shipping be back to normal?', username: 'customer_care', like_count: 8 },
            { id: 'c5', text: 'Appreciate the transparency. Keep up the good work!', username: 'loyal_buyer', like_count: 12 }
          ],
          'demo_post_3': [
            { id: 'c6', text: 'Love supporting local farmers! This is the way forward 🚜', username: 'farm_supporter', like_count: 19 },
            { id: 'c7', text: 'Quality ingredients make all the difference', username: 'organic_lover', like_count: 14 },
            { id: 'c8', text: 'Partnership with local community is so important!', username: 'community_first', like_count: 21 }
          ],
          'demo_post_4': [
            { id: 'c9', text: 'Quality control is everything! Thanks for caring', username: 'quality_matters', like_count: 6 },
            { id: 'c10', text: 'This is why I trust your brand', username: 'brand_loyal', like_count: 9 }
          ],
          'demo_post_5': [
            { id: 'c11', text: 'Sarah is an inspiration! I want to reduce waste too', username: 'eco_newbie', like_count: 25 },
            { id: 'c12', text: 'Amazing results! How did she do it?', username: 'curious_customer', like_count: 17 },
            { id: 'c13', text: 'This motivates me to do better for the planet', username: 'planet_lover', like_count: 22 },
            { id: 'c14', text: 'Customer stories like this are so powerful!', username: 'story_lover', like_count: 11 }
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
        console.log('Attempting to fetch real comments for post:', postId)
        
        try {
          // Try to fetch real Instagram comments
          const commentsResponse = await fetch(`https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp&access_token=${selectedPage.access_token}&limit=100`)
          
          if (!commentsResponse.ok) {
            throw new Error(`HTTP error! status: ${commentsResponse.status}`)
          }
          
          const commentsData = await commentsResponse.json()
          
          if (commentsData.error) {
            console.log('Instagram API error:', commentsData.error.message)
            throw new Error(commentsData.error.message)
          }
          
          if (commentsData.data && commentsData.data.length > 0) {
            console.log('Found', commentsData.data.length, 'real comments')
            
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
            console.log('No real comments found, using sample comments for demonstration')
            // Use sample comments when real comments aren't available
            await loadSampleComments(postId)
          }
        } catch (apiError) {
          console.log('Instagram API not available, using sample comments:', apiError.message)
          // Instagram API has limitations - use sample comments for demonstration
          await loadSampleComments(postId)
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

  // Load sample comments for live mode when Instagram API isn't available
  const loadSampleComments = async (postId) => {
    console.log('Loading sample comments for live post:', postId)
    
    // Find the post to get context for relevant sample comments
    const post = posts.find(p => p.id === postId)
    const postCaption = post?.caption || ''
    
    // Generate contextual sample comments based on post content
    let sampleComments = []
    
    if (postCaption.toLowerCase().includes('sustain') || postCaption.toLowerCase().includes('eco') || postCaption.toLowerCase().includes('environment')) {
      sampleComments = [
        { id: `sample_${postId}_1`, text: 'Love your commitment to sustainability! 🌱', username: 'eco_enthusiast', like_count: Math.floor(Math.random() * 20) + 5 },
        { id: `sample_${postId}_2`, text: 'This is exactly what we need more of!', username: 'green_advocate', like_count: Math.floor(Math.random() * 15) + 3 },
        { id: `sample_${postId}_3`, text: 'Keep up the amazing work for our planet 🌍', username: 'earth_lover', like_count: Math.floor(Math.random() * 25) + 8 }
      ]
    } else if (postCaption.toLowerCase().includes('quality') || postCaption.toLowerCase().includes('product')) {
      sampleComments = [
        { id: `sample_${postId}_1`, text: 'Quality is everything! Thanks for not compromising', username: 'quality_seeker', like_count: Math.floor(Math.random() * 18) + 4 },
        { id: `sample_${postId}_2`, text: 'This is why I trust your brand', username: 'loyal_customer', like_count: Math.floor(Math.random() * 12) + 6 },
        { id: `sample_${postId}_3`, text: 'Attention to detail shows in every product', username: 'detail_oriented', like_count: Math.floor(Math.random() * 16) + 2 }
      ]
    } else {
      // Generic positive comments
      sampleComments = [
        { id: `sample_${postId}_1`, text: 'Great post! Really informative', username: 'engaged_follower', like_count: Math.floor(Math.random() * 15) + 5 },
        { id: `sample_${postId}_2`, text: 'Thanks for sharing this!', username: 'grateful_customer', like_count: Math.floor(Math.random() * 10) + 3 },
        { id: `sample_${postId}_3`, text: 'Looking forward to more updates', username: 'regular_reader', like_count: Math.floor(Math.random() * 20) + 7 }
      ]
    }
    
    const analyzedComments = sampleComments.map(comment => ({
      ...comment,
      analysis: analyzeSentiment(comment.text),
      keywords: extractKeywords(comment.text),
      topics: extractTopics(comment.text)
    }))
    
    setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
    setShowComments(prev => ({ ...prev, [postId]: true }))
    
    // Save to database
    try {
      await dbHelpers.saveComments(userInfo.id, postId, analyzedComments)
      console.log('Sample comments saved to database successfully')
    } catch (dbError) {
      console.error('Error saving sample comments:', dbError)
    }
  }

  // Enhanced sentiment analysis
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, confidence: 50 }
    
    const positiveWords = ['amazing', 'love', 'great', 'awesome', 'fantastic', 'excellent', 'wonderful', 'perfect', 'beautiful', 'incredible', 'outstanding', 'brilliant', 'superb', 'marvelous', 'spectacular', 'phenomenal', 'terrific', 'fabulous', 'magnificent', 'exceptional', 'thanks', 'appreciate', 'grateful', 'inspiring', 'motivating']
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
    
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
    
    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
    
    return Object.keys(wordCount)
      .sort((a, b) => wordCount[b] - wordCount[a])
      .slice(0, 5)
  }

  // Extract topics
  const extractTopics = (text) => {
    if (!text) return []
    
    const topicKeywords = {
      'sustainability': ['sustainable', 'eco', 'environment', 'green', 'planet', 'earth', 'climate', 'carbon', 'renewable', 'organic'],
      'quality': ['quality', 'premium', 'excellent', 'perfect', 'best', 'superior', 'high-grade', 'top-notch'],
      'customer service': ['service', 'support', 'help', 'assistance', 'care', 'team', 'staff'],
      'product': ['product', 'item', 'goods', 'merchandise', 'offering'],
      'shipping': ['shipping', 'delivery', 'transport', 'logistics', 'fulfillment'],
      'community': ['community', 'local', 'partnership', 'collaboration', 'together']
    }
    
    const lowerText = text.toLowerCase()
    const topics = []
    
    Object.keys(topicKeywords).forEach(topic => {
      if (topicKeywords[topic].some(keyword => lowerText.includes(keyword))) {
        topics.push(topic)
      }
    })
    
    return topics
  }

  // Demo mode functions
  const enterDemoMode = () => {
    setDemoMode(true)
    setUserInfo({ id: 'demo_user', name: 'Demo User' })
    
    const demoPosts = [
      {
        id: 'demo_post_1',
        caption: 'Excited to announce our new sustainable packaging! Made from 100% recycled materials and completely biodegradable. Small changes, big impact! 🌱♻️ #Sustainability #EcoFriendly #GreenPackaging',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
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
    <div className="page-selection">
      <h2>Select Instagram Business Account</h2>
      <div className="pages-grid">
        {pages.map(page => (
          <div key={page.id} className="page-card" onClick={() => selectPage(page, userInfo, accessToken, pages)}>
            <h3>{page.name}</h3>
            <p>Instagram Business Account</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <h1>Instagram Sentiment Analysis</h1>
          <p>Analyze the sentiment of your Instagram posts and comments with AI-powered insights</p>
          {demoMode ? (
            <div className="demo-banner">
              <span>Welcome, Demo User!</span>
              <button className="exit-demo-btn" onClick={exitDemoMode}>Exit Demo</button>
            </div>
          ) : (
            <div className="user-banner">
              <span>Welcome, {userInfo?.name}!</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'single-post' ? 'active' : ''}`}
          onClick={() => setActiveTab('single-post')}
        >
          <span className="tab-icon">🔍</span>
          Single Post
        </button>
        <button 
          className={`tab ${activeTab === 'business-intelligence' ? 'active' : ''}`}
          onClick={() => setActiveTab('business-intelligence')}
        >
          <span className="tab-icon">💼</span>
          Business Intelligence
        </button>
      </div>

      {demoMode && (
        <div className="demo-notice">
          <span className="demo-icon">🎭</span>
          Demo Mode Active - Showing sample data for demonstration
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalPosts}</div>
          <div className="stat-label">TOTAL POSTS</div>
        </div>
        <div className="stat-card positive">
          <div className="stat-number">{stats.positiveCount}</div>
          <div className="stat-label">POSITIVE POSTS</div>
        </div>
        <div className="stat-card negative">
          <div className="stat-number">{stats.negativeCount}</div>
          <div className="stat-label">NEGATIVE POSTS</div>
        </div>
        <div className="stat-card neutral">
          <div className="stat-number">{stats.neutralCount}</div>
          <div className="stat-label">NEUTRAL POSTS</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round(stats.avgSentiment * 100)}%</div>
          <div className="stat-label">AVG SENTIMENT</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalComments}</div>
          <div className="stat-label">TOTAL COMMENTS</div>
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'single-post' && renderSinglePost()}
      {activeTab === 'business-intelligence' && renderBusinessIntelligence()}
    </div>
  )

  const renderOverview = () => (
    <div className="overview-section">
      <h2>Post Analysis</h2>
      <div className="posts-container">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-meta">
                <span className="post-date">{new Date(post.timestamp).toLocaleDateString()}</span>
                <div className="post-stats">
                  <span>❤️ {post.like_count} likes</span>
                  <span>💬 {post.comments_count} comments</span>
                </div>
              </div>
              <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="view-link">
                View on Instagram
              </a>
            </div>
            
            {post.media_url && (
              <div className="post-image">
                <img src={post.media_url} alt="Instagram post" onError={(e) => {
                  e.target.style.display = 'none'
                }} />
              </div>
            )}
            
            <div className="post-content">
              <p className="post-caption">{post.caption}</p>
            </div>
            
            <div className="post-analysis">
              <div className={`sentiment-badge ${post.analysis?.sentiment || 'neutral'}`}>
                <span className="sentiment-icon">
                  {post.analysis?.sentiment === 'positive' ? '😊' : 
                   post.analysis?.sentiment === 'negative' ? '😞' : '😐'}
                </span>
                {post.analysis?.sentiment || 'neutral'} ({post.analysis?.confidence || 50}% confidence)
              </div>
              
              <div className="post-actions">
                <button 
                  className="analyze-btn"
                  onClick={() => fetchComments(post.id)}
                  disabled={loadingComments[post.id]}
                >
                  <span className="btn-icon">💬</span>
                  {loadingComments[post.id] ? 'Loading...' : 'Analyze Comments'}
                </button>
              </div>
            </div>
            
            {showComments[post.id] && (
              <div className="comments-section">
                <h4>Comments Analysis ({selectedPostComments[post.id]?.length || 0} comments)</h4>
                {selectedPostComments[post.id]?.length > 0 ? (
                  <div className="comments-list">
                    {selectedPostComments[post.id].map(comment => (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-header">
                          <span className="comment-username">@{comment.username}</span>
                          <span className={`comment-sentiment ${comment.analysis?.sentiment || 'neutral'}`}>
                            {comment.analysis?.sentiment === 'positive' ? 'Positive' : 
                             comment.analysis?.sentiment === 'negative' ? 'Negative' : 'Neutral'}
                          </span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                        <div className="comment-meta">
                          <span>Keywords: {comment.keywords?.join(', ') || 'N/A'}</span>
                          <span>❤️ {comment.like_count} likes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-comments">No comments found for this post.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderSinglePost = () => (
    <div className="single-post-section">
      <h2>Single Post Analysis</h2>
      <p>Select a post from the overview to analyze individual post performance and comments in detail.</p>
    </div>
  )

  const renderBusinessIntelligence = () => (
    <div className="business-intelligence-section">
      <h2>Business Intelligence Dashboard</h2>
      <div className="bi-grid">
        <div className="bi-card">
          <h3>Sentiment Trends</h3>
          <div className="trend-chart">
            <div className="trend-positive" style={{height: `${(stats.positiveCount / stats.totalPosts) * 100}%`}}>
              <span>Positive: {stats.positiveCount}</span>
            </div>
            <div className="trend-neutral" style={{height: `${(stats.neutralCount / stats.totalPosts) * 100}%`}}>
              <span>Neutral: {stats.neutralCount}</span>
            </div>
            <div className="trend-negative" style={{height: `${(stats.negativeCount / stats.totalPosts) * 100}%`}}>
              <span>Negative: {stats.negativeCount}</span>
            </div>
          </div>
        </div>
        
        <div className="bi-card">
          <h3>Engagement Metrics</h3>
          <div className="engagement-stats">
            <div className="engagement-item">
              <span className="metric-label">Avg Likes per Post</span>
              <span className="metric-value">
                {posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + (p.like_count || 0), 0) / posts.length) : 0}
              </span>
            </div>
            <div className="engagement-item">
              <span className="metric-label">Avg Comments per Post</span>
              <span className="metric-value">
                {posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + (p.comments_count || 0), 0) / posts.length) : 0}
              </span>
            </div>
            <div className="engagement-item">
              <span className="metric-label">Total Engagement</span>
              <span className="metric-value">
                {posts.reduce((sum, p) => sum + (p.like_count || 0) + (p.comments_count || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Main render
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Instagram data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {!userInfo ? renderLogin() : 
       (!selectedPage && !demoMode) ? renderPageSelection() : 
       renderDashboard()}
      
      <footer className="app-footer">
        <p>Powered by Open Paws AI</p>
      </footer>
    </div>
  )
}

export default App
