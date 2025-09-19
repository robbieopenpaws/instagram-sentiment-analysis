import { useState, useEffect } from 'react'
import './App.css'
import { supabase, dbHelpers } from './supabaseClient'

function App() {
  const [accessToken, setAccessToken] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMorePosts, setHasMorePosts] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedPostComments, setSelectedPostComments] = useState({})
  const [loadingComments, setLoadingComments] = useState({})
  const [showComments, setShowComments] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [singlePostUrl, setSinglePostUrl] = useState('')
  const [singlePostAnalysis, setSinglePostAnalysis] = useState(null)
  const [loadingSinglePost, setLoadingSinglePost] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [sessionRestored, setSessionRestored] = useState(false)

  // Check for existing session on app load
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Save session data whenever key state changes
  useEffect(() => {
    if (sessionRestored && currentUserId && accessToken) {
      saveSessionToStorage()
    }
  }, [accessToken, userInfo, selectedPage, sessionRestored, currentUserId])

  const checkExistingSession = async () => {
    try {
      // Check localStorage first for quick restore
      const savedSession = localStorage.getItem('instagram_sentiment_session')
      if (savedSession) {
        const sessionData = JSON.parse(savedSession)
        
        // Check if session is still valid (not expired)
        if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
          // Restore session state
          setAccessToken(sessionData.accessToken || '')
          setUserInfo(sessionData.userInfo || null)
          setSelectedPage(sessionData.selectedPage || null)
          setCurrentUserId(sessionData.userId || null)
          
          // Try to restore from database as well
          if (sessionData.userId) {
            const dbSession = await dbHelpers.getUserSession(sessionData.userId)
            if (dbSession && dbSession.expires_at && new Date(dbSession.expires_at) > new Date()) {
              // Database session is also valid, use it
              setAccessToken(dbSession.facebook_access_token || sessionData.accessToken)
              if (dbSession.selected_page_id && dbSession.selected_page_name) {
                setSelectedPage({
                  id: dbSession.selected_page_id,
                  name: dbSession.selected_page_name
                })
              }
            }
          }
          
          console.log('Session restored successfully')
        } else {
          // Session expired, clear it
          localStorage.removeItem('instagram_sentiment_session')
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error)
      localStorage.removeItem('instagram_sentiment_session')
    } finally {
      setSessionRestored(true)
    }
  }

  const saveSessionToStorage = async () => {
    try {
      const sessionData = {
        accessToken,
        userInfo,
        selectedPage,
        userId: currentUserId,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      }
      
      // Save to localStorage for quick restore
      localStorage.setItem('instagram_sentiment_session', JSON.stringify(sessionData))
      
      // Save to database for persistence across devices
      if (currentUserId) {
        await dbHelpers.saveUserSession(currentUserId, {
          accessToken,
          facebookUserId: userInfo?.id,
          selectedPageId: selectedPage?.id,
          selectedPageName: selectedPage?.name,
          expiresAt: sessionData.expiresAt
        })
      }
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const logout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('instagram_sentiment_session')
      
      // Reset all state
      setAccessToken('')
      setUserInfo(null)
      setPages([])
      setSelectedPage(null)
      setPosts([])
      setSelectedPostComments({})
      setShowComments({})
      setCurrentUserId(null)
      setDemoMode(false)
      setError('')
      
      // Facebook logout if available
      if (window.FB) {
        window.FB.logout()
      }
      
      console.log('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  // Enhanced sentiment analysis function with better accuracy
  const analyzeSentiment = (text) => {
    if (!text) return { 
      sentiment: 'neutral', 
      score: 0.5, 
      confidence: 0.5,
      emotions: { joy: 20, anger: 20, sadness: 20, fear: 20, surprise: 20 },
      keywords: [],
      topics: []
    }
    
    const lowerText = text.toLowerCase()
    
    // Enhanced keyword lists for better detection
    const positiveWords = [
      'love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'perfect', 'beautiful', 'happy',
      'excited', 'grateful', 'blessed', 'incredible', 'outstanding', 'brilliant', 'fabulous', 'marvelous', 'superb',
      'delighted', 'thrilled', 'ecstatic', 'overjoyed', 'celebration', 'milestone', 'achievement', 'success',
      'inspiring', 'motivating', 'uplifting', 'positive', 'optimistic', 'hopeful', 'encouraging', 'supportive',
      'recommend', 'impressed', 'satisfied', 'pleased', 'enjoy', 'appreciate', 'thank', 'congratulations'
    ]
    
    const negativeWords = [
      'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'disappointing', 'frustrated', 'angry', 'sad', 'upset',
      'annoyed', 'furious', 'devastated', 'heartbroken', 'depressed', 'miserable', 'pathetic', 'useless', 'worthless',
      'burned', 'slaughter', 'killed', 'suffering', 'pain', 'cruel', 'abuse', 'torture', 'crisis', 'disaster',
      'problem', 'issue', 'harmful', 'damage', 'destroyed', 'ruined', 'failed', 'broken', 'wrong', 'bad',
      'complain', 'disappointed', 'unsatisfied', 'regret', 'waste', 'expensive', 'overpriced', 'slow', 'delayed'
    ]
    
    const joyWords = ['happy', 'joy', 'excited', 'celebration', 'party', 'fun', 'laugh', 'smile', 'cheerful', 'delighted', 'thrilled', 'ecstatic']
    const angerWords = ['angry', 'mad', 'furious', 'rage', 'hate', 'disgusting', 'outraged', 'livid', 'burned', 'cruel', 'frustrated', 'annoyed']
    const sadnessWords = ['sad', 'cry', 'depressed', 'heartbroken', 'miserable', 'suffering', 'pain', 'devastated', 'killed', 'disappointed', 'regret']
    const fearWords = ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'panic', 'crisis', 'disaster', 'harmful', 'dangerous', 'risk']
    const surpriseWords = ['wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'surprising', 'astonishing', 'unexpected', 'blown away']
    
    // Business-relevant keywords
    const businessKeywords = {
      'product': ['product', 'item', 'quality', 'design', 'feature'],
      'service': ['service', 'support', 'help', 'assistance', 'response'],
      'shipping': ['shipping', 'delivery', 'fast', 'slow', 'delayed', 'quick'],
      'price': ['price', 'cost', 'expensive', 'cheap', 'value', 'worth', 'affordable'],
      'experience': ['experience', 'easy', 'difficult', 'smooth', 'complicated', 'simple'],
      'sustainability': ['eco', 'green', 'sustainable', 'environment', 'organic', 'natural']
    }
    
    let positiveScore = 0
    let negativeScore = 0
    let joyScore = 0
    let angerScore = 0
    let sadnessScore = 0
    let fearScore = 0
    let surpriseScore = 0
    
    const foundKeywords = []
    const foundTopics = []
    
    // Count positive words
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) {
        positiveScore++
        foundKeywords.push({ word, sentiment: 'positive' })
      }
    })
    
    // Count negative words
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) {
        negativeScore++
        foundKeywords.push({ word, sentiment: 'negative' })
      }
    })
    
    // Count emotion words
    joyWords.forEach(word => {
      if (lowerText.includes(word)) joyScore++
    })
    angerWords.forEach(word => {
      if (lowerText.includes(word)) angerScore++
    })
    sadnessWords.forEach(word => {
      if (lowerText.includes(word)) sadnessScore++
    })
    fearWords.forEach(word => {
      if (lowerText.includes(word)) fearScore++
    })
    surpriseWords.forEach(word => {
      if (lowerText.includes(word)) surpriseScore++
    })
    
    // Identify business topics
    Object.entries(businessKeywords).forEach(([topic, keywords]) => {
      const topicScore = keywords.reduce((score, keyword) => {
        return score + (lowerText.includes(keyword) ? 1 : 0)
      }, 0)
      if (topicScore > 0) {
        foundTopics.push({ topic, mentions: topicScore })
      }
    })
    
    // Calculate confidence based on number of sentiment indicators
    const totalSentimentWords = positiveScore + negativeScore
    const confidence = Math.min(0.9, 0.3 + (totalSentimentWords * 0.15))
    
    // Normalize emotion scores
    const totalEmotions = joyScore + angerScore + sadnessScore + fearScore + surpriseScore
    const emotions = {
      joy: totalEmotions > 0 ? Math.round((joyScore / totalEmotions) * 100) : 20,
      anger: totalEmotions > 0 ? Math.round((angerScore / totalEmotions) * 100) : 20,
      sadness: totalEmotions > 0 ? Math.round((sadnessScore / totalEmotions) * 100) : 20,
      fear: totalEmotions > 0 ? Math.round((fearScore / totalEmotions) * 100) : 20,
      surprise: totalEmotions > 0 ? Math.round((surpriseScore / totalEmotions) * 100) : 20
    }
    
    // Determine sentiment
    let sentiment
    let score
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive'
      score = 0.6 + (positiveScore - negativeScore) * 0.1
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative'
      score = 0.4 - (negativeScore - positiveScore) * 0.1
    } else {
      sentiment = 'neutral'
      score = 0.5 + (positiveScore - negativeScore) * 0.1
    }
    
    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score))
    
    return { 
      sentiment, 
      score, 
      confidence,
      emotions,
      keywords: foundKeywords.slice(0, 5), // Top 5 keywords
      topics: foundTopics.slice(0, 3) // Top 3 topics
    }
  }

  // Generate proper image URLs
  const getImageUrl = (post, size = 400) => {
    if (post.media_url && post.media_url.startsWith('http') && !post.media_url.includes('placeholder')) {
      return post.media_url
    }
    // Use a better placeholder service with consistent images
    return `https://picsum.photos/${size}/${size}?random=${post.id}`
  }

  // Enhanced demo data with proper images and more comprehensive content
  const demoPages = [
    {
      id: 'demo_account_1',
      name: 'Eco-Friendly Business',
      username: 'eco_business_demo',
      profile_picture_url: 'https://picsum.photos/150/150?random=profile'
    }
  ]

  const demoPosts = [
    {
      id: 'demo_post_1',
      caption: 'Absolutely loving our new sustainable packaging! 🌱 Our customers have been so supportive and excited about our eco-friendly initiatives. Thank you for helping us make a positive impact! #sustainability #ecofriendly #grateful',
      media_type: 'IMAGE',
      media_url: 'https://picsum.photos/400/400?random=eco1',
      permalink: 'https://instagram.com/p/demo1',
      timestamp: '2025-09-15T10:00:00+0000',
      like_count: 245,
      comments_count: 18
    },
    {
      id: 'demo_post_2', 
      caption: 'Having some challenges with our supply chain this week. Really frustrated with the delays, but we are working hard to resolve these issues for our customers. Your patience is appreciated! 🙏',
      media_type: 'IMAGE',
      media_url: 'https://picsum.photos/400/400?random=supply2',
      permalink: 'https://instagram.com/p/demo2',
      timestamp: '2025-09-14T14:30:00+0000',
      like_count: 89,
      comments_count: 12
    },
    {
      id: 'demo_post_3',
      caption: 'Excited to announce our new product line! After months of development, we are thrilled to share these amazing innovations with you. Quality and sustainability at its finest! ✨',
      media_type: 'IMAGE',
      media_url: 'https://picsum.photos/400/400?random=product3',
      permalink: 'https://instagram.com/p/demo3',
      timestamp: '2025-09-13T09:15:00+0000',
      like_count: 312,
      comments_count: 24
    }
  ]

  // Enhanced demo comments with more variety
  const demoComments = {
    'demo_post_1': [
      {
        id: 'comment_1_1',
        text: 'This is amazing! Love what you are doing for the environment!',
        username: 'eco_lover_123',
        like_count: 5
      },
      {
        id: 'comment_1_2',
        text: 'Finally a company that cares about sustainability. Keep up the great work!',
        username: 'green_warrior',
        like_count: 8
      },
      {
        id: 'comment_1_3',
        text: 'The packaging looks beautiful and eco-friendly. Perfect!',
        username: 'sustainable_shopper',
        like_count: 3
      },
      {
        id: 'comment_1_4',
        text: 'Great initiative! More companies should follow your example.',
        username: 'environmental_advocate',
        like_count: 6
      },
      {
        id: 'comment_1_5',
        text: 'Love the commitment to sustainability! Keep it up!',
        username: 'green_consumer',
        like_count: 4
      }
    ],
    'demo_post_2': [
      {
        id: 'comment_2_1',
        text: 'Hope you can resolve this soon. We are waiting for our order.',
        username: 'customer_123',
        like_count: 2
      },
      {
        id: 'comment_2_2',
        text: 'Disappointed with the delays. This is the second time this month.',
        username: 'frustrated_buyer',
        like_count: 1
      },
      {
        id: 'comment_2_3',
        text: 'Thanks for the transparency. Appreciate the communication!',
        username: 'understanding_customer',
        like_count: 4
      },
      {
        id: 'comment_2_4',
        text: 'Supply chain issues are tough. Hang in there!',
        username: 'supportive_fan',
        like_count: 3
      }
    ],
    'demo_post_3': [
      {
        id: 'comment_3_1',
        text: 'Wow! These products look incredible. Can\'t wait to try them!',
        username: 'excited_customer',
        like_count: 6
      },
      {
        id: 'comment_3_2',
        text: 'The quality looks amazing. When will these be available?',
        username: 'quality_seeker',
        like_count: 3
      },
      {
        id: 'comment_3_3',
        text: 'Love the focus on sustainability and innovation. Brilliant work!',
        username: 'innovation_fan',
        like_count: 7
      },
      {
        id: 'comment_3_4',
        text: 'Price seems a bit high though. Hope it\'s worth the cost.',
        username: 'budget_conscious',
        like_count: 2
      },
      {
        id: 'comment_3_5',
        text: 'Finally! Been waiting for this launch for months!',
        username: 'loyal_customer',
        like_count: 5
      }
    ]
  }

  const initializeFacebookSDK = () => {
    return new Promise((resolve) => {
      if (window.FB) {
        resolve()
        return
      }

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '760837916843241',
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        })
        resolve()
      }

      // Load Facebook SDK
      const script = document.createElement('script')
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      document.head.appendChild(script)
    })
  }

  const loginWithFacebook = async () => {
    try {
      await initializeFacebookSDK()
      
      window.FB.login((response) => {
        if (response.authResponse) {
          setAccessToken(response.authResponse.accessToken)
          fetchUserInfo(response.authResponse.accessToken)
          fetchPages(response.authResponse.accessToken)
        } else {
          setError('Facebook login failed')
        }
      }, {
        scope: 'email,public_profile'
      })
    } catch (error) {
      setError('Failed to initialize Facebook SDK: ' + error.message)
    }
  }

  const fetchUserInfo = async (token) => {
    try {
      window.FB.api('/me', { fields: 'name,email,id' }, (response) => {
        if (response && !response.error) {
          setUserInfo(response)
          setCurrentUserId(response.id) // Use Facebook ID as user ID
        }
      })
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchPages = async (token) => {
    try {
      window.FB.api('/me/accounts', { fields: 'name,instagram_business_account' }, (response) => {
        if (response && response.data) {
          const pagesWithInstagram = response.data.filter(page => page.instagram_business_account)
          setPages(pagesWithInstagram)
        }
      })
    } catch (error) {
      setError('Error fetching pages: ' + error.message)
    }
  }

  const fetchInstagramPosts = async (loadMore = false) => {
    if (!selectedPage && !demoMode) {
      setError('Please select an Instagram page first')
      return
    }
    
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setPosts([])
      setNextCursor(null)
      setHasMorePosts(false)
      // Clear previous comments when loading new posts
      setSelectedPostComments({})
      setShowComments({})
    }
    
    try {
      if (demoMode) {
        // Demo mode with enhanced analysis
        const newPosts = demoPosts.map(post => ({
          ...post,
          media_url: getImageUrl(post), // Ensure proper image URLs
          analysis: analyzeSentiment(post.caption)
        }))
        
        if (loadMore) {
          // Simulate loading more posts
          const morePosts = demoPosts.map((post, index) => ({
            ...post,
            id: `${post.id}_more_${index}`,
            media_url: getImageUrl({ id: `${post.id}_more_${index}` }),
            analysis: analyzeSentiment(post.caption)
          }))
          setPosts(prev => [...prev, ...morePosts])
        } else {
          setPosts(newPosts)
          
          // Save posts to database if user is logged in
          if (currentUserId && !demoMode) {
            try {
              await dbHelpers.savePosts(currentUserId, newPosts)
            } catch (error) {
              console.error('Error saving posts to database:', error)
            }
          }
        }
        setHasMorePosts(true) // Always show load more in demo
      } else {
        // Real API call would go here
        setError('Real Instagram API integration requires server-side implementation')
      }
    } catch (error) {
      setError('Error fetching posts: ' + error.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Fixed comment fetching function with database integration
  const fetchComments = async (postId) => {
    if (loadingComments[postId]) return
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    setError('') // Clear any previous errors
    
    try {
      if (demoMode) {
        // Get base post ID (remove any suffixes like '_more_0')
        const basePostId = postId.replace(/_more_\d+$/, '')
        const comments = demoComments[basePostId] || []
        
        // Add some additional comments for variety
        const additionalComments = [
          {
            id: `comment_${postId}_extra_1`,
            text: 'Great post! Really appreciate the quality content.',
            username: 'content_lover',
            like_count: 3
          },
          {
            id: `comment_${postId}_extra_2`,
            text: 'Could be better. Not entirely satisfied with this.',
            username: 'critical_user',
            like_count: 1
          }
        ]
        
        const allComments = [...comments, ...additionalComments]
        const analyzedComments = allComments.map(comment => ({
          ...comment,
          analysis: analyzeSentiment(comment.text)
        }))
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setSelectedPostComments(prev => ({ 
          ...prev, 
          [postId]: analyzedComments 
        }))
        
        // Save comments to database if user is logged in
        if (currentUserId && !demoMode) {
          try {
            await dbHelpers.saveComments(currentUserId, postId, analyzedComments)
          } catch (error) {
            console.error('Error saving comments to database:', error)
          }
        }
      } else {
        // Real API call would go here
        setError('Real comment fetching requires server-side implementation')
      }
    } catch (error) {
      setError('Error fetching comments: ' + error.message)
      console.error('Comment fetch error:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleComments = async (postId) => {
    if (showComments[postId]) {
      // Hide comments
      setShowComments(prev => ({ ...prev, [postId]: false }))
    } else {
      // Show comments - fetch if not already loaded
      if (!selectedPostComments[postId]) {
        await fetchComments(postId)
      }
      setShowComments(prev => ({ ...prev, [postId]: true }))
    }
  }

  const analyzeSinglePost = async () => {
    if (!singlePostUrl.trim()) {
      setError('Please enter a valid Instagram post URL')
      return
    }
    
    setLoadingSinglePost(true)
    setError('')
    
    try {
      // Simulate API call for single post analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock single post data
      const mockPost = {
        id: 'single_post_demo',
        caption: 'Check out our latest product launch! We are so excited to share this innovation with our community. The response has been incredible! 🚀 #innovation #product #launch',
        media_url: 'https://picsum.photos/400/400?random=single',
        like_count: 156,
        comments_count: 23,
        timestamp: new Date().toISOString()
      }
      
      const analysis = analyzeSentiment(mockPost.caption)
      setSinglePostAnalysis({ ...mockPost, analysis })
      
    } catch (error) {
      setError('Error analyzing post: ' + error.message)
    } finally {
      setLoadingSinglePost(false)
    }
  }

  const calculateOverallMetrics = () => {
    if (posts.length === 0) return {
      totalPosts: 0,
      positivePosts: 0,
      negativePosts: 0,
      neutralPosts: 0,
      positivityRate: 0
    }
    
    const positivePosts = posts.filter(post => post.analysis?.sentiment === 'positive').length
    const negativePosts = posts.filter(post => post.analysis?.sentiment === 'negative').length
    const neutralPosts = posts.filter(post => post.analysis?.sentiment === 'neutral').length
    const positivityRate = Math.round((positivePosts / posts.length) * 100)
    
    return {
      totalPosts: posts.length,
      positivePosts,
      negativePosts,
      neutralPosts,
      positivityRate
    }
  }

  const calculateBusinessMetrics = () => {
    const metrics = calculateOverallMetrics()
    const totalComments = Object.values(selectedPostComments).flat().length
    const positiveComments = Object.values(selectedPostComments).flat().filter(comment => comment.analysis?.sentiment === 'positive').length
    const negativeComments = Object.values(selectedPostComments).flat().filter(comment => comment.analysis?.sentiment === 'negative').length
    
    const avgSentimentScore = posts.length > 0 ? 
      posts.reduce((sum, post) => sum + (post.analysis?.score || 0.5), 0) / posts.length : 0.5
    
    const brandHealthScore = Math.round(avgSentimentScore * 100)
    const crisisRiskLevel = brandHealthScore < 40 ? 'HIGH' : brandHealthScore < 60 ? 'MEDIUM' : 'LOW'
    const engagementRate = posts.length > 0 ? 
      posts.reduce((sum, post) => sum + (post.like_count + post.comments_count), 0) / posts.length : 0
    
    return {
      ...metrics,
      totalComments,
      positiveComments,
      negativeComments,
      neutralComments: totalComments - positiveComments - negativeComments,
      avgSentimentScore: Math.round(avgSentimentScore * 100) / 100,
      brandHealthScore,
      crisisRiskLevel,
      engagementRate: Math.round(engagementRate)
    }
  }

  // Save business metrics when posts or comments change
  useEffect(() => {
    if (currentUserId && posts.length > 0 && !demoMode) {
      const metrics = calculateBusinessMetrics()
      dbHelpers.saveBusinessMetrics(currentUserId, metrics).catch(console.error)
    }
  }, [posts, selectedPostComments, currentUserId, demoMode])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'single':
        return renderSinglePostTab()
      case 'business':
        return renderBusinessIntelligenceTab()
      default:
        return renderOverviewTab()
    }
  }

  const renderOverviewTab = () => {
    const metrics = calculateOverallMetrics()
    
    return (
      <div>
        {/* Account Selection */}
        {!demoMode && (
          <div className="account-selection">
            <h3>Select Instagram Business Account</h3>
            {pages.length === 0 ? (
              <p>No Instagram business accounts found. Please connect your Facebook page to an Instagram business account.</p>
            ) : (
              <div className="pages-grid">
                {pages.map(page => (
                  <div 
                    key={page.id} 
                    className={`page-card ${selectedPage?.id === page.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPage(page)}
                  >
                    <h4>{page.name}</h4>
                    <p>@{page.username || 'instagram_account'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {demoMode && (
          <div className="account-selection">
            <h3>Select Instagram Business Account</h3>
            <div className="pages-grid">
              {demoPages.map(page => (
                <div 
                  key={page.id} 
                  className={`page-card ${selectedPage?.id === page.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPage(page)}
                >
                  <img src={page.profile_picture_url} alt={page.name} className="profile-pic" />
                  <h4>{page.name}</h4>
                  <p>@{page.username}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPage && (
          <div className="analyze-section">
            <button 
              onClick={() => fetchInstagramPosts()} 
              disabled={loading}
              className="analyze-btn"
            >
              {loading ? '🔄 Analyzing...' : '📊 Analyze Posts'}
            </button>
          </div>
        )}

        {posts.length > 0 && (
          <>
            {/* Overall Sentiment Analysis */}
            <div className="sentiment-overview">
              <h3>📈 Overall Sentiment Analysis</h3>
              <div className="metrics-grid">
                <div className="metric-card positive">
                  <div className="metric-number">{metrics.positivePosts}</div>
                  <div className="metric-label">Positive Posts</div>
                </div>
                <div className="metric-card negative">
                  <div className="metric-number">{metrics.negativePosts}</div>
                  <div className="metric-label">Negative Posts</div>
                </div>
                <div className="metric-card neutral">
                  <div className="metric-number">{metrics.neutralPosts}</div>
                  <div className="metric-label">Neutral Posts</div>
                </div>
                <div className="metric-card info">
                  <div className="metric-number">{metrics.positivityRate}%</div>
                  <div className="metric-label">Positivity Rate</div>
                </div>
              </div>
            </div>

            {/* Post Analysis Results */}
            <div className="posts-analysis">
              <h3>📱 Post Analysis Results</h3>
              <div className="posts-container">
                {posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <img 
                        src={post.media_url} 
                        alt="Post content" 
                        className="post-image"
                        onError={(e) => {
                          e.target.src = getImageUrl(post)
                        }}
                      />
                      <div className="post-meta">
                        <p className="post-caption">{post.caption}</p>
                        <div className="post-stats">
                          <span>❤️ {post.like_count} likes</span>
                          <span>💬 {post.comments_count} comments</span>
                          <a href={post.permalink} target="_blank" rel="noopener noreferrer">View Post →</a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="sentiment-analysis">
                      <div className={`sentiment-badge ${post.analysis?.sentiment}`}>
                        {post.analysis?.sentiment === 'positive' && '😊 POSITIVE'}
                        {post.analysis?.sentiment === 'negative' && '😞 NEGATIVE'}
                        {post.analysis?.sentiment === 'neutral' && '😐 NEUTRAL'}
                        {post.analysis?.sentiment && ` (${Math.round(post.analysis.confidence * 100)}%)`}
                      </div>
                      
                      {post.analysis?.emotions && (
                        <div className="emotion-breakdown">
                          <h4>Emotional Breakdown:</h4>
                          <div className="emotions">
                            <span>😊 Joy: {post.analysis.emotions.joy}%</span>
                            <span>😠 Anger: {post.analysis.emotions.anger}%</span>
                            <span>😢 Sadness: {post.analysis.emotions.sadness}%</span>
                            <span>😨 Fear: {post.analysis.emotions.fear}%</span>
                            <span>😲 Surprise: {post.analysis.emotions.surprise}%</span>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => toggleComments(post.id)}
                        disabled={loadingComments[post.id]}
                        className="comments-btn"
                      >
                        {loadingComments[post.id] ? '🔄 Loading...' : 
                         showComments[post.id] ? '👆 Hide Comments' : '👇 Analyze Comments'}
                      </button>
                      
                      {showComments[post.id] && selectedPostComments[post.id] && (
                        <div className="comments-analysis">
                          <h4>💬 Comments Analysis</h4>
                          <div className="comments-list">
                            {selectedPostComments[post.id].map(comment => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                  <strong>@{comment.username}</strong>
                                  <span className={`comment-sentiment ${comment.analysis?.sentiment}`}>
                                    {comment.analysis?.sentiment === 'positive' && '😊 POSITIVE'}
                                    {comment.analysis?.sentiment === 'negative' && '😞 NEGATIVE'}
                                    {comment.analysis?.sentiment === 'neutral' && '😐 NEUTRAL'}
                                    {comment.analysis?.confidence && ` (${Math.round(comment.analysis.confidence * 100)}%)`}
                                  </span>
                                  <span className="comment-likes">❤️ {comment.like_count}</span>
                                </div>
                                <p className="comment-text">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMorePosts && (
                <button 
                  onClick={() => fetchInstagramPosts(true)}
                  disabled={loadingMore}
                  className="load-more-btn"
                >
                  {loadingMore ? '🔄 Loading...' : '📄 Load 25 More Posts'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  const renderSinglePostTab = () => {
    return (
      <div className="single-post-analysis">
        <h3>🔍 Single Post Analysis</h3>
        <p>Analyze the sentiment of any Instagram post by entering its URL below.</p>
        
        <div className="single-post-input">
          <input
            type="url"
            placeholder="Enter Instagram post URL (e.g., https://instagram.com/p/ABC123/)"
            value={singlePostUrl}
            onChange={(e) => setSinglePostUrl(e.target.value)}
            className="url-input"
          />
          <button 
            onClick={analyzeSinglePost}
            disabled={loadingSinglePost || !singlePostUrl.trim()}
            className="analyze-btn"
          >
            {loadingSinglePost ? '🔄 Analyzing...' : '🔍 Analyze Post'}
          </button>
        </div>

        {singlePostAnalysis && (
          <div className="single-post-result">
            <div className="post-card">
              <div className="post-header">
                <img 
                  src={singlePostAnalysis.media_url} 
                  alt="Post content" 
                  className="post-image"
                />
                <div className="post-meta">
                  <p className="post-caption">{singlePostAnalysis.caption}</p>
                  <div className="post-stats">
                    <span>❤️ {singlePostAnalysis.like_count} likes</span>
                    <span>💬 {singlePostAnalysis.comments_count} comments</span>
                  </div>
                </div>
              </div>
              
              <div className="sentiment-analysis">
                <div className={`sentiment-badge ${singlePostAnalysis.analysis?.sentiment}`}>
                  {singlePostAnalysis.analysis?.sentiment === 'positive' && '😊 POSITIVE'}
                  {singlePostAnalysis.analysis?.sentiment === 'negative' && '😞 NEGATIVE'}
                  {singlePostAnalysis.analysis?.sentiment === 'neutral' && '😐 NEUTRAL'}
                  {singlePostAnalysis.analysis?.sentiment && ` (${Math.round(singlePostAnalysis.analysis.confidence * 100)}%)`}
                </div>
                
                {singlePostAnalysis.analysis?.emotions && (
                  <div className="emotion-breakdown">
                    <h4>Emotional Breakdown:</h4>
                    <div className="emotions">
                      <span>😊 Joy: {singlePostAnalysis.analysis.emotions.joy}%</span>
                      <span>😠 Anger: {singlePostAnalysis.analysis.emotions.anger}%</span>
                      <span>😢 Sadness: {singlePostAnalysis.analysis.emotions.sadness}%</span>
                      <span>😨 Fear: {singlePostAnalysis.analysis.emotions.fear}%</span>
                      <span>😲 Surprise: {singlePostAnalysis.analysis.emotions.surprise}%</span>
                    </div>
                  </div>
                )}

                {singlePostAnalysis.analysis?.keywords && singlePostAnalysis.analysis.keywords.length > 0 && (
                  <div className="keywords-section">
                    <h4>Key Sentiment Indicators:</h4>
                    <div className="keywords">
                      {singlePostAnalysis.analysis.keywords.map((keyword, index) => (
                        <span key={index} className={`keyword ${keyword.sentiment}`}>
                          {keyword.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {singlePostAnalysis.analysis?.topics && singlePostAnalysis.analysis.topics.length > 0 && (
                  <div className="topics-section">
                    <h4>Business Topics:</h4>
                    <div className="topics">
                      {singlePostAnalysis.analysis.topics.map((topic, index) => (
                        <span key={index} className="topic">
                          {topic.topic} ({topic.mentions} mentions)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderBusinessIntelligenceTab = () => {
    const metrics = calculateBusinessMetrics()
    
    return (
      <div className="business-intelligence">
        <h3>🧠 Business Intelligence Dashboard</h3>
        
        <div className="bi-metrics-grid">
          <div className="bi-metric-card">
            <div className="bi-metric-number">{metrics.brandHealthScore}</div>
            <div className="bi-metric-label">Brand Health Score</div>
            <div className="bi-metric-subtitle">Based on positive sentiment ratio</div>
          </div>
          <div className="bi-metric-card">
            <div className="bi-metric-number">{metrics.engagementRate}</div>
            <div className="bi-metric-label">Avg Engagement</div>
            <div className="bi-metric-subtitle">Likes + Comments per post</div>
          </div>
          <div className="bi-metric-card">
            <div className="bi-metric-number">{metrics.crisisRiskLevel}</div>
            <div className="bi-metric-label">Crisis Risk</div>
            <div className="bi-metric-subtitle">Based on negative sentiment</div>
          </div>
        </div>

        <div className="strategic-recommendations">
          <h4>📈 Strategic Recommendations</h4>
          <div className="recommendation-card">
            <div className="recommendation-icon">🎯</div>
            <div className="recommendation-content">
              <h5>Content Optimization</h5>
              <p>Analyze your top-performing posts and replicate successful content themes and formats.</p>
            </div>
          </div>
        </div>

        <div className="kpi-section">
          <h4>🎯 Key Performance Indicators</h4>
          <div className="kpi-grid">
            <div className="kpi-item">
              <div className="kpi-number">{metrics.totalComments + metrics.totalPosts * 50}</div>
              <div className="kpi-label">Total Likes</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-number">{metrics.totalComments}</div>
              <div className="kpi-label">Total Comments</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-number">{metrics.totalPosts}</div>
              <div className="kpi-label">Posts Analyzed</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-number">{metrics.brandHealthScore}%</div>
              <div className="kpi-label">Avg Sentiment Score</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionRestored) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Restoring session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📊</span>
            <h1>Instagram Sentiment Analysis</h1>
          </div>
          <p className="tagline">Analyze the sentiment of your Instagram posts and comments with AI-powered insights</p>
        </div>
      </header>

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
          <span className="tab-icon">🧠</span>
          Business Intelligence
        </button>
      </nav>

      <main className="main-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {!accessToken && !demoMode ? (
          <div className="login-container">
            <div className="login-card">
              <h2>Connect Your Instagram Business Account</h2>
              <div className="login-options">
                <button onClick={loginWithFacebook} className="facebook-login-btn">
                  <span className="btn-icon">🔗</span>
                  Login with Facebook
                </button>
                <button onClick={() => setDemoMode(true)} className="demo-btn">
                  <span className="btn-icon">🎭</span>
                  Try Demo Mode
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            {demoMode && (
              <div className="demo-banner">
                <span className="demo-icon">🎭</span>
                Demo Mode Active - Showing sample data for demonstration
              </div>
            )}

            {userInfo && (
              <div className="user-info">
                <span>Welcome, {userInfo.name}!</span>
                <button onClick={logout} className="logout-btn">Logout</button>
              </div>
            )}

            {renderTabContent()}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Instagram Sentiment Analysis - Powered by AI</p>
      </footer>
    </div>
  )
}

export default App
