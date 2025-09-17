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

  // Enhanced sentiment analysis function
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 } }
    
    const lowerText = text.toLowerCase()
    
    // Enhanced keyword lists for better detection
    const positiveWords = [
      'love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'perfect', 'beautiful', 'happy',
      'excited', 'grateful', 'blessed', 'incredible', 'outstanding', 'brilliant', 'fabulous', 'marvelous', 'superb',
      'delighted', 'thrilled', 'ecstatic', 'overjoyed', 'celebration', 'milestone', 'achievement', 'success',
      'inspiring', 'motivating', 'uplifting', 'positive', 'optimistic', 'hopeful', 'encouraging', 'supportive'
    ]
    
    const negativeWords = [
      'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'disappointing', 'frustrated', 'angry', 'sad', 'upset',
      'annoyed', 'furious', 'devastated', 'heartbroken', 'depressed', 'miserable', 'pathetic', 'useless', 'worthless',
      'burned', 'slaughter', 'killed', 'suffering', 'pain', 'cruel', 'abuse', 'torture', 'crisis', 'disaster',
      'problem', 'issue', 'harmful', 'damage', 'destroyed', 'ruined', 'failed', 'broken', 'wrong', 'bad'
    ]
    
    const joyWords = ['happy', 'joy', 'excited', 'celebration', 'party', 'fun', 'laugh', 'smile', 'cheerful', 'delighted']
    const angerWords = ['angry', 'mad', 'furious', 'rage', 'hate', 'disgusting', 'outraged', 'livid', 'burned', 'cruel']
    const sadnessWords = ['sad', 'cry', 'depressed', 'heartbroken', 'miserable', 'suffering', 'pain', 'devastated', 'killed']
    const fearWords = ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'panic', 'crisis', 'disaster', 'harmful']
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
      if (lowerText.includes(word)) positiveScore++
    })
    
    // Count negative words
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++
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
      emotions
    }
  }

  // Demo data
  const demoPages = [
    {
      id: 'demo_account_1',
      name: 'Eco-Friendly Business',
      username: 'eco_business_demo',
      profile_picture_url: 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=ECO'
    }
  ]

  const demoPosts = [
    {
      id: 'demo_post_1',
      caption: 'Absolutely loving our new sustainable packaging! 🌱 Our customers have been so supportive and excited about our eco-friendly initiatives. Thank you for helping us make a positive impact! #sustainability #ecofriendly #grateful',
      media_type: 'IMAGE',
      media_url: 'https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=Eco+Post',
      permalink: 'https://instagram.com/p/demo1',
      timestamp: '2025-09-15T10:00:00+0000',
      like_count: 245,
      comments_count: 18
    },
    {
      id: 'demo_post_2', 
      caption: 'Having some challenges with our supply chain this week. Really frustrated with the delays, but we are working hard to resolve these issues for our customers.',
      media_type: 'IMAGE',
      media_url: 'https://via.placeholder.com/400x400/FF5722/FFFFFF?text=Challenge',
      permalink: 'https://instagram.com/p/demo2',
      timestamp: '2025-09-14T14:30:00+0000',
      like_count: 89,
      comments_count: 12
    }
  ]

  const demoComments = {
    'demo_post_1': [
      {
        id: 'comment_1',
        text: 'This is amazing! Love what you are doing for the environment!',
        username: 'eco_lover_123',
        like_count: 5
      },
      {
        id: 'comment_2',
        text: 'Finally a company that cares about sustainability. Keep up the great work!',
        username: 'green_warrior',
        like_count: 8
      }
    ],
    'demo_post_2': [
      {
        id: 'comment_3',
        text: 'Hope you can resolve this soon. We are waiting for our order.',
        username: 'customer_123',
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
    }
    
    try {
      if (demoMode) {
        // Demo mode
        const newPosts = demoPosts.map(post => ({
          ...post,
          analysis: analyzeSentiment(post.caption)
        }))
        
        if (loadMore) {
          setPosts(prev => [...prev, ...newPosts])
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

  const fetchComments = async (postId) => {
    if (loadingComments[postId]) return
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    
    try {
      if (demoMode) {
        const comments = demoComments[postId] || []
        const analyzedComments = comments.map(comment => ({
          ...comment,
          analysis: analyzeSentiment(comment.text)
        }))
        setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
      } else {
        // Real API call would go here
        setError('Real comment fetching requires server-side implementation')
      }
    } catch (error) {
      setError('Error fetching comments: ' + error.message)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleComments = (postId) => {
    if (!selectedPostComments[postId]) {
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
    
    try {
      // Demo analysis for single post
      const demoSinglePost = {
        id: 'single_post_demo',
        caption: 'Check out this amazing new product launch! We are so excited to share this with our community. Thank you for all your support! 🚀',
        media_type: 'IMAGE',
        media_url: 'https://via.placeholder.com/400x400/2196F3/FFFFFF?text=Single+Post',
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
    
    return {
      totalPosts,
      positivePosts,
      negativePosts,
      neutralPosts,
      avgScore,
      positivityRate,
      totalLikes,
      totalComments,
      avgEngagement
    }
  }

  const stats = calculateOverallStats()

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
          {['overview', 'single-post', 'business-intelligence'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                margin: '0 5px',
                backgroundColor: activeTab === tab ? 'white' : 'rgba(255,255,255,0.2)',
                color: activeTab === tab ? '#667eea' : 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}
            >
              {tab.replace('-', ' ')}
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
                  <p style={{ margin: 0, color: '#1976d2', fontWeight: 'bold' }}>
                    🎭 Demo Mode Active - Showing sample data for demonstration
                  </p>
                </div>
              )}

              {/* Page Selection */}
              {(accessToken || demoMode) && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Select Instagram Business Account</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {(demoMode ? demoPages : pages).map(page => (
                      <div
                        key={page.id}
                        onClick={() => setSelectedPage(page)}
                        style={{
                          padding: '15px',
                          border: selectedPage?.id === page.id ? '3px solid #667eea' : '2px solid #e0e0e0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: selectedPage?.id === page.id ? '#f3f4f6' : 'white'
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
                  {error}
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
                            src={post.media_url}
                            alt="Post"
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px' }}
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
                        
                        {/* Sentiment Analysis */}
                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ 
                              fontSize: '1.5rem',
                              marginRight: '10px'
                            }}>
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
                          
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            <strong>Emotional Breakdown:</strong>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                              <span>😊 Joy: {post.analysis.emotions.joy}%</span>
                              <span>😠 Anger: {post.analysis.emotions.anger}%</span>
                              <span>😢 Sadness: {post.analysis.emotions.sadness}%</span>
                              <span>😨 Fear: {post.analysis.emotions.fear}%</span>
                              <span>😲 Surprise: {post.analysis.emotions.surprise}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Comments Analysis */}
                        <button
                          onClick={() => toggleComments(post.id)}
                          disabled={loadingComments[post.id]}
                          style={{
                            backgroundColor: '#667eea',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '15px'
                          }}
                        >
                          {loadingComments[post.id] ? '🔄 Loading...' : 
                           showComments[post.id] ? '👆 Hide Comments' : '👇 Analyze Comments'}
                        </button>

                        {showComments[post.id] && selectedPostComments[post.id] && (
                          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px' }}>
                            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💬 Comments Analysis</h4>
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
                      src={singlePostAnalysis.media_url}
                      alt="Post"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '10px' }}
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
                        <div style={{ fontSize: '14px', color: '#666' }}>Overall Sentiment Score</div>
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
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                          <div style={{ fontSize: '1.5rem' }}>😲</div>
                          <div style={{ fontWeight: 'bold' }}>Surprise</div>
                          <div style={{ color: '#666' }}>{singlePostAnalysis.analysis.emotions.surprise}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'business-intelligence' && (
            <div>
              <h2 style={{ marginBottom: '20px', color: '#333' }}>🧠 Business Intelligence Dashboard</h2>
              
              {stats ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ backgroundColor: '#e8f5e8', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2e7d32', marginBottom: '10px' }}>
                        {Math.round((stats.positivePosts / stats.totalPosts) * 100)}
                      </div>
                      <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '1.1rem' }}>Brand Health Score</div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
                        Based on positive sentiment ratio
                      </div>
                    </div>
                    
                    <div style={{ backgroundColor: '#e3f2fd', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '10px' }}>
                        {stats.avgEngagement}
                      </div>
                      <div style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1.1rem' }}>Avg Engagement</div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
                        Likes + Comments per post
                      </div>
                    </div>
                    
                    <div style={{ backgroundColor: '#fff3e0', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f57c00', marginBottom: '10px' }}>
                        {stats.negativePosts > 2 ? 'HIGH' : stats.negativePosts > 0 ? 'LOW' : 'NONE'}
                      </div>
                      <div style={{ color: '#f57c00', fontWeight: 'bold', fontSize: '1.1rem' }}>Crisis Risk</div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
                        Based on negative sentiment
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '15px', marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '20px', color: '#333' }}>📈 Strategic Recommendations</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {stats.positivityRate > 70 && (
                        <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '10px', borderLeft: '4px solid #4caf50' }}>
                          <strong style={{ color: '#2e7d32' }}>✅ Excellent Brand Sentiment!</strong>
                          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                            Your content is resonating well with your audience. Consider increasing posting frequency to maintain momentum.
                          </p>
                        </div>
                      )}
                      
                      {stats.positivityRate < 50 && (
                        <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '10px', borderLeft: '4px solid #f44336' }}>
                          <strong style={{ color: '#c62828' }}>⚠️ Sentiment Improvement Needed</strong>
                          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                            Consider reviewing your content strategy. Focus on more positive, engaging content that resonates with your audience.
                          </p>
                        </div>
                      )}
                      
                      {stats.avgEngagement < 50 && (
                        <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
                          <strong style={{ color: '#1976d2' }}>📊 Boost Engagement</strong>
                          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                            Try posting at different times, use more interactive content like polls and questions, and engage more with comments.
                          </p>
                        </div>
                      )}
                      
                      <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '10px', borderLeft: '4px solid #9c27b0' }}>
                        <strong style={{ color: '#7b1fa2' }}>🎯 Content Optimization</strong>
                        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                          Analyze your top-performing posts and replicate successful content themes and formats.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '15px' }}>
                    <h3 style={{ marginBottom: '20px', color: '#333' }}>🎯 Key Performance Indicators</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{stats.totalLikes}</div>
                        <div style={{ color: '#666', fontWeight: 'bold' }}>Total Likes</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{stats.totalComments}</div>
                        <div style={{ color: '#666', fontWeight: 'bold' }}>Total Comments</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{stats.totalPosts}</div>
                        <div style={{ color: '#666', fontWeight: 'bold' }}>Posts Analyzed</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                          {Math.round(stats.avgScore * 100)}%
                        </div>
                        <div style={{ color: '#666', fontWeight: 'bold' }}>Avg Sentiment Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
                  <h3>No Data Available</h3>
                  <p>Please analyze some posts first to see business intelligence insights.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.8)' }}>
          <p>Instagram Sentiment Analysis - Powered by AI</p>
        </div>
      </div>
    </div>
  )
}

export default App
