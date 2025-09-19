import React, { useState, useEffect } from 'react'
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

  // Enhanced sentiment analysis function
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 }, confidence: 0.5 }
    
    const lowerText = text.toLowerCase()
    
    // Enhanced keyword lists for better detection
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
    
    const joyWords = ['happy', 'joy', 'excited', 'celebration', 'party', 'fun', 'laugh', 'smile', 'cheerful', 'delighted']
    const angerWords = ['angry', 'mad', 'furious', 'rage', 'hate', 'disgusting', 'outraged', 'livid', 'annoyed']
    const sadnessWords = ['sad', 'cry', 'depressed', 'heartbroken', 'miserable', 'disappointed', 'regret']
    const fearWords = ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'panic', 'concern', 'nervous']
    const surpriseWords = ['wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'surprising', 'astonishing']
    
    let positiveScore = 0
    let negativeScore = 0
    let joyScore = 0
    let angerScore = 0
    let sadnessScore = 0
    let fearScore = 0
    let surpriseScore = 0
    
    // Count positive words
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) positiveScore += matches.length
    })
    
    // Count negative words
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) negativeScore += matches.length
    })
    
    // Count emotion words
    joyWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) joyScore += matches.length
    })
    angerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) angerScore += matches.length
    })
    sadnessWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) sadnessScore += matches.length
    })
    fearWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) fearScore += matches.length
    })
    surpriseWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) surpriseScore += matches.length
    })
    
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
    
    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score))
    
    return { 
      sentiment, 
      score, 
      emotions,
      confidence
    }
  }

  // Enhanced demo data with more posts and comments
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

  // Helper function to generate consistent image URLs
  function getImageUrl(type, id, width = 400, height = 400) {
    const seed = `${type}_${id}`
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const imageId = Math.abs(hash) % 1000 + 1
    
    if (type === 'profile') {
      // Use UI Avatars for profile pictures
      const names = ['Eco Business', 'Generation Vegan', 'Green Life', 'Sustainable Co']
      const name = names[id % names.length]
      const colors = ['4CAF50', '2196F3', 'FF9800', '9C27B0']
      const color = colors[id % colors.length]
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=${color}&color=fff&bold=true`
    } else {
      // Use Picsum for post images with consistent IDs
      return `https://picsum.photos/seed/${seed}/${width}/${height}`
    }
  }

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

  const demoComments = {
    'demo_post_1': [
      {
        id: 'comment_1_1',
        text: 'This is amazing! Love what you are doing for the environment! Keep up the fantastic work! 🌍',
        username: 'eco_lover_123',
        like_count: 15
      },
      {
        id: 'comment_1_2',
        text: 'Finally a company that cares about sustainability. Your packaging is beautiful and functional!',
        username: 'green_warrior',
        like_count: 23
      },
      {
        id: 'comment_1_3',
        text: 'Just received my order and I am so impressed with the packaging! Zero waste achieved! 🎉',
        username: 'zero_waste_mom',
        like_count: 18
      },
      {
        id: 'comment_1_4',
        text: 'Thank you for making sustainable choices accessible and affordable for everyone!',
        username: 'conscious_consumer',
        like_count: 12
      },
      {
        id: 'comment_1_5',
        text: 'This gives me hope for the future! More companies should follow your example.',
        username: 'future_focused',
        like_count: 9
      }
    ],
    'demo_post_2': [
      {
        id: 'comment_2_1',
        text: 'Hope you can resolve this soon. We are waiting for our order but understand these things happen.',
        username: 'patient_customer',
        like_count: 8
      },
      {
        id: 'comment_2_2',
        text: 'Supply chain issues are everywhere right now. Appreciate the transparency and communication!',
        username: 'understanding_buyer',
        like_count: 12
      },
      {
        id: 'comment_2_3',
        text: 'Frustrated with the delay but I know you will make it right. Looking forward to the resolution.',
        username: 'loyal_customer',
        like_count: 5
      },
      {
        id: 'comment_2_4',
        text: 'These delays are really disappointing. I need my order for an event next week.',
        username: 'urgent_buyer',
        like_count: 3
      }
    ],
    'demo_post_3': [
      {
        id: 'comment_3_1',
        text: 'Love supporting local farmers! This partnership sounds incredible and beneficial for everyone! 🚜',
        username: 'farm_supporter',
        like_count: 20
      },
      {
        id: 'comment_3_2',
        text: 'Fresh, local, organic - everything I look for in a brand! Excited to try the new products!',
        username: 'organic_enthusiast',
        like_count: 16
      },
      {
        id: 'comment_3_3',
        text: 'Community partnerships like this are what make businesses truly special. Well done!',
        username: 'community_advocate',
        like_count: 14
      },
      {
        id: 'comment_3_4',
        text: 'Supporting local farmers while getting quality products? Count me in! 🙌',
        username: 'local_supporter',
        like_count: 11
      },
      {
        id: 'comment_3_5',
        text: 'This is exactly the kind of business model we need more of. Sustainable and community-focused!',
        username: 'sustainability_expert',
        like_count: 18
      }
    ],
    'demo_post_4': [
      {
        id: 'comment_4_1',
        text: 'Quality control is so important! Thanks for showing us behind the scenes.',
        username: 'quality_conscious',
        like_count: 7
      },
      {
        id: 'comment_4_2',
        text: 'Transparency in manufacturing is refreshing. This builds so much trust!',
        username: 'trust_builder',
        like_count: 9
      },
      {
        id: 'comment_4_3',
        text: 'Love seeing the care that goes into each product. No wonder the quality is so high!',
        username: 'detail_oriented',
        like_count: 6
      }
    ],
    'demo_post_5': [
      {
        id: 'comment_5_1',
        text: 'Sarah\'s story is so inspiring! Your products really do make a difference in people\'s lives! ✨',
        username: 'inspired_customer',
        like_count: 25
      },
      {
        id: 'comment_5_2',
        text: 'Customer stories like this show the real impact of sustainable choices. Amazing work!',
        username: 'impact_focused',
        like_count: 19
      },
      {
        id: 'comment_5_3',
        text: 'I have a similar story! Your products helped my family reduce waste by 80%! 🌱',
        username: 'waste_reducer',
        like_count: 22
      },
      {
        id: 'comment_5_4',
        text: 'Love seeing real customer success stories. This motivates me to make better choices too!',
        username: 'motivated_buyer',
        like_count: 15
      },
      {
        id: 'comment_5_5',
        text: 'Sarah from Portland here! Thank you for featuring my story! Your products are life-changing! 💚',
        username: 'sarah_portland',
        like_count: 45
      }
    ]
  }

  // Initialize Facebook SDK
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
    }
    
    try {
      if (demoMode) {
        // Demo mode - show all posts with analysis
        const newPosts = demoPosts.map(post => ({
          ...post,
          analysis: analyzeSentiment(post.caption)
        }))
        
        if (loadMore) {
          setPosts(prev => [...prev, ...newPosts])
        } else {
          setPosts(newPosts)
        }
        setHasMorePosts(false) // No more posts to load in demo
      } else if (selectedPage && accessToken) {
        // Real Instagram API call
        const instagramAccountId = selectedPage.instagram_business_account?.id || selectedPage.id
        const fields = 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count'
        const limit = 25
        
        let url = `/${instagramAccountId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
        if (loadMore && nextCursor) {
          url += `&after=${nextCursor}`
        }
        
        window.FB.api(url, (response) => {
          if (response && !response.error) {
            const newPosts = response.data.map(post => ({
              ...post,
              analysis: analyzeSentiment(post.caption || '')
            }))
            
            if (loadMore) {
              setPosts(prev => [...prev, ...newPosts])
            } else {
              setPosts(newPosts)
            }
            
            // Set pagination cursor
            if (response.paging && response.paging.cursors && response.paging.cursors.after) {
              setNextCursor(response.paging.cursors.after)
              setHasMorePosts(true)
            } else {
              setHasMorePosts(false)
            }
          } else {
            // If API fails, show demo data as fallback
            const newPosts = demoPosts.map(post => ({
              ...post,
              analysis: analyzeSentiment(post.caption)
            }))
            
            if (loadMore) {
              setPosts(prev => [...prev, ...newPosts])
            } else {
              setPosts(newPosts)
            }
            setHasMorePosts(false)
            setError('Using demo data - Instagram API permissions may need approval')
          }
        })
      } else {
        setError('Please login and select an Instagram account first')
      }
    } catch (error) {
      setError('Error fetching posts: ' + error.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchComments = async (postId) => {
    if (loadingComments[postId]) return
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    
    try {
      if (demoMode) {
        // Demo mode - get comments for this post
        const comments = demoComments[postId] || []
        const analyzedComments = comments.map(comment => ({
          ...comment,
          analysis: analyzeSentiment(comment.text)
        }))
        setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
        setShowComments(prev => ({ ...prev, [postId]: true }))
      } else if (accessToken) {
        // Real Instagram API call
        window.FB.api(`/${postId}/comments`, { fields: 'id,text,username,like_count' }, (response) => {
          if (response && !response.error && response.data) {
            const analyzedComments = response.data.map(comment => ({
              ...comment,
              analysis: analyzeSentiment(comment.text)
            }))
            setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
            setShowComments(prev => ({ ...prev, [postId]: true }))
          } else {
            // Fallback to demo comments if API fails
            const comments = demoComments[postId] || []
            const analyzedComments = comments.map(comment => ({
              ...comment,
              analysis: analyzeSentiment(comment.text)
            }))
            setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
            setShowComments(prev => ({ ...prev, [postId]: true }))
          }
        })
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      // Fallback to demo comments
      const comments = demoComments[postId] || []
      const analyzedComments = comments.map(comment => ({
        ...comment,
        analysis: analyzeSentiment(comment.text)
      }))
      setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
      setShowComments(prev => ({ ...prev, [postId]: true }))
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handlePageSelect = (page) => {
    setSelectedPage(page)
    setError('')
    // Auto-fetch posts when page is selected
    setTimeout(() => {
      fetchInstagramPosts()
    }, 500)
  }

  const handleDemoMode = () => {
    setDemoMode(true)
    setSelectedPage(demoPages[0])
    setError('')
    // Auto-fetch demo posts
    setTimeout(() => {
      fetchInstagramPosts()
    }, 500)
  }

  // Calculate overall statistics
  const calculateOverallStats = () => {
    if (posts.length === 0) {
      return {
        totalPosts: 0,
        avgSentiment: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalEngagement: 0
      }
    }

    const totalPosts = posts.length
    const sentimentScores = posts.map(post => post.analysis?.score || 0.5)
    const avgSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / totalPosts
    
    const positiveCount = posts.filter(post => post.analysis?.sentiment === 'positive').length
    const negativeCount = posts.filter(post => post.analysis?.sentiment === 'negative').length
    const neutralCount = posts.filter(post => post.analysis?.sentiment === 'neutral').length
    
    const totalEngagement = posts.reduce((sum, post) => sum + (post.like_count || 0) + (post.comments_count || 0), 0)

    return {
      totalPosts,
      avgSentiment,
      positiveCount,
      negativeCount,
      neutralCount,
      totalEngagement
    }
  }

  const stats = calculateOverallStats()

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

              {/* Login Section */}
              {!accessToken && !demoMode && (
                <div className="login-container">
                  <div className="login-card">
                    <h2>Connect Your Instagram Business Account</h2>
                    <div className="login-options">
                      <button
                        onClick={loginWithFacebook}
                        className="facebook-login-btn"
                      >
                        <span className="btn-icon">🔗</span>
                        Login with Facebook
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
              {(accessToken || demoMode) && !selectedPage && (
                <div className="account-selection">
                  <h2>Select Instagram Business Account</h2>
                  {(demoMode ? demoPages : pages).map(page => (
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
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className="profile-pic-fallback" style={{display: 'none'}}>
                        {page.name.charAt(0)}
                      </div>
                      <div className="page-info">
                        <h3>{page.name}</h3>
                        <p>@{page.username || 'instagram_account'}</p>
                      </div>
                    </div>
                  ))}
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
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                            <div className="post-image-fallback" style={{display: 'none'}}>
                              <span>📷</span>
                              <span>Image Unavailable</span>
                            </div>
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
                            
                            {showComments[post.id] && selectedPostComments[post.id] && (
                              <div className="comments-analysis">
                                <h4>Comments Analysis ({selectedPostComments[post.id].length} comments)</h4>
                                <div className="comments-list">
                                  {selectedPostComments[post.id].map(comment => (
                                    <div key={comment.id} className="comment-item">
                                      <div className="comment-header">
                                        <strong>@{comment.username}</strong>
                                        <span className={`comment-sentiment ${comment.analysis?.sentiment || 'neutral'}`}>
                                          {comment.analysis?.sentiment || 'neutral'}
                                        </span>
                                      </div>
                                      <div className="comment-text">{comment.text}</div>
                                      <div className="comment-likes">❤️ {comment.like_count || 0} likes</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Loading State */}
              {loading && (
                <div className="loading-container">
                  <div className="loading-spinner">⏳</div>
                  <p>Loading posts...</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Analyze Button */}
              {selectedPage && posts.length === 0 && !loading && (
                <button
                  onClick={() => fetchInstagramPosts()}
                  className="analyze-btn"
                  disabled={loading}
                >
                  📊 Analyze Posts
                </button>
              )}
            </>
          )}

          {activeTab === 'single-post' && (
            <div className="single-post-analysis">
              <h2>Single Post Analysis</h2>
              <p>Analyze individual Instagram posts by URL</p>
              <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔍</div>
                <h3>Coming Soon</h3>
                <p>Single post analysis feature will be available in the next update.</p>
              </div>
            </div>
          )}

          {activeTab === 'business-intelligence' && (
            <div className="business-intelligence">
              <h2>Business Intelligence Dashboard</h2>
              {posts.length > 0 ? (
                <div className="bi-content">
                  <div className="metrics-grid">
                    <div className="metric-card info">
                      <div className="metric-number">{Math.round(stats.avgSentiment * 100)}%</div>
                      <div className="metric-label">Brand Health Score</div>
                    </div>
                    <div className="metric-card positive">
                      <div className="metric-number">{Math.round((stats.positiveCount / stats.totalPosts) * 100)}%</div>
                      <div className="metric-label">Positive Sentiment</div>
                    </div>
                    <div className="metric-card negative">
                      <div className="metric-number">{Math.round((stats.negativeCount / stats.totalPosts) * 100)}%</div>
                      <div className="metric-label">Negative Sentiment</div>
                    </div>
                    <div className="metric-card info">
                      <div className="metric-number">{stats.totalEngagement}</div>
                      <div className="metric-label">Total Engagement</div>
                    </div>
                  </div>
                  
                  <div style={{marginTop: '2rem', padding: '2rem', background: 'var(--secondary-bg)', borderRadius: '12px'}}>
                    <h3>Strategic Insights</h3>
                    <ul style={{listStyle: 'none', padding: 0}}>
                      <li style={{marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', borderLeft: '4px solid var(--success)'}}>
                        <strong>✅ Strength:</strong> {stats.positiveCount > stats.negativeCount ? 'Positive sentiment dominates your content' : 'Opportunity to increase positive engagement'}
                      </li>
                      <li style={{marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', borderLeft: '4px solid var(--info)'}}>
                        <strong>📊 Insight:</strong> Average engagement per post: {Math.round(stats.totalEngagement / stats.totalPosts)} interactions
                      </li>
                      <li style={{marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', borderLeft: '4px solid var(--warning)'}}>
                        <strong>🎯 Recommendation:</strong> {stats.negativeCount > 0 ? 'Monitor negative posts for crisis management opportunities' : 'Maintain current positive content strategy'}
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                  <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📊</div>
                  <h3>No Data Available</h3>
                  <p>Please analyze some posts first to see business intelligence insights.</p>
                </div>
              )}
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
