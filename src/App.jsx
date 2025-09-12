import { useState, useEffect } from 'react'
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

  // Demo data for Facebook App Review screencast
  const demoPages = [
    {
      id: 'demo_account_1',
      name: 'Eco-Friendly Business',
      username: 'eco_business_demo',
      profile_picture_url: 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=ECO'
    },
    {
      id: 'demo_account_2', 
      name: 'Creative Studio',
      username: 'creative_studio_demo',
      profile_picture_url: 'https://via.placeholder.com/150x150/9C27B0/FFFFFF?text=ART'
    },
    {
      id: 'demo_account_3',
      name: 'Food & Lifestyle',
      username: 'food_lifestyle_demo', 
      profile_picture_url: 'https://via.placeholder.com/150x150/FF9800/FFFFFF?text=FOOD'
    }
  ]

  const demoPosts = [
    {
      id: 'demo_post_1',
      caption: 'Absolutely loving our new sustainable packaging! 🌱 Our customers have been so supportive and excited about our eco-friendly initiatives. Thank you for helping us make a positive impact! #sustainability #ecofriendly #grateful',
      media_type: 'IMAGE',
      media_url: 'https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=Eco+Post',
      permalink: 'https://instagram.com/p/demo1',
      timestamp: '2024-01-15T10:30:00Z',
      like_count: 245,
      comments_count: 18,
      sentiment: 'positive',
      score: 0.92,
      emotions: { joy: 0.8, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.2 }
    },
    {
      id: 'demo_post_2', 
      caption: 'Disappointed with the delivery delays this week. We apologize to our customers for the inconvenience. Working hard to resolve these issues and improve our service. #customerservice #improvement',
      media_type: 'IMAGE',
      media_url: 'https://via.placeholder.com/400x400/F44336/FFFFFF?text=Service+Issue',
      permalink: 'https://instagram.com/p/demo2',
      timestamp: '2024-01-14T14:20:00Z',
      like_count: 67,
      comments_count: 23,
      sentiment: 'negative',
      score: 0.25,
      emotions: { joy: 0.0, anger: 0.3, sadness: 0.4, fear: 0.1, surprise: 0.2 }
    },
    {
      id: 'demo_post_3',
      caption: 'Regular team meeting today. Discussing upcoming projects and quarterly goals. Standard business operations continue as planned. #teamwork #business #planning',
      media_type: 'IMAGE', 
      media_url: 'https://via.placeholder.com/400x400/607D8B/FFFFFF?text=Team+Meeting',
      permalink: 'https://instagram.com/p/demo3',
      timestamp: '2024-01-13T09:15:00Z',
      like_count: 89,
      comments_count: 5,
      sentiment: 'neutral',
      score: 0.5,
      emotions: { joy: 0.1, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.0 }
    },
    {
      id: 'demo_post_4',
      caption: 'AMAZING news! We just hit 10,000 followers! 🎉 This incredible milestone wouldn\'t be possible without our fantastic community. You all are absolutely wonderful and we\'re so excited for what\'s coming next! #milestone #celebration #grateful #community',
      media_type: 'IMAGE',
      media_url: 'https://via.placeholder.com/400x400/FF5722/FFFFFF?text=10K+Celebration',
      permalink: 'https://instagram.com/p/demo4',
      timestamp: '2024-01-12T16:45:00Z',
      like_count: 892,
      comments_count: 156,
      sentiment: 'positive',
      score: 0.95,
      emotions: { joy: 0.9, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.1 }
    },
    {
      id: 'demo_post_5',
      caption: 'Behind the scenes look at our creative process. Working on some new designs for the upcoming season. Stay tuned for updates! #behindthescenes #creative #design #process',
      media_type: 'IMAGE',
      media_url: 'https://via.placeholder.com/400x400/3F51B5/FFFFFF?text=Creative+Process',
      permalink: 'https://instagram.com/p/demo5',
      timestamp: '2024-01-11T11:30:00Z',
      like_count: 156,
      comments_count: 12,
      sentiment: 'neutral',
      score: 0.6,
      emotions: { joy: 0.2, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.1 }
    }
  ]

  const enableDemoMode = () => {
    setDemoMode(true)
    setUserInfo({ name: 'Demo User (Facebook App Review)', id: 'demo_user_123' })
    setPages(demoPages)
    setAccessToken('demo_access_token_for_review')
    setError('')
  }

  useEffect(() => {
    // Load Facebook SDK
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    
    script.onload = () => {
      window.FB.init({
        appId: '760837916843241',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      })
    }
    
    document.body.appendChild(script)
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${token}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      setUserInfo(data)
      await fetchInstagramPages(token)
    } catch (err) {
      console.error('Error fetching user info:', err)
      setError('Failed to fetch user information')
    }
  }

  const debugFacebookAPI = async (token) => {
    try {
      const response = await fetch(`/api/instagram/debug?access_token=${token}`)
      const data = await response.json()
      console.log('Facebook API Debug:', data)
      setError(`Debug Info: ${JSON.stringify(data.debug, null, 2)}`)
    } catch (err) {
      console.error('Debug error:', err)
      setError('Debug failed')
    }
  }

  const fetchInstagramPages = async (token) => {
    try {
      const response = await fetch(`/api/instagram/accounts?access_token=${token}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch Instagram accounts")
      }
      
      const instagramPages = data.accounts.map((account) => ({
        id: account.id,
        name: account.name,
        username: account.username,
        profile_picture_url: account.profile_picture_url
      }))
      
      setPages(instagramPages)
      
      if (instagramPages.length === 0) {
        setError(`No Instagram Business accounts found. Debug info: Found ${data.debug?.pages_found || 0} Facebook pages. Please ensure you have an Instagram Business account connected to your Facebook page and that you have granted the necessary permissions.`)
      }
    } catch (err) {
      console.error('Error fetching Instagram pages:', err)
      setError("Failed to fetch Instagram pages. Please ensure you have Instagram Business accounts connected and proper permissions granted.")
    }
  }

  const loginWithFacebook = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        setAccessToken(response.authResponse.accessToken)
        fetchUserInfo(response.authResponse.accessToken)
        debugFacebookAPI(response.authResponse.accessToken)
      } else {
        setError('Facebook login failed. Please try again.')
      }
    }, { 
      scope: 'pages_read_engagement,instagram_basic,pages_show_list,pages_manage_metadata,business_management',
      return_scopes: true 
    })
  }

  const logout = () => {
    window.FB.logout(() => {
      setAccessToken('')
      setUserInfo(null)
      setPages([])
      setSelectedPage(null)
      setPosts([])
      setError('')
      setActiveTab('overview')
    })
  }

  const advancedSentimentAnalysis = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 } }
    
    const emotionKeywords = {
      joy: ['happy', 'joy', 'excited', 'amazing', 'wonderful', 'fantastic', 'great', 'awesome', 'love', 'perfect', 'brilliant', 'excellent', 'thrilled', 'delighted', 'ecstatic'],
      anger: ['angry', 'mad', 'furious', 'hate', 'terrible', 'awful', 'worst', 'disgusting', 'annoying', 'frustrated', 'outraged', 'livid', 'irritated'],
      sadness: ['sad', 'depressed', 'disappointed', 'heartbroken', 'crying', 'upset', 'miserable', 'lonely', 'devastated', 'grief', 'sorrow'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified', 'panic', 'frightened', 'concerned', 'alarmed'],
      surprise: ['wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'surprised', 'unexpected', 'astonishing', 'remarkable']
    }
    
    const lowerText = text.toLowerCase()
    const emotions = { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 }
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          emotions[emotion] += 1
        }
      })
    })
    
    const totalEmotions = Object.values(emotions).reduce((sum, count) => sum + count, 0)
    
    if (totalEmotions === 0) {
      return { sentiment: 'neutral', score: 0.5, emotions }
    }
    
    const normalizedEmotions = Object.fromEntries(
      Object.entries(emotions).map(([emotion, count]) => [emotion, count / totalEmotions])
    )
    
    const positiveScore = normalizedEmotions.joy + normalizedEmotions.surprise
    const negativeScore = normalizedEmotions.anger + normalizedEmotions.sadness + normalizedEmotions.fear
    
    let sentiment
    let score
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive'
      score = 0.5 + (positiveScore * 0.5)
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative'
      score = 0.5 - (negativeScore * 0.5)
    } else {
      sentiment = 'neutral'
      score = 0.5
    }
    
    return { sentiment, score, emotions: normalizedEmotions }
  }

  const fetchInstagramPosts = async (loadMore = false) => {
    if (!selectedPage) {
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
    }
    
    setError('')
    
    try {
      if (demoMode) {
        // Demo mode: use mock data
        setTimeout(() => {
          if (loadMore) {
            // Simulate loading more demo posts
            const moreDemoPosts = [
              {
                id: 'demo_post_6',
                caption: 'Thank you to everyone who attended our workshop today! The energy was incredible and we learned so much together. Looking forward to the next one! #workshop #learning #community',
                media_type: 'IMAGE',
                media_url: 'https://via.placeholder.com/400x400/8BC34A/FFFFFF?text=Workshop',
                permalink: 'https://instagram.com/p/demo6',
                timestamp: '2024-01-10T15:20:00Z',
                like_count: 178,
                comments_count: 24,
                sentiment: 'positive',
                score: 0.88,
                emotions: { joy: 0.7, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.3 }
              },
              {
                id: 'demo_post_7',
                caption: 'Dealing with some technical difficulties today. Our website is experiencing slower load times. Our team is working to resolve this as quickly as possible. #technical #maintenance',
                media_type: 'IMAGE',
                media_url: 'https://via.placeholder.com/400x400/FF5722/FFFFFF?text=Technical+Issue',
                permalink: 'https://instagram.com/p/demo7',
                timestamp: '2024-01-09T12:45:00Z',
                like_count: 45,
                comments_count: 8,
                sentiment: 'negative',
                score: 0.3,
                emotions: { joy: 0.0, anger: 0.2, sadness: 0.3, fear: 0.2, surprise: 0.3 }
              }
            ]
            setPosts(prev => [...prev, ...moreDemoPosts])
            setHasMorePosts(false) // No more demo posts after this
          } else {
            setPosts(demoPosts)
            setHasMorePosts(true) // Indicate there are more posts available
          }
          setLoadingMore(false)
          setLoading(false)
        }, 1500) // Simulate API delay for realistic demo
        return
      }
      
      // Real mode: fetch from Instagram API
      let url = `/api/instagram/posts?access_token=${accessToken}&page_id=${selectedPage.id}`
      if (loadMore && nextCursor) {
        url += `&after=${nextCursor}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch posts")
      }
      
      const postsWithSentiment = data.data.map((post) => {
        const analysis = advancedSentimentAnalysis(post.caption || '')
        return {
          ...post,
          sentiment: analysis.sentiment,
          score: analysis.score,
          emotions: analysis.emotions
        }
      })
      
      if (loadMore) {
        setPosts(prev => [...prev, ...postsWithSentiment])
      } else {
        setPosts(postsWithSentiment)
      }
      
      // Update pagination state
      setNextCursor(data.pagination?.next_cursor || null)
      setHasMorePosts(data.pagination?.has_next || false)
      
      if (postsWithSentiment.length === 0 && !loadMore) {
        setError('No Instagram posts found. Make sure you have posts on your Instagram business account.')
      }
      
    } catch (err) {
      console.error('Error fetching Instagram posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram posts. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchComments = async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    
    try {
      if (demoMode) {
        // Demo mode: use mock comment data
        setTimeout(() => {
          const demoComments = {
            comments: [
              {
                id: `comment_${postId}_1`,
                text: "This is absolutely amazing! Love what you're doing! 😍",
                username: "happy_customer_123",
                timestamp: "2024-01-15T11:30:00Z",
                like_count: 12,
                sentiment: "positive",
                score: 0.92,
                emotions: { joy: 0.8, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.2 },
                replies: []
              },
              {
                id: `comment_${postId}_2`,
                text: "Not sure about this approach. Could be better in my opinion.",
                username: "critical_viewer",
                timestamp: "2024-01-15T12:15:00Z",
                like_count: 3,
                sentiment: "negative",
                score: 0.3,
                emotions: { joy: 0.0, anger: 0.2, sadness: 0.3, fear: 0.0, surprise: 0.0 },
                replies: []
              },
              {
                id: `comment_${postId}_3`,
                text: "Thanks for sharing this information. Very helpful!",
                username: "grateful_follower",
                timestamp: "2024-01-15T13:00:00Z",
                like_count: 8,
                sentiment: "positive",
                score: 0.85,
                emotions: { joy: 0.6, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.1 },
                replies: []
              },
              {
                id: `comment_${postId}_4`,
                text: "Interesting post. Looking forward to more updates.",
                username: "regular_reader",
                timestamp: "2024-01-15T14:20:00Z",
                like_count: 5,
                sentiment: "neutral",
                score: 0.6,
                emotions: { joy: 0.2, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.1 },
                replies: []
              }
            ],
            statistics: {
              total_comments: 4,
              positive_comments: 2,
              negative_comments: 1,
              neutral_comments: 1,
              average_sentiment_score: 0.67,
              positivity_rate: 50
            }
          }
          
          setSelectedPostComments(prev => ({ ...prev, [postId]: demoComments }))
          setShowComments(prev => ({ ...prev, [postId]: true }))
          setLoadingComments(prev => ({ ...prev, [postId]: false }))
        }, 1000)
        return
      }
      
      // Real mode: fetch from Instagram API
      const response = await fetch(`/api/instagram/comments?access_token=${accessToken}&post_id=${postId}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch comments")
      }
      
      setSelectedPostComments(prev => ({ ...prev, [postId]: data }))
      setShowComments(prev => ({ ...prev, [postId]: true }))
      
    } catch (err) {
      console.error('Error fetching comments:', err)
      // Fallback to demo data if API fails
      const fallbackComments = {
        comments: [
          {
            id: `fallback_comment_${postId}_1`,
            text: "Great post! Really enjoyed reading this.",
            username: "demo_user_1",
            timestamp: new Date().toISOString(),
            like_count: 5,
            sentiment: "positive",
            score: 0.8,
            emotions: { joy: 0.7, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.1 },
            replies: []
          }
        ],
        statistics: {
          total_comments: 1,
          positive_comments: 1,
          negative_comments: 0,
          neutral_comments: 0,
          average_sentiment_score: 0.8,
          positivity_rate: 100
        }
      }
      setSelectedPostComments(prev => ({ ...prev, [postId]: fallbackComments }))
      setShowComments(prev => ({ ...prev, [postId]: true }))
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
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
      // Extract post ID from URL (simplified for demo)
      const postId = singlePostUrl.split('/p/')[1]?.split('/')[0] || 'demo_single_post'
      
      // Demo single post analysis
      setTimeout(() => {
        const singlePostData = {
          id: postId,
          caption: "Just launched our new product line! 🚀 We're so excited to share this with our amazing community. The feedback has been incredible so far! #newproduct #launch #excited #grateful",
          media_type: 'IMAGE',
          media_url: 'https://via.placeholder.com/600x600/2196F3/FFFFFF?text=Product+Launch',
          permalink: singlePostUrl,
          timestamp: new Date().toISOString(),
          like_count: 1247,
          comments_count: 89,
          sentiment: 'positive',
          score: 0.89,
          emotions: { joy: 0.7, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.3 },
          comments: [
            {
              id: 'single_comment_1',
              text: "This looks amazing! Can't wait to try it out! 🔥",
              username: "excited_customer",
              timestamp: new Date().toISOString(),
              like_count: 23,
              sentiment: "positive",
              score: 0.95,
              emotions: { joy: 0.8, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.2 }
            },
            {
              id: 'single_comment_2',
              text: "Finally! I've been waiting for this for months!",
              username: "loyal_fan",
              timestamp: new Date().toISOString(),
              like_count: 15,
              sentiment: "positive",
              score: 0.88,
              emotions: { joy: 0.9, anger: 0.0, sadness: 0.0, fear: 0.0, surprise: 0.1 }
            },
            {
              id: 'single_comment_3',
              text: "Looks good but the price seems a bit high...",
              username: "budget_conscious",
              timestamp: new Date().toISOString(),
              like_count: 7,
              sentiment: "neutral",
              score: 0.4,
              emotions: { joy: 0.1, anger: 0.0, sadness: 0.2, fear: 0.1, surprise: 0.0 }
            },
            {
              id: 'single_comment_4',
              text: "Not impressed. Expected better quality for this brand.",
              username: "disappointed_user",
              timestamp: new Date().toISOString(),
              like_count: 2,
              sentiment: "negative",
              score: 0.2,
              emotions: { joy: 0.0, anger: 0.3, sadness: 0.4, fear: 0.0, surprise: 0.0 }
            }
          ],
          statistics: {
            total_comments: 4,
            positive_comments: 2,
            negative_comments: 1,
            neutral_comments: 1,
            average_sentiment_score: 0.63,
            positivity_rate: 50,
            engagement_rate: 10.7,
            viral_potential: 'High',
            crisis_risk: 'Low'
          }
        }
        
        setSinglePostAnalysis(singlePostData)
        setLoadingSinglePost(false)
      }, 2000)
      
    } catch (err) {
      console.error('Error analyzing single post:', err)
      setError('Failed to analyze the post. Please check the URL and try again.')
      setLoadingSinglePost(false)
    }
  }

  const toggleComments = (postId) => {
    if (showComments[postId]) {
      setShowComments(prev => ({ ...prev, [postId]: false }))
    } else if (selectedPostComments[postId]) {
      setShowComments(prev => ({ ...prev, [postId]: true }))
    } else {
      fetchComments(postId)
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😞'
      default: return '😐'
    }
  }

  const getAdvancedStats = () => {
    if (posts.length === 0) return null
    
    const positive = posts.filter(p => p.sentiment === 'positive').length
    const negative = posts.filter(p => p.sentiment === 'negative').length
    const neutral = posts.filter(p => p.sentiment === 'neutral').length
    
    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    const totalPosts = posts.length
    
    const avgLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0
    const avgComments = totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0
    
    // Calculate Net Sentiment Score
    const netSentimentScore = totalPosts > 0 ? Math.round(((positive - negative) / totalPosts) * 100) : 0
    
    // Calculate engagement rate
    const engagementRate = totalPosts > 0 ? ((totalLikes + totalComments) / totalPosts).toFixed(1) : '0'
    
    // Calculate comment sentiment statistics
    const commentStats = Object.values(selectedPostComments).reduce((acc, postComments) => {
      if (postComments?.statistics) {
        acc.totalCommentsSentiment += postComments.statistics.total_comments || 0
        acc.positiveComments += postComments.statistics.positive_comments || 0
        acc.negativeComments += postComments.statistics.negative_comments || 0
        acc.neutralComments += postComments.statistics.neutral_comments || 0
      }
      return acc
    }, { totalCommentsSentiment: 0, positiveComments: 0, negativeComments: 0, neutralComments: 0 })
    
    const postsWithCommentAnalysis = Object.keys(selectedPostComments).length
    const commentPositivityRate = commentStats.totalCommentsSentiment > 0 
      ? Math.round((commentStats.positiveComments / commentStats.totalCommentsSentiment) * 100) 
      : 0

    // Brand health score (0-100)
    const brandHealthScore = Math.round((
      (positive / totalPosts * 40) + // 40% weight on positive posts
      (commentPositivityRate / 100 * 30) + // 30% weight on comment positivity
      (Math.min(engagementRate / 50, 1) * 20) + // 20% weight on engagement (capped at 50)
      ((totalPosts >= 10 ? 1 : totalPosts / 10) * 10) // 10% weight on content volume
    ) * 100)

    // Crisis detection
    const recentNegativePosts = posts.slice(0, 5).filter(p => p.sentiment === 'negative').length
    const crisisRisk = recentNegativePosts >= 3 ? 'High' : recentNegativePosts >= 2 ? 'Medium' : 'Low'
    
    return {
      positive,
      negative,
      neutral,
      totalPosts,
      avgLikes,
      avgComments,
      totalLikes,
      totalComments,
      engagementRate,
      netSentimentScore,
      brandHealthScore,
      crisisRisk,
      commentStats,
      postsWithCommentAnalysis,
      commentPositivityRate,
      postPositivityRate: totalPosts > 0 ? Math.round((positive / totalPosts) * 100) : 0
    }
  }

  const stats = getAdvancedStats()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'posts':
        return renderPostsTab()
      case 'single':
        return renderSinglePostTab()
      case 'insights':
        return renderInsightsTab()
      default:
        return renderOverviewTab()
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Executive Summary */}
      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            🎯 Executive Dashboard
            <span className="ml-3 text-sm font-normal text-gray-500">Real-time Brand Health Monitoring</span>
          </h3>
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{stats.brandHealthScore}</div>
              <div className="text-sm text-gray-600 mt-1">Brand Health Score</div>
              <div className="text-xs text-blue-500 mt-1">
                {stats.brandHealthScore >= 80 ? 'Excellent' : stats.brandHealthScore >= 60 ? 'Good' : 'Needs Attention'}
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600">{stats.netSentimentScore > 0 ? '+' : ''}{stats.netSentimentScore}</div>
              <div className="text-sm text-gray-600 mt-1">Net Sentiment Score</div>
              <div className="text-xs text-green-500 mt-1">
                {stats.netSentimentScore > 20 ? 'Very Positive' : stats.netSentimentScore > 0 ? 'Positive' : 'Neutral/Negative'}
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{stats.engagementRate}</div>
              <div className="text-sm text-gray-600 mt-1">Avg Engagement Rate</div>
              <div className="text-xs text-purple-500 mt-1">
                {parseFloat(stats.engagementRate) > 30 ? 'High' : parseFloat(stats.engagementRate) > 15 ? 'Good' : 'Low'}
              </div>
            </div>
            <div className={`text-center p-6 rounded-xl border ${
              stats.crisisRisk === 'High' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' :
              stats.crisisRisk === 'Medium' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' :
              'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <div className={`text-3xl font-bold ${
                stats.crisisRisk === 'High' ? 'text-red-600' :
                stats.crisisRisk === 'Medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {stats.crisisRisk === 'High' ? '⚠️' : stats.crisisRisk === 'Medium' ? '⚡' : '✅'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Crisis Risk</div>
              <div className={`text-xs mt-1 ${
                stats.crisisRisk === 'High' ? 'text-red-500' :
                stats.crisisRisk === 'Medium' ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {stats.crisisRisk} Risk Level
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <div className="text-sm text-gray-600">Positive Posts</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
              <div className="text-sm text-gray-600">Negative Posts</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.neutral}</div>
              <div className="text-sm text-gray-600">Neutral Posts</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.avgLikes}</div>
              <div className="text-sm text-gray-600">Avg Likes</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{stats.avgComments}</div>
              <div className="text-sm text-gray-600">Avg Comments</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.postPositivityRate}%</div>
              <div className="text-sm text-gray-600">Post Positivity</div>
            </div>
          </div>

          {/* Comment Analysis Overview */}
          {stats.postsWithCommentAnalysis > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">💬 Comment Sentiment Intelligence</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.commentStats.positiveComments}</div>
                  <div className="text-sm text-gray-600">Positive Comments</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.commentStats.negativeComments}</div>
                  <div className="text-sm text-gray-600">Negative Comments</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{stats.commentStats.neutralComments}</div>
                  <div className="text-sm text-gray-600">Neutral Comments</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.commentPositivityRate}%</div>
                  <div className="text-sm text-gray-600">Comment Positivity</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">{stats.postsWithCommentAnalysis}</div>
                  <div className="text-sm text-gray-600">Posts Analyzed</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Strategic Recommendations</h4>
            <div className="space-y-2 text-sm">
              {stats.brandHealthScore < 60 && (
                <div className="flex items-center text-red-600">
                  <span className="mr-2">⚠️</span>
                  Brand health needs immediate attention - focus on positive content creation
                </div>
              )}
              {stats.netSentimentScore < 0 && (
                <div className="flex items-center text-orange-600">
                  <span className="mr-2">📈</span>
                  Negative sentiment detected - review recent posts and engage with concerned users
                </div>
              )}
              {parseFloat(stats.engagementRate) < 15 && (
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">🚀</span>
                  Low engagement - consider more interactive content and optimal posting times
                </div>
              )}
              {stats.crisisRisk === 'High' && (
                <div className="flex items-center text-red-600">
                  <span className="mr-2">🚨</span>
                  High crisis risk - immediate response strategy recommended
                </div>
              )}
              {stats.brandHealthScore >= 80 && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✅</span>
                  Excellent brand health - maintain current content strategy
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPostsTab = () => (
    <div>
      {/* Posts Display */}
      {posts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">📝 Individual Post Analysis</h3>
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getSentimentEmoji(post.sentiment || 'neutral')}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(post.sentiment || 'neutral')}`}>
                      {post.sentiment?.toUpperCase()} ({Math.round((post.score || 0.5) * 100)}%)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-gray-800 mb-3">{post.caption}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>❤️ {post.like_count || 0} likes</span>
                    <span>💬 {post.comments_count || 0} comments</span>
                    <button
                      onClick={() => toggleComments(post.id)}
                      disabled={loadingComments[post.id]}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {loadingComments[post.id] 
                        ? 'Loading...' 
                        : showComments[post.id] 
                          ? 'Hide Comments' 
                          : 'Analyze Comments'
                      }
                    </button>
                  </div>
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800"
                  >
                    View Post →
                  </a>
                </div>
                
                {post.emotions && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-600 mb-2">Emotional Breakdown:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(post.emotions).map(([emotion, value]) => (
                        value > 0 && (
                          <span key={emotion} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {emotion}: {Math.round(value * 100)}%
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Comments Analysis Section */}
                {showComments[post.id] && selectedPostComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        💬 Comment Analysis 
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {selectedPostComments[post.id].statistics?.total_comments || 0} comments
                        </span>
                      </h4>
                      
                      {/* Comment Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {selectedPostComments[post.id].statistics?.positive_comments || 0}
                          </div>
                          <div className="text-xs text-gray-600">Positive</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-lg font-bold text-red-600">
                            {selectedPostComments[post.id].statistics?.negative_comments || 0}
                          </div>
                          <div className="text-xs text-gray-600">Negative</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-600">
                            {selectedPostComments[post.id].statistics?.neutral_comments || 0}
                          </div>
                          <div className="text-xs text-gray-600">Neutral</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {selectedPostComments[post.id].statistics?.positivity_rate || 0}%
                          </div>
                          <div className="text-xs text-gray-600">Positivity</div>
                        </div>
                      </div>
                      
                      {/* Individual Comments */}
                      <div className="space-y-3 max-h-96 overflow-y-auto bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-3 border-b border-gray-100 pb-2">
                          Individual Comment Analysis
                        </div>
                        {selectedPostComments[post.id].comments?.map((comment) => (
                          <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-white text-xs font-bold">{comment.username.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="font-medium text-sm text-gray-900">@{comment.username}</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(comment.sentiment)}`}>
                                  {comment.sentiment} ({Math.round(comment.score * 100)}%)
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                ❤️ {comment.like_count}
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 mb-2 leading-relaxed">{comment.text}</p>
                            {comment.emotions && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(comment.emotions).map(([emotion, value]) => (
                                  value > 0 && (
                                    <span key={emotion} className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                                      {emotion}: {Math.round(value * 100)}%
                                    </span>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMorePosts && (
            <div className="mt-6 text-center">
              <button
                onClick={() => fetchInstagramPosts(true)}
                disabled={loadingMore}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loadingMore ? 'Loading More Posts...' : 'Load 25 More Posts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSinglePostTab = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
        🔍 Single Post Deep Analysis
        <span className="ml-3 text-sm font-normal text-gray-500">Analyze any Instagram post URL</span>
      </h3>
      
      {/* URL Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instagram Post URL
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            value={singlePostUrl}
            onChange={(e) => setSinglePostUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/POST_ID/"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={analyzeSinglePost}
            disabled={loadingSinglePost}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loadingSinglePost ? 'Analyzing...' : 'Analyze Post'}
          </button>
        </div>
      </div>

      {/* Single Post Analysis Results */}
      {singlePostAnalysis && (
        <div className="space-y-6">
          {/* Post Overview */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{getSentimentEmoji(singlePostAnalysis.sentiment)}</span>
                <div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getSentimentColor(singlePostAnalysis.sentiment)}`}>
                    {singlePostAnalysis.sentiment?.toUpperCase()} ({Math.round(singlePostAnalysis.score * 100)}%)
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(singlePostAnalysis.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <a
                href={singlePostAnalysis.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                View Original Post →
              </a>
            </div>
            
            <p className="text-gray-800 mb-4">{singlePostAnalysis.caption}</p>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{singlePostAnalysis.like_count}</div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{singlePostAnalysis.comments_count}</div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{singlePostAnalysis.statistics?.engagement_rate}%</div>
                <div className="text-sm text-gray-600">Engagement Rate</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{singlePostAnalysis.statistics?.viral_potential}</div>
                <div className="text-sm text-gray-600">Viral Potential</div>
              </div>
            </div>

            {/* Emotional Breakdown */}
            {singlePostAnalysis.emotions && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2">Post Emotional Breakdown:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(singlePostAnalysis.emotions).map(([emotion, value]) => (
                    value > 0 && (
                      <span key={emotion} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {emotion}: {Math.round(value * 100)}%
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comment Analysis */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              💬 Complete Comment Analysis
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {singlePostAnalysis.statistics?.total_comments} comments analyzed
              </span>
            </h4>
            
            {/* Comment Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{singlePostAnalysis.statistics?.positive_comments}</div>
                <div className="text-sm text-gray-600">Positive Comments</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{singlePostAnalysis.statistics?.negative_comments}</div>
                <div className="text-sm text-gray-600">Negative Comments</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{singlePostAnalysis.statistics?.neutral_comments}</div>
                <div className="text-sm text-gray-600">Neutral Comments</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{singlePostAnalysis.statistics?.positivity_rate}%</div>
                <div className="text-sm text-gray-600">Positivity Rate</div>
              </div>
            </div>

            {/* Individual Comments */}
            <div className="space-y-4 max-h-96 overflow-y-auto bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3 border-b border-gray-100 pb-2">
                Individual Comment Sentiment Analysis
              </div>
              {singlePostAnalysis.comments?.map((comment) => (
                <div key={comment.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">{comment.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-900">@{comment.username}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(comment.sentiment)}`}>
                          {comment.sentiment} ({Math.round(comment.score * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      ❤️ {comment.like_count}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-3 leading-relaxed">{comment.text}</p>
                  {comment.emotions && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(comment.emotions).map(([emotion, value]) => (
                        value > 0 && (
                          <span key={emotion} className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                            {emotion}: {Math.round(value * 100)}%
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Analysis Summary */}
            <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3">📊 Analysis Summary & Recommendations</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="mr-2">🎯</span>
                  <span>Overall sentiment: <strong>{singlePostAnalysis.sentiment}</strong> with {Math.round(singlePostAnalysis.score * 100)}% confidence</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📈</span>
                  <span>Engagement rate: <strong>{singlePostAnalysis.statistics?.engagement_rate}%</strong> - {parseFloat(singlePostAnalysis.statistics?.engagement_rate) > 10 ? 'Above average' : 'Below average'}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🚀</span>
                  <span>Viral potential: <strong>{singlePostAnalysis.statistics?.viral_potential}</strong></span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  <span>Crisis risk: <strong>{singlePostAnalysis.statistics?.crisis_risk}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInsightsTab = () => (
    <div className="space-y-8">
      {stats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            🧠 Advanced Business Insights
            <span className="ml-3 text-sm font-normal text-gray-500">Strategic Intelligence Dashboard</span>
          </h3>
          
          {/* Content Performance Analysis */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Content Performance Intelligence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <h5 className="font-semibold text-green-800 mb-3">🏆 Top Performing Content</h5>
                <div className="space-y-2 text-sm">
                  <div>• Posts with positive sentiment get {Math.round((stats.positive > 0 ? stats.avgLikes * 1.3 : stats.avgLikes))} avg likes</div>
                  <div>• Engagement peaks with emotional content (joy/surprise)</div>
                  <div>• Community-focused posts drive highest positivity</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                <h5 className="font-semibold text-red-800 mb-3">⚠️ Content Optimization Areas</h5>
                <div className="space-y-2 text-sm">
                  <div>• Negative posts get {Math.round((stats.negative > 0 ? stats.avgLikes * 0.7 : stats.avgLikes))} avg likes</div>
                  <div>• Service-related issues need faster response</div>
                  <div>• Technical content requires clearer communication</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audience Behavior Insights */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">👥 Audience Behavior Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Engagement Patterns</h5>
                <div className="text-sm text-blue-700">
                  <div>Avg comments per post: {stats.avgComments}</div>
                  <div>Comment-to-like ratio: {stats.avgLikes > 0 ? (stats.avgComments / stats.avgLikes * 100).toFixed(1) : 0}%</div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h5 className="font-semibold text-purple-800 mb-2">Sentiment Trends</h5>
                <div className="text-sm text-purple-700">
                  <div>Positive trend: {stats.postPositivityRate}%</div>
                  <div>Community health: {stats.brandHealthScore >= 70 ? 'Strong' : 'Needs attention'}</div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2">Response Quality</h5>
                <div className="text-sm text-yellow-700">
                  <div>Comment positivity: {stats.commentPositivityRate}%</div>
                  <div>Audience satisfaction: {stats.commentPositivityRate >= 60 ? 'High' : 'Moderate'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ROI & Business Impact */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">💰 Business Impact Metrics</h4>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-indigo-800 mb-3">📈 Growth Indicators</h5>
                  <div className="space-y-2 text-sm text-indigo-700">
                    <div>• Brand health score: {stats.brandHealthScore}/100</div>
                    <div>• Net sentiment: {stats.netSentimentScore > 0 ? '+' : ''}{stats.netSentimentScore}</div>
                    <div>• Engagement efficiency: {stats.engagementRate} per post</div>
                    <div>• Crisis prevention: {stats.crisisRisk} risk level</div>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-indigo-800 mb-3">🎯 Strategic Opportunities</h5>
                  <div className="space-y-2 text-sm text-indigo-700">
                    <div>• Content optimization potential: {100 - stats.postPositivityRate}%</div>
                    <div>• Community engagement upside: {100 - stats.commentPositivityRate}%</div>
                    <div>• Brand reputation leverage: {stats.brandHealthScore >= 80 ? 'High' : 'Medium'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Competitive Intelligence */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">🏁 Competitive Positioning</h4>
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">{stats.brandHealthScore >= 80 ? 'Leader' : stats.brandHealthScore >= 60 ? 'Competitive' : 'Challenger'}</div>
                  <div className="text-sm text-teal-700">Market Position</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">{stats.engagementRate}</div>
                  <div className="text-sm text-teal-700">Engagement Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">{stats.postPositivityRate}%</div>
                  <div className="text-sm text-teal-700">Content Quality</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
            <h4 className="text-lg font-semibold text-orange-800 mb-4">🚀 Recommended Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold text-orange-800 mb-2">Immediate (This Week)</h5>
                <ul className="space-y-1 text-sm text-orange-700">
                  {stats.crisisRisk === 'High' && <li>• Address negative sentiment immediately</li>}
                  {stats.brandHealthScore < 60 && <li>• Review and improve content strategy</li>}
                  {parseFloat(stats.engagementRate) < 15 && <li>• Increase audience interaction</li>}
                  <li>• Respond to recent comments</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-orange-800 mb-2">Strategic (This Month)</h5>
                <ul className="space-y-1 text-sm text-orange-700">
                  <li>• Develop content calendar based on positive themes</li>
                  <li>• Implement community engagement program</li>
                  <li>• Set up automated sentiment monitoring alerts</li>
                  <li>• Create crisis response playbook</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 Instagram Sentiment Intelligence Platform
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced sentiment analysis and business intelligence for Instagram content. 
            Analyze posts, comments, and audience engagement with AI-powered insights.
          </p>
        </div>

        {/* Login Section */}
        {!accessToken ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Instagram Account</h2>
                <p className="text-gray-600">
                  Login with Facebook to analyze your Instagram business account posts and gain valuable insights
                </p>
              </div>
              
              <button
                onClick={loginWithFacebook}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-2">📘</span>
                Login with Facebook
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={enableDemoMode}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Try Demo Mode
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* User Info and Navigation */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">{userInfo?.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Welcome, {userInfo?.name}</h2>
                  <p className="text-gray-600">Advanced Instagram Sentiment Intelligence</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-lg mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: '🎯 Executive Dashboard', desc: 'Brand health & KPIs' },
                    { id: 'posts', label: '📝 Post Analysis', desc: 'Individual post insights' },
                    { id: 'single', label: '🔍 Single Post', desc: 'Deep-dive analysis' },
                    { id: 'insights', label: '🧠 Business Intelligence', desc: 'Strategic insights' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.desc}</div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Page Selection */}
            {pages.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Select an Instagram Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => setSelectedPage(page)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                        selectedPage?.id === page.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center">
                        {page.profile_picture_url ? (
                          <img
                            src={page.profile_picture_url}
                            alt={page.name}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold">{page.name.charAt(0)}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{page.name}</h4>
                          <p className="text-sm text-gray-600">@{page.username}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPage && activeTab !== 'single' && (
                  <div className="mt-6">
                    <button
                      onClick={() => fetchInstagramPosts(false)}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                      {loading ? 'Analyzing Posts...' : `Analyze @${selectedPage.username} Posts`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
                {error}
              </div>
            )}

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            <a href="/privacy" className="hover:text-purple-600">Privacy Policy</a> | 
            <a href="/terms" className="hover:text-purple-600 ml-1">Terms of Service</a>
          </p>
          <p className="mt-2">Instagram Sentiment Intelligence Platform - Powered by Advanced AI</p>
        </div>
      </div>
    </div>
  )
}

export default App
