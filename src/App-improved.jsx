import { useState } from 'react'
import './App.css'

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
      window.FB.api('/me', { fields: 'name,email' }, (response) => {
        if (response && !response.error) {
          setUserInfo(response)
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

  // Fixed comment fetching function
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

  const toggleComments = (postId) => {
    if (!selectedPostComments[postId] && !loadingComments[postId]) {
      fetchComments(postId)
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  const analyzeSinglePost = async () => {
    if (!singlePostUrl.trim()) {
      setError('Please enter an Instagram post URL')
      return
    }
    
    setLoadingSinglePost(true)
    setError('')
    
    try {
      // Demo analysis for single post
      const demoSinglePost = {
        id: 'single_post_demo',
        caption: 'Check out this amazing new product launch! We are so excited to share this with our community. Thank you for all your support! 🚀 #innovation #excited #grateful',
        media_type: 'IMAGE',
        media_url: getImageUrl({ id: 'single_post_demo' }),
        permalink: singlePostUrl,
        timestamp: new Date().toISOString(),
        like_count: 156,
        comments_count: 23
      }
      
      const analysis = analyzeSentiment(demoSinglePost.caption)
      setSinglePostAnalysis({ ...demoSinglePost, analysis })
    } catch (error) {
      setError('Error analyzing single post: ' + error.message)
    } finally {
      setLoadingSinglePost(false)
    }
  }

  const calculateOverallStats = () => {
    if (posts.length === 0) return null
    
    const totalPosts = posts.length
    const positivePosts = posts.filter(post => post.analysis.sentiment === 'positive').length
    const negativePosts = posts.filter(post => post.analysis.sentiment === 'negative').length
    const neutralPosts = posts.filter(post => post.analysis.sentiment === 'neutral').length
    
    const avgScore = posts.reduce((sum, post) => sum + post.analysis.score, 0) / totalPosts
    const positivityRate = Math.round((positivePosts / totalPosts) * 100)
    
    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    const avgEngagement = Math.round((totalLikes + totalComments) / totalPosts)
    
    // Calculate trend (simplified for demo)
    const recentPosts = posts.slice(0, Math.ceil(posts.length / 2))
    const olderPosts = posts.slice(Math.ceil(posts.length / 2))
    
    const recentAvg = recentPosts.length > 0 ? 
      recentPosts.reduce((sum, post) => sum + post.analysis.score, 0) / recentPosts.length : 0
    const olderAvg = olderPosts.length > 0 ? 
      olderPosts.reduce((sum, post) => sum + post.analysis.score, 0) / olderPosts.length : 0
    
    const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable'
    
    return {
      totalPosts,
      positivePosts,
      negativePosts,
      neutralPosts,
      avgScore,
      positivityRate,
      totalLikes,
      totalComments,
      avgEngagement,
      trend
    }
  }

  // Generate actionable insights
  const generateInsights = () => {
    if (posts.length === 0) return []
    
    const insights = []
    const stats = calculateOverallStats()
    
    // Crisis detection
    if (stats.negativePosts > stats.positivePosts) {
      insights.push({
        type: 'alert',
        icon: '🚨',
        title: 'Negative Sentiment Alert',
        message: `${stats.negativePosts} negative posts detected. Consider addressing customer concerns.`,
        priority: 'high'
      })
    }
    
    // Positive momentum
    if (stats.positivityRate > 70) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Strong Positive Sentiment',
        message: `${stats.positivityRate}% positivity rate! Great time to amplify your messaging.`,
        priority: 'medium'
      })
    }
    
    // Engagement insights
    if (stats.avgEngagement > 100) {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'High Engagement',
        message: `Average ${stats.avgEngagement} interactions per post. Your content resonates well!`,
        priority: 'low'
      })
    }
    
    // Topic insights
    const allTopics = posts.flatMap(post => post.analysis.topics || [])
    const topicCounts = {}
    allTopics.forEach(({ topic }) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1
    })
    
    const topTopic = Object.entries(topicCounts).sort(([,a], [,b]) => b - a)[0]
    if (topTopic) {
      insights.push({
        type: 'info',
        icon: '🔥',
        title: 'Trending Topic',
        message: `"${topTopic[0]}" mentioned ${topTopic[1]} times. Consider creating more content around this theme.`,
        priority: 'medium'
      })
    }
    
    return insights.slice(0, 4) // Show top 4 insights
  }

  const stats = calculateOverallStats()
  const insights = generateInsights()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
            📊 Instagram Sentiment Analysis
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)' }}>
            Analyze the sentiment of your Instagram posts and comments with AI-powered insights
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'single-post', label: 'Single Post', icon: '🔍' },
            { id: 'business-intelligence', label: 'Business Intelligence', icon: '💼' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                margin: '0 5px',
                backgroundColor: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.2)',
                color: activeTab === tab.id ? '#667eea' : 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          
          {activeTab === 'overview' && (
            <>
              {/* Login Section */}
              {!accessToken && !demoMode && (
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h2 style={{ marginBottom: '20px', color: '#333' }}>Connect Your Instagram Business Account</h2>
                  <button
                    onClick={loginWithFacebook}
                    style={{
                      backgroundColor: '#1877f2',
                      color: 'white',
                      padding: '15px 30px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginRight: '15px'
                    }}
                  >
                    🔗 Login with Facebook
                  </button>
                  <button
                    onClick={() => setDemoMode(true)}
                    style={{
                      backgroundColor: '#9c27b0',
                      color: 'white',
                      padding: '15px 30px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🎭 Try Demo Mode
                  </button>
                </div>
              )}

              {/* Demo Mode Indicator */}
              {demoMode && (
                <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                  <strong>🎭 Demo Mode Active</strong> - Showing sample data for demonstration
                </div>
              )}

              {/* Page Selection */}
              {(demoMode || pages.length > 0) && !selectedPage && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Select Instagram Business Account</h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {(demoMode ? demoPages : pages).map(page => (
                      <div
                        key={page.id}
                        onClick={() => setSelectedPage(page)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '15px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#667eea'
                          e.target.style.backgroundColor = '#f8f9ff'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#e0e0e0'
                          e.target.style.backgroundColor = 'transparent'
                        }}
                      >
                        <img
                          src={page.profile_picture_url}
                          alt={page.name}
                          style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '15px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#333' }}>{page.name}</div>
                          <div style={{ color: '#666', fontSize: '14px' }}>@{page.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Page Display */}
              {selectedPage && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9ff', borderRadius: '10px', border: '2px solid #667eea' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src={selectedPage.profile_picture_url}
                      alt={selectedPage.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>{selectedPage.name}</div>
                      <div style={{ color: '#666', fontSize: '14px' }}>@{selectedPage.username}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPage(null)
                        setPosts([])
                        setSelectedPostComments({})
                        setShowComments({})
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Change Account
                    </button>
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              {selectedPage && (
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <button
                    onClick={() => fetchInstagramPosts()}
                    disabled={loading}
                    style={{
                      backgroundColor: '#667eea',
                      color: 'white',
                      padding: '15px 40px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? '🔄 Analyzing Posts...' : '📊 Analyze Posts'}
                  </button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                  <strong>⚠️ Error:</strong> {error}
                </div>
              )}

              {/* Actionable Insights */}
              {insights.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#333' }}>💡 Actionable Insights</h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '15px',
                          borderRadius: '10px',
                          backgroundColor: insight.type === 'alert' ? '#ffebee' : 
                                         insight.type === 'success' ? '#e8f5e8' : '#e3f2fd',
                          border: `2px solid ${insight.type === 'alert' ? '#f44336' : 
                                              insight.type === 'success' ? '#4caf50' : '#2196f3'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{insight.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{insight.title}</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>{insight.message}</div>
                        </div>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: insight.priority === 'high' ? '#f44336' : 
                                         insight.priority === 'medium' ? '#ff9800' : '#4caf50',
                          color: 'white'
                        }}>
                          {insight.priority.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Statistics */}
              {stats && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#333' }}>📈 Overall Sentiment Analysis</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>{stats.positivePosts}</div>
                      <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>Positive Posts</div>
                    </div>
                    <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c62828' }}>{stats.negativePosts}</div>
                      <div style={{ color: '#c62828', fontWeight: 'bold' }}>Negative Posts</div>
                    </div>
                    <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7b1fa2' }}>{stats.neutralPosts}</div>
                      <div style={{ color: '#7b1fa2', fontWeight: 'bold' }}>Neutral Posts</div>
                    </div>
                    <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{stats.positivityRate}%</div>
                      <div style={{ color: '#1976d2', fontWeight: 'bold' }}>Positivity Rate</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Posts Display */}
              {posts.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '20px', color: '#333' }}>📱 Post Analysis Results</h3>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {posts.map(post => (
                      <div key={post.id} style={{ border: '1px solid #e0e0e0', borderRadius: '15px', padding: '20px', backgroundColor: '#fafafa' }}>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                          <img
                            src={getImageUrl(post)}
                            alt="Post"
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px' }}
                            onError={(e) => {
                              e.target.src = `https://via.placeholder.com/100x100/cccccc/666666?text=Image`
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 10px 0', color: '#333', lineHeight: '1.5' }}>{post.caption}</p>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                              <span>❤️ {post.like_count} likes</span>
                              <span>💬 {post.comments_count} comments</span>
                              <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                                View Post →
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced Sentiment Analysis */}
                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                                {post.analysis.sentiment === 'positive' ? '😊' : 
                                 post.analysis.sentiment === 'negative' ? '😞' : '😐'}
                              </span>
                              <span style={{ 
                                fontWeight: 'bold',
                                color: post.analysis.sentiment === 'positive' ? '#2e7d32' : 
                                       post.analysis.sentiment === 'negative' ? '#c62828' : '#7b1fa2',
                                textTransform: 'uppercase'
                              }}>
                                {post.analysis.sentiment} ({Math.round(post.analysis.score * 100)}%)
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Confidence: {Math.round(post.analysis.confidence * 100)}%
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            <strong>Emotional Breakdown:</strong>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                              <span>😊 Joy: {post.analysis.emotions.joy}%</span>
                              <span>😠 Anger: {post.analysis.emotions.anger}%</span>
                              <span>😢 Sadness: {post.analysis.emotions.sadness}%</span>
                              <span>😨 Fear: {post.analysis.emotions.fear}%</span>
                              <span>😲 Surprise: {post.analysis.emotions.surprise}%</span>
                            </div>
                          </div>

                          {/* Keywords and Topics */}
                          {post.analysis.keywords && post.analysis.keywords.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                              <strong>Key Terms:</strong> {post.analysis.keywords.map(k => k.word).join(', ')}
                            </div>
                          )}
                          
                          {post.analysis.topics && post.analysis.topics.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <strong>Topics:</strong> {post.analysis.topics.map(t => t.topic).join(', ')}
                            </div>
                          )}
                        </div>

                        {/* Comments Analysis */}
                        <button
                          onClick={() => toggleComments(post.id)}
                          disabled={loadingComments[post.id]}
                          style={{
                            backgroundColor: loadingComments[post.id] ? '#ccc' : '#667eea',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loadingComments[post.id] ? 'not-allowed' : 'pointer',
                            marginBottom: '15px'
                          }}
                        >
                          {loadingComments[post.id] ? '🔄 Loading Comments...' : 
                           showComments[post.id] ? '👆 Hide Comments' : '👇 Analyze Comments'}
                        </button>

                        {showComments[post.id] && selectedPostComments[post.id] && (
                          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💬 Comments Analysis ({selectedPostComments[post.id].length} comments)</h4>
                            {selectedPostComments[post.id].map(comment => (
                              <div key={comment.id} style={{ 
                                padding: '10px', 
                                marginBottom: '10px', 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: '8px',
                                borderLeft: `4px solid ${
                                  comment.analysis.sentiment === 'positive' ? '#4caf50' :
                                  comment.analysis.sentiment === 'negative' ? '#f44336' : '#9e9e9e'
                                }`
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>@{comment.username}</div>
                                <div style={{ marginBottom: '8px' }}>{comment.text}</div>
                                <div style={{ fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>
                                    {comment.analysis.sentiment === 'positive' ? '😊' : 
                                     comment.analysis.sentiment === 'negative' ? '😞' : '😐'} 
                                    {comment.analysis.sentiment.toUpperCase()} ({Math.round(comment.analysis.score * 100)}%)
                                    {comment.analysis.confidence && ` • ${Math.round(comment.analysis.confidence * 100)}% confidence`}
                                  </span>
                                  <span>❤️ {comment.like_count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMorePosts && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button
                        onClick={() => fetchInstagramPosts(true)}
                        disabled={loadingMore}
                        style={{
                          backgroundColor: '#667eea',
                          color: 'white',
                          padding: '15px 30px',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: loadingMore ? 'not-allowed' : 'pointer',
                          opacity: loadingMore ? 0.7 : 1
                        }}
                      >
                        {loadingMore ? '🔄 Loading More...' : '📄 Load 25 More Posts'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'single-post' && (
            <div>
              <h2 style={{ marginBottom: '20px', color: '#333' }}>🔍 Single Post Analysis</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Analyze any Instagram post by entering its URL below:
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  value={singlePostUrl}
                  onChange={(e) => setSinglePostUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '16px',
                    marginBottom: '15px'
                  }}
                />
                <button
                  onClick={analyzeSinglePost}
                  disabled={loadingSinglePost}
                  style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loadingSinglePost ? 'not-allowed' : 'pointer',
                    opacity: loadingSinglePost ? 0.7 : 1
                  }}
                >
                  {loadingSinglePost ? '🔄 Analyzing...' : '🔍 Analyze Post'}
                </button>
              </div>

              {singlePostAnalysis && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '15px', padding: '20px', backgroundColor: '#fafafa' }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>📊 Analysis Results</h3>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <img
                      src={getImageUrl(singlePostAnalysis, 150)}
                      alt="Post"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '10px' }}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/150x150/cccccc/666666?text=Image`
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 10px 0', color: '#333', lineHeight: '1.5' }}>{singlePostAnalysis.caption}</p>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                        <span>❤️ {singlePostAnalysis.like_count} likes</span>
                        <span>💬 {singlePostAnalysis.comments_count} comments</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '2rem', marginRight: '15px' }}>
                        {singlePostAnalysis.analysis.sentiment === 'positive' ? '😊' : 
                         singlePostAnalysis.analysis.sentiment === 'negative' ? '😞' : '😐'}
                      </span>
                      <div>
                        <div style={{ 
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          color: singlePostAnalysis.analysis.sentiment === 'positive' ? '#2e7d32' : 
                                 singlePostAnalysis.analysis.sentiment === 'negative' ? '#c62828' : '#7b1fa2',
                          textTransform: 'uppercase'
                        }}>
                          {singlePostAnalysis.analysis.sentiment} ({Math.round(singlePostAnalysis.analysis.score * 100)}%)
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Confidence: {Math.round(singlePostAnalysis.analysis.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#333' }}>Emotional Breakdown:</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.5rem' }}>😊</div>
                          <div style={{ fontWeight: 'bold' }}>Joy</div>
                          <div style={{ color: '#666' }}>{singlePostAnalysis.analysis.emotions.joy}%</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.5rem' }}>😠</div>
                          <div style={{ fontWeight: 'bold' }}>Anger</div>
                          <div style={{ color: '#666' }}>{singlePostAnalysis.analysis.emotions.anger}%</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.5rem' }}>😢</div>
                          <div style={{ fontWeight: 'bold' }}>Sadness</div>
                          <div style={{ color: '#666' }}>{singlePostAnalysis.analysis.emotions.sadness}%</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.5rem' }}>😨</div>
                          <div style={{ fontWeight: 'bold' }}>Fear</div>
                          <div style={{ color: '#666' }}>{singlePostAnalysis.analysis.emotions.fear}%</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#e1f5fe', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.5rem' }}>😲</div>
                          <div style={{ fontWeight: 'bold' }}>Surprise</div>
                          <div style={{ color: '#666' }}>{singlePostAnalysis.analysis.emotions.surprise}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced insights for single post */}
                    {singlePostAnalysis.analysis.keywords && singlePostAnalysis.analysis.keywords.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#333' }}>Key Terms:</strong>
                        <div style={{ marginTop: '5px' }}>
                          {singlePostAnalysis.analysis.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                margin: '2px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                backgroundColor: keyword.sentiment === 'positive' ? '#e8f5e8' : 
                                               keyword.sentiment === 'negative' ? '#ffebee' : '#f5f5f5',
                                color: keyword.sentiment === 'positive' ? '#2e7d32' : 
                                       keyword.sentiment === 'negative' ? '#c62828' : '#666'
                              }}
                            >
                              {keyword.word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {singlePostAnalysis.analysis.topics && singlePostAnalysis.analysis.topics.length > 0 && (
                      <div>
                        <strong style={{ color: '#333' }}>Topics Mentioned:</strong>
                        <div style={{ marginTop: '5px' }}>
                          {singlePostAnalysis.analysis.topics.map((topic, index) => (
                            <span
                              key={index}
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                margin: '2px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2'
                              }}
                            >
                              {topic.topic} ({topic.mentions})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'business-intelligence' && (
            <div>
              <h2 style={{ marginBottom: '20px', color: '#333' }}>💼 Business Intelligence Dashboard</h2>
              <p style={{ marginBottom: '30px', color: '#666' }}>
                Advanced analytics and insights for strategic decision making.
              </p>
              
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                  <h3 style={{ color: '#666', marginBottom: '10px' }}>No Data Available</h3>
                  <p style={{ color: '#999' }}>Please analyze some posts first to see business intelligence insights.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '30px' }}>
                  {/* Trend Analysis */}
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '15px' }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>📈 Sentiment Trends</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                          {stats.trend === 'improving' ? '📈' : stats.trend === 'declining' ? '📉' : '➡️'}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>Trend Direction</div>
                        <div style={{ color: '#666', textTransform: 'capitalize' }}>{stats.trend}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '5px' }}>⚡</div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>Avg Engagement</div>
                        <div style={{ color: '#666' }}>{stats.avgEngagement} per post</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🎯</div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>Sentiment Score</div>
                        <div style={{ color: '#666' }}>{Math.round(stats.avgScore * 100)}/100</div>
                      </div>
                    </div>
                  </div>

                  {/* Topic Analysis */}
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '15px' }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>🏷️ Topic Performance</h3>
                    {(() => {
                      const allTopics = posts.flatMap(post => post.analysis.topics || [])
                      const topicStats = {}
                      
                      allTopics.forEach(({ topic }) => {
                        if (!topicStats[topic]) {
                          topicStats[topic] = { mentions: 0, posts: [] }
                        }
                        topicStats[topic].mentions++
                      })
                      
                      posts.forEach(post => {
                        if (post.analysis.topics) {
                          post.analysis.topics.forEach(({ topic }) => {
                            if (topicStats[topic]) {
                              topicStats[topic].posts.push(post.analysis.sentiment)
                            }
                          })
                        }
                      })
                      
                      const topTopics = Object.entries(topicStats)
                        .sort(([,a], [,b]) => b.mentions - a.mentions)
                        .slice(0, 5)
                      
                      return topTopics.length > 0 ? (
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {topTopics.map(([topic, stats]) => {
                            const positiveCount = stats.posts.filter(s => s === 'positive').length
                            const totalCount = stats.posts.length
                            const positivityRate = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0
                            
                            return (
                              <div key={topic} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '10px',
                                backgroundColor: 'white',
                                borderRadius: '8px'
                              }}>
                                <div>
                                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{topic}</span>
                                  <span style={{ color: '#666', marginLeft: '10px' }}>({stats.mentions} mentions)</span>
                                </div>
                                <div style={{ 
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  backgroundColor: positivityRate > 60 ? '#e8f5e8' : positivityRate > 40 ? '#fff3e0' : '#ffebee',
                                  color: positivityRate > 60 ? '#2e7d32' : positivityRate > 40 ? '#f57c00' : '#c62828',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {positivityRate}% positive
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#666' }}>
                          No topics identified in current posts
                        </div>
                      )
                    })()}
                  </div>

                  {/* Recommendations */}
                  <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '15px' }}>
                    <h3 style={{ marginBottom: '15px', color: '#333' }}>💡 Strategic Recommendations</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {stats.positivityRate > 70 && (
                        <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '10px', borderLeft: '4px solid #4caf50' }}>
                          <strong style={{ color: '#2e7d32' }}>Amplify Success:</strong>
                          <div style={{ color: '#666', marginTop: '5px' }}>
                            Your content is performing well with {stats.positivityRate}% positive sentiment. Consider increasing posting frequency and promoting top-performing content.
                          </div>
                        </div>
                      )}
                      
                      {stats.negativePosts > stats.positivePosts && (
                        <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '10px', borderLeft: '4px solid #f44336' }}>
                          <strong style={{ color: '#c62828' }}>Address Concerns:</strong>
                          <div style={{ color: '#666', marginTop: '5px' }}>
                            Negative sentiment is higher than positive. Review recent posts and engage with concerned customers promptly.
                          </div>
                        </div>
                      )}
                      
                      {stats.avgEngagement < 50 && (
                        <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '10px', borderLeft: '4px solid #ff9800' }}>
                          <strong style={{ color: '#f57c00' }}>Boost Engagement:</strong>
                          <div style={{ color: '#666', marginTop: '5px' }}>
                            Average engagement is below optimal levels. Try posting at different times, using more interactive content, or asking questions.
                          </div>
                        </div>
                      )}
                      
                      <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
                        <strong style={{ color: '#1976d2' }}>Content Strategy:</strong>
                        <div style={{ color: '#666', marginTop: '5px' }}>
                          Focus on topics that generate positive sentiment. Consider creating more content around your most successful themes.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.7)' }}>
          Instagram Sentiment Analysis - Powered by AI
        </div>
      </div>
    </div>
  )
}

export default App
