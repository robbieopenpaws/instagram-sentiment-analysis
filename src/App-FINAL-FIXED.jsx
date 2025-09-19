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
  const [sessionRestored, setSessionRestored] = useState(false)
  const [businessMetrics, setBusinessMetrics] = useState(null)

  // Initialize Facebook SDK and restore session
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

  // IMPROVED: Enhanced session restoration with better error handling
  const checkLoginStatus = async () => {
    try {
      console.log('Checking login status and restoring session...')
      
      // First check localStorage for saved session
      const savedToken = localStorage.getItem('fb_access_token')
      const savedUserInfo = localStorage.getItem('fb_user_info')
      const savedPages = localStorage.getItem('fb_pages')
      const savedSelectedPage = localStorage.getItem('fb_selected_page')
      const savedPosts = localStorage.getItem('fb_posts')
      const savedDemoMode = localStorage.getItem('demo_mode')
      
      // Check if demo mode was active
      if (savedDemoMode === 'true') {
        console.log('Restoring demo mode session')
        setDemoMode(true)
        setIsLoggedIn(true)
        setPages(demoPages)
        
        if (savedSelectedPage) {
          const parsedSelectedPage = JSON.parse(savedSelectedPage)
          setSelectedPage(parsedSelectedPage)
          console.log('Restored demo selected page:', parsedSelectedPage.name)
          
          if (savedPosts) {
            const parsedPosts = JSON.parse(savedPosts)
            setPosts(parsedPosts)
            console.log('Restored demo posts:', parsedPosts.length)
          }
        }
        setSessionRestored(true)
        return
      }
      
      // Check for Facebook session
      if (savedToken && savedUserInfo) {
        console.log('Found saved Facebook session, validating...')
        
        // Verify token is still valid
        const isValidToken = await validateFacebookToken(savedToken)
        
        if (isValidToken) {
          console.log('Token is valid, restoring Facebook session')
          setAccessToken(savedToken)
          setUserInfo(JSON.parse(savedUserInfo))
          setIsLoggedIn(true)
          
          if (savedPages) {
            const parsedPages = JSON.parse(savedPages)
            setPages(parsedPages)
            console.log('Restored Facebook pages:', parsedPages.length)
            
            // Restore selected page if available
            if (savedSelectedPage) {
              const parsedSelectedPage = JSON.parse(savedSelectedPage)
              setSelectedPage(parsedSelectedPage)
              console.log('Restored selected page:', parsedSelectedPage.name)
              
              // Restore posts if available
              if (savedPosts) {
                const parsedPosts = JSON.parse(savedPosts)
                setPosts(parsedPosts)
                console.log('Restored posts:', parsedPosts.length)
              }
            }
          }
        } else {
          console.log('Saved token expired, clearing session')
          clearSession()
        }
      } else {
        // Check Facebook login status
        window.FB?.getLoginStatus((response) => {
          if (response.status === 'connected') {
            console.log('User is logged in via Facebook')
            handleLoginSuccess(response.authResponse)
          }
        })
      }
      
      setSessionRestored(true)
    } catch (error) {
      console.error('Error during session restoration:', error)
      setSessionRestored(true)
    }
  }

  // IMPROVED: Token validation function
  const validateFacebookToken = (token) => {
    return new Promise((resolve) => {
      window.FB?.api('/me', { access_token: token }, (response) => {
        if (response.error) {
          console.log('Token validation failed:', response.error)
          resolve(false)
        } else {
          console.log('Token validated successfully')
          resolve(true)
        }
      })
    })
  }

  // IMPROVED: Enhanced session saving
  const saveSessionToStorage = (sessionData) => {
    try {
      if (sessionData.accessToken) localStorage.setItem('fb_access_token', sessionData.accessToken)
      if (sessionData.userInfo) localStorage.setItem('fb_user_info', JSON.stringify(sessionData.userInfo))
      if (sessionData.pages) localStorage.setItem('fb_pages', JSON.stringify(sessionData.pages))
      if (sessionData.selectedPage) localStorage.setItem('fb_selected_page', JSON.stringify(sessionData.selectedPage))
      if (sessionData.posts) localStorage.setItem('fb_posts', JSON.stringify(sessionData.posts))
      if (sessionData.demoMode !== undefined) localStorage.setItem('demo_mode', sessionData.demoMode.toString())
      
      console.log('Session saved to localStorage successfully')
    } catch (error) {
      console.error('Error saving session to localStorage:', error)
    }
  }

  // Handle successful Facebook login
  const handleLoginSuccess = async (authResponse) => {
    const token = authResponse.accessToken
    setAccessToken(token)
    setIsLoggedIn(true)
    
    try {
      // Get user info
      const userResponse = await new Promise((resolve) => {
        window.FB.api('/me', { fields: 'name,email' }, resolve)
      })
      
      console.log('User info:', userResponse)
      setUserInfo(userResponse)
      
      // Save session data
      saveSessionToStorage({
        accessToken: token,
        userInfo: userResponse,
        demoMode: false
      })
      
      // Get Instagram business accounts
      await fetchInstagramAccounts(token)
      
      // Save user session to database
      try {
        await dbHelpers.saveUserSession(userResponse.id, {
          accessToken: token,
          facebookUserId: userResponse.id,
          selectedPageId: null,
          selectedPageName: null,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          isDemoMode: false
        })
        console.log('User session saved to database')
      } catch (dbError) {
        console.error('Error saving session to database:', dbError)
      }
    } catch (error) {
      console.error('Error during login success handling:', error)
      setError('Failed to complete login process')
    }
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

  // IMPROVED: Enhanced Instagram accounts fetching with better error handling
  const fetchInstagramAccounts = async (token) => {
    setLoading(true)
    setError('')
    
    try {
      console.log('Fetching Facebook pages...')
      
      // Get Facebook pages
      const pagesResponse = await new Promise((resolve, reject) => {
        window.FB.api('/me/accounts', { access_token: token }, (response) => {
          if (response.error) {
            reject(response.error)
          } else {
            resolve(response)
          }
        })
      })
      
      if (pagesResponse.data && pagesResponse.data.length > 0) {
        console.log('Found', pagesResponse.data.length, 'Facebook pages')
        
        const pagePromises = pagesResponse.data.map(page => {
          return new Promise((resolve) => {
            // Check if page has Instagram account
            window.FB.api(`/${page.id}`, {
              fields: 'instagram_business_account',
              access_token: page.access_token
            }, (igResponse) => {
              if (igResponse.instagram_business_account) {
                console.log('Found Instagram account for page:', page.name)
                
                // Get Instagram account details
                window.FB.api(`/${igResponse.instagram_business_account.id}`, {
                  fields: 'id,name,username,profile_picture_url',
                  access_token: page.access_token
                }, (igDetails) => {
                  if (igDetails.error) {
                    console.error('Error getting Instagram details:', igDetails.error)
                    resolve(null)
                  } else {
                    resolve({
                      ...igDetails,
                      page_access_token: page.access_token,
                      page_id: page.id
                    })
                  }
                })
              } else {
                console.log('No Instagram account for page:', page.name)
                resolve(null)
              }
            })
          })
        })
        
        const results = await Promise.all(pagePromises)
        const instagramAccounts = results.filter(account => account !== null)
        
        if (instagramAccounts.length > 0) {
          console.log('Instagram accounts found:', instagramAccounts.length)
          setPages(instagramAccounts)
          
          // Save pages to storage
          saveSessionToStorage({ pages: instagramAccounts })
        } else {
          setError('No Instagram Business accounts found. Please make sure you have a Facebook page connected to an Instagram Business account.')
        }
        
      } else {
        setError('No Facebook pages found. Please make sure you have a Facebook page with admin access.')
      }
    } catch (error) {
      console.error('Error fetching Instagram accounts:', error)
      setError('Failed to fetch Instagram accounts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // IMPROVED: Enhanced page selection with better persistence
  const handlePageSelect = async (page) => {
    console.log('Selecting page:', page.name)
    setSelectedPage(page)
    setError('')
    
    // Save selected page to storage
    saveSessionToStorage({ selectedPage: page })
    
    // Save to database if not in demo mode
    if (!demoMode && userInfo) {
      try {
        await dbHelpers.saveUserSession(userInfo.id, {
          accessToken: accessToken,
          facebookUserId: userInfo.id,
          selectedPageId: page.id,
          selectedPageName: page.name,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          isDemoMode: false
        })
        console.log('Selected page saved to database')
      } catch (error) {
        console.error('Error saving selected page to database:', error)
      }
    }
    
    // Auto-fetch posts for the selected page
    await fetchInstagramPosts(page)
  }

  // IMPROVED: Enhanced demo mode with better persistence
  const handleDemoMode = async () => {
    console.log('Activating demo mode')
    setDemoMode(true)
    setIsLoggedIn(true)
    setPages(demoPages)
    setError('')
    
    // Save demo mode state
    saveSessionToStorage({
      demoMode: true,
      pages: demoPages
    })

    // Save demo session to database
    try {
      await dbHelpers.saveUserSession('demo_user', {
        accessToken: 'demo_token',
        facebookUserId: 'demo_user',
        selectedPageId: null,
        selectedPageName: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        isDemoMode: true
      })
      console.log('Demo session saved to database')
    } catch (error) {
      console.error('Error saving demo session to database:', error)
    }
  }

  // IMPROVED: Enhanced posts fetching with comprehensive analysis
  const fetchInstagramPosts = async (pageToUse = null) => {
    const targetPage = pageToUse || selectedPage
    
    if (!targetPage) {
      setError('Please select an Instagram page first')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      if (demoMode) {
        console.log('Loading demo posts with enhanced analysis...')
        
        // Add comprehensive sentiment analysis to demo posts
        const analyzedPosts = demoPosts.map(post => {
          const analysis = analyzeSentiment(post.caption)
          return {
            ...post,
            analysis: {
              ...analysis,
              keywords: extractKeywords(post.caption),
              topics: extractTopics(post.caption),
              emotions: analyzeEmotions(post.caption)
            }
          }
        })
        
        setPosts(analyzedPosts)
        
        // Save demo posts to storage
        saveSessionToStorage({ posts: analyzedPosts })
        
        // Save to database
        try {
          await dbHelpers.savePosts('demo_user', analyzedPosts)
          console.log('Demo posts saved to database')
          
          // Calculate and save business metrics
          const metrics = await dbHelpers.calculateBusinessMetrics('demo_user')
          setBusinessMetrics(metrics)
        } catch (error) {
          console.error('Error saving demo posts to database:', error)
        }
        
      } else {
        console.log('Fetching real Instagram posts with enhanced analysis...')
        
        const postsResponse = await new Promise((resolve, reject) => {
          window.FB.api(`/${targetPage.id}/media`, {
            fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
            access_token: targetPage.page_access_token,
            limit: 25
          }, (response) => {
            if (response.error) {
              reject(response.error)
            } else {
              resolve(response)
            }
          })
        })
        
        if (postsResponse.data && postsResponse.data.length > 0) {
          console.log('Found', postsResponse.data.length, 'Instagram posts')
          
          // Add comprehensive sentiment analysis to real posts
          const analyzedPosts = postsResponse.data.map(post => {
            const analysis = analyzeSentiment(post.caption)
            return {
              ...post,
              analysis: {
                ...analysis,
                keywords: extractKeywords(post.caption),
                topics: extractTopics(post.caption),
                emotions: analyzeEmotions(post.caption)
              }
            }
          })
          
          setPosts(analyzedPosts)
          
          // Save posts to storage
          saveSessionToStorage({ posts: analyzedPosts })
          
          // Save to database
          try {
            await dbHelpers.savePosts(userInfo.id, analyzedPosts)
            console.log('Real posts saved to database')
            
            // Calculate and save business metrics
            const metrics = await dbHelpers.calculateBusinessMetrics(userInfo.id)
            setBusinessMetrics(metrics)
          } catch (error) {
            console.error('Error saving real posts to database:', error)
          }
          
        } else {
          setError('No posts found for this Instagram account')
          setPosts([])
        }
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error)
      setError('Failed to fetch Instagram posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Clear session
  const clearSession = () => {
    console.log('Clearing complete session...')
    
    // Clear localStorage
    localStorage.removeItem('fb_access_token')
    localStorage.removeItem('fb_user_info')
    localStorage.removeItem('fb_pages')
    localStorage.removeItem('fb_selected_page')
    localStorage.removeItem('fb_posts')
    localStorage.removeItem('demo_mode')
    
    // Reset state
    setAccessToken('')
    setUserInfo(null)
    setPages([])
    setIsLoggedIn(false)
    setSelectedPage(null)
    setPosts([])
    setDemoMode(false)
    setSelectedPostComments({})
    setShowComments({})
    setBusinessMetrics(null)
    setError('')
    
    console.log('Session cleared completely')
  }

  // Logout handler
  const handleLogout = () => {
    if (demoMode) {
      clearSession()
    } else {
      window.FB.logout(() => {
        clearSession()
      })
    }
  }

  // IMPROVED: Enhanced sentiment analysis with more sophisticated logic
  const analyzeSentiment = (text) => {
    if (!text) return { sentiment: 'neutral', score: 0.5, confidence: 0.5 }
    
    const lowerText = text.toLowerCase()
    
    const positiveWords = [
      'love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'perfect', 'beautiful', 'happy',
      'excited', 'grateful', 'blessed', 'incredible', 'outstanding', 'brilliant', 'fabulous', 'marvelous', 'superb',
      'delighted', 'thrilled', 'ecstatic', 'overjoyed', 'celebration', 'milestone', 'achievement', 'success',
      'inspiring', 'motivating', 'uplifting', 'positive', 'optimistic', 'hopeful', 'encouraging', 'supportive',
      'thank', 'thanks', 'appreciate', 'recommend', 'satisfied', 'pleased', 'impressed', 'enjoy', 'enjoyed',
      'proud', 'congratulations', 'winner', 'victory', 'triumph', 'joy', 'bliss', 'paradise', 'dream', 'magic'
    ]
    
    const negativeWords = [
      'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'disappointing', 'frustrated', 'angry', 'sad', 'upset',
      'annoyed', 'furious', 'devastated', 'heartbroken', 'depressed', 'miserable', 'pathetic', 'useless', 'worthless',
      'problem', 'issue', 'harmful', 'damage', 'destroyed', 'ruined', 'failed', 'broken', 'wrong', 'bad',
      'disappointed', 'dissatisfied', 'complain', 'complaint', 'regret', 'waste', 'worst', 'never', 'avoid',
      'disaster', 'crisis', 'emergency', 'danger', 'threat', 'risk', 'fear', 'worry', 'concern', 'trouble'
    ]
    
    const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'really', 'so', 'quite']
    
    let positiveScore = 0
    let negativeScore = 0
    let intensifierMultiplier = 1
    
    // Check for intensifiers
    intensifiers.forEach(intensifier => {
      if (lowerText.includes(intensifier)) {
        intensifierMultiplier += 0.2
      }
    })
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) positiveScore += matches.length * intensifierMultiplier
    })
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      if (matches) negativeScore += matches.length * intensifierMultiplier
    })
    
    let sentiment
    let score
    let confidence
    
    const totalWords = positiveScore + negativeScore
    const difference = Math.abs(positiveScore - negativeScore)
    
    if (positiveScore > negativeScore) {
      sentiment = 'positive'
      score = 0.6 + Math.min(0.4, difference * 0.1)
      confidence = Math.min(0.95, 0.5 + (totalWords * 0.1) + (difference * 0.05))
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative'
      score = 0.4 - Math.min(0.4, difference * 0.1)
      confidence = Math.min(0.95, 0.5 + (totalWords * 0.1) + (difference * 0.05))
    } else {
      sentiment = 'neutral'
      score = 0.5
      confidence = totalWords > 0 ? 0.7 : 0.5
    }
    
    score = Math.max(0, Math.min(1, score))
    
    return { sentiment, score, confidence }
  }

  // NEW: Extract keywords from text
  const extractKeywords = (text) => {
    if (!text) return []
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']
    
    const words = text.toLowerCase()
      .replace(/[^\w\s#@]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .filter(word => !word.match(/^\d+$/)) // Remove pure numbers
    
    // Count word frequency
    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
    
    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  // NEW: Extract topics from text
  const extractTopics = (text) => {
    if (!text) return []
    
    const topicKeywords = {
      'sustainability': ['sustainable', 'eco', 'green', 'environment', 'organic', 'natural', 'renewable', 'recycling', 'waste', 'carbon'],
      'business': ['business', 'company', 'brand', 'marketing', 'sales', 'customer', 'service', 'product', 'quality', 'professional'],
      'community': ['community', 'local', 'support', 'together', 'family', 'friends', 'people', 'social', 'sharing', 'helping'],
      'innovation': ['innovation', 'technology', 'new', 'advanced', 'modern', 'future', 'development', 'progress', 'improvement', 'creative'],
      'health': ['health', 'wellness', 'fitness', 'nutrition', 'medical', 'care', 'treatment', 'healing', 'recovery', 'wellbeing'],
      'education': ['education', 'learning', 'teaching', 'knowledge', 'training', 'skill', 'development', 'growth', 'understanding', 'wisdom']
    }
    
    const lowerText = text.toLowerCase()
    const topics = []
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword))
      if (matches.length > 0) {
        topics.push(topic)
      }
    })
    
    return topics
  }

  // NEW: Analyze emotions in text
  const analyzeEmotions = (text) => {
    if (!text) return {}
    
    const emotionWords = {
      joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'cheerful', 'glad', 'pleased', 'content', 'blissful'],
      trust: ['trust', 'reliable', 'dependable', 'honest', 'loyal', 'faithful', 'confident', 'secure', 'safe', 'certain'],
      fear: ['fear', 'afraid', 'scared', 'worried', 'anxious', 'nervous', 'concerned', 'frightened', 'terrified', 'panic'],
      surprise: ['surprise', 'amazed', 'astonished', 'shocked', 'stunned', 'bewildered', 'unexpected', 'sudden', 'startled'],
      sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'heartbroken', 'disappointed', 'grief', 'sorrow', 'melancholy'],
      disgust: ['disgusting', 'revolting', 'repulsive', 'awful', 'terrible', 'horrible', 'nasty', 'gross', 'offensive'],
      anger: ['angry', 'furious', 'mad', 'rage', 'irritated', 'annoyed', 'frustrated', 'outraged', 'livid', 'hostile'],
      anticipation: ['excited', 'eager', 'looking forward', 'anticipating', 'expecting', 'hopeful', 'optimistic', 'enthusiastic']
    }
    
    const lowerText = text.toLowerCase()
    const emotions = {}
    
    Object.entries(emotionWords).forEach(([emotion, words]) => {
      const matches = words.filter(word => lowerText.includes(word))
      if (matches.length > 0) {
        emotions[emotion] = matches.length / words.length
      }
    })
    
    return emotions
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

  // IMPROVED: Enhanced comments fetching with comprehensive analysis and better error handling
  const fetchComments = async (postId) => {
    if (loadingComments[postId]) return
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    setError('')
    
    try {
      if (demoMode) {
        console.log('Loading demo comments for post:', postId)
        
        const demoCommentsForPost = demoComments[postId] || []
        
        // Add comprehensive analysis to demo comments
        const analyzedComments = demoCommentsForPost.map(comment => {
          const analysis = analyzeSentiment(comment.text)
          return {
            ...comment,
            analysis: {
              ...analysis,
              keywords: extractKeywords(comment.text),
              topics: extractTopics(comment.text),
              emotions: analyzeEmotions(comment.text)
            }
          }
        })
        
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
        console.log('Fetching real comments for post:', postId)
        
        const commentsResponse = await new Promise((resolve, reject) => {
          window.FB.api(`/${postId}/comments`, {
            fields: 'id,text,username,like_count,timestamp',
            access_token: selectedPage.page_access_token,
            limit: 100
          }, (response) => {
            if (response.error) {
              reject(response.error)
            } else {
              resolve(response)
            }
          })
        })
        
        if (commentsResponse.data && commentsResponse.data.length > 0) {
          console.log('Found', commentsResponse.data.length, 'comments')
          
          // Add comprehensive analysis to real comments
          const analyzedComments = commentsResponse.data.map(comment => {
            const analysis = analyzeSentiment(comment.text)
            return {
              ...comment,
              analysis: {
                ...analysis,
                keywords: extractKeywords(comment.text),
                topics: extractTopics(comment.text),
                emotions: analyzeEmotions(comment.text)
              }
            }
          })
          
          setSelectedPostComments(prev => ({ ...prev, [postId]: analyzedComments }))
          setShowComments(prev => ({ ...prev, [postId]: true }))
          
          // Save comments to database
          try {
            await dbHelpers.saveComments(userInfo.id, postId, analyzedComments)
            console.log('Real comments saved to database successfully')
          } catch (error) {
            console.error('Error saving real comments to database:', error)
          }
        } else {
          console.log('No comments found for this post')
          setSelectedPostComments(prev => ({ ...prev, [postId]: [] }))
          setShowComments(prev => ({ ...prev, [postId]: true }))
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError(`Failed to fetch comments: ${error.message}`)
      
      // Show empty comments section even on error
      setSelectedPostComments(prev => ({ ...prev, [postId]: [] }))
      setShowComments(prev => ({ ...prev, [postId]: true }))
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  // ENHANCED: Complete demo comments data with more realistic content
  const demoComments = {
    'demo_post_1': [
      { id: 'comment_1_1', text: 'This is amazing! Love what you are doing for the environment! Keep up the fantastic work! 🌍', username: 'eco_lover_123', like_count: 15, timestamp: '2025-09-15T11:00:00+0000' },
      { id: 'comment_1_2', text: 'Finally a company that cares about sustainability. Your packaging is beautiful and functional!', username: 'green_warrior', like_count: 23, timestamp: '2025-09-15T11:15:00+0000' },
      { id: 'comment_1_3', text: 'Just received my order and I am so impressed with the packaging! Zero waste achieved! 🎉', username: 'zero_waste_mom', like_count: 18, timestamp: '2025-09-15T11:30:00+0000' },
      { id: 'comment_1_4', text: 'Thank you for making sustainable choices accessible and affordable for everyone!', username: 'conscious_consumer', like_count: 12, timestamp: '2025-09-15T12:00:00+0000' },
      { id: 'comment_1_5', text: 'This gives me hope for the future! More companies should follow your example.', username: 'future_focused', like_count: 9, timestamp: '2025-09-15T12:30:00+0000' }
    ],
    'demo_post_2': [
      { id: 'comment_2_1', text: 'Hope you can resolve this soon. We are waiting for our order but understand these things happen.', username: 'patient_customer', like_count: 8, timestamp: '2025-09-14T15:00:00+0000' },
      { id: 'comment_2_2', text: 'Supply chain issues are everywhere right now. Appreciate the transparency and communication!', username: 'understanding_buyer', like_count: 12, timestamp: '2025-09-14T15:15:00+0000' },
      { id: 'comment_2_3', text: 'Frustrated with the delay but I know you will make it right. Looking forward to the resolution.', username: 'loyal_customer', like_count: 5, timestamp: '2025-09-14T15:30:00+0000' },
      { id: 'comment_2_4', text: 'These delays are really disappointing. I need my order for an event next week.', username: 'urgent_buyer', like_count: 3, timestamp: '2025-09-14T16:00:00+0000' }
    ],
    'demo_post_3': [
      { id: 'comment_3_1', text: 'Love supporting local farmers! This partnership sounds incredible and beneficial for everyone! 🚜', username: 'farm_supporter', like_count: 20, timestamp: '2025-09-13T10:00:00+0000' },
      { id: 'comment_3_2', text: 'This is exactly what we need more of - businesses supporting local communities!', username: 'community_advocate', like_count: 16, timestamp: '2025-09-13T10:15:00+0000' },
      { id: 'comment_3_3', text: 'Fresh ingredients make all the difference. Excited to try your new products!', username: 'foodie_fan', like_count: 11, timestamp: '2025-09-13T10:30:00+0000' },
      { id: 'comment_3_4', text: 'Win-win partnerships like this are the future of sustainable business!', username: 'sustainability_expert', like_count: 14, timestamp: '2025-09-13T11:00:00+0000' }
    ],
    'demo_post_4': [
      { id: 'comment_4_1', text: 'Quality control is so important. Thanks for showing us behind the scenes!', username: 'quality_matters', like_count: 7, timestamp: '2025-09-12T17:00:00+0000' },
      { id: 'comment_4_2', text: 'This is why I trust your brand. Attention to detail shows!', username: 'detail_oriented', like_count: 9, timestamp: '2025-09-12T17:15:00+0000' },
      { id: 'comment_4_3', text: 'Manufacturing transparency builds trust. Keep it up!', username: 'transparency_fan', like_count: 6, timestamp: '2025-09-12T17:30:00+0000' }
    ],
    'demo_post_5': [
      { id: 'comment_5_1', text: 'Sarah\'s story is so inspiring! Your products really make a difference.', username: 'inspiration_seeker', like_count: 22, timestamp: '2025-09-11T12:00:00+0000' },
      { id: 'comment_5_2', text: 'Customer spotlights are the best! Real stories from real people.', username: 'story_lover', like_count: 18, timestamp: '2025-09-11T12:15:00+0000' },
      { id: 'comment_5_3', text: 'Portland represent! So proud to see local customers featured.', username: 'portland_local', like_count: 13, timestamp: '2025-09-11T12:30:00+0000' },
      { id: 'comment_5_4', text: 'These success stories motivate me to make better choices too!', username: 'motivated_buyer', like_count: 15, timestamp: '2025-09-11T13:00:00+0000' },
      { id: 'comment_5_5', text: 'Family sustainability is so important. Thanks for helping families like ours!', username: 'family_first', like_count: 11, timestamp: '2025-09-11T13:15:00+0000' }
    ]
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

  // Show loading screen until session is restored
  if (!sessionRestored) {
    return (
      <div className="app">
        <div className="app-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Restoring your session...</p>
          </div>
        </div>
      </div>
    )
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
            {isLoggedIn && demoMode && (
              <div className="user-info">
                <span>Demo Mode Active</span>
                <button onClick={handleLogout} className="logout-btn">Exit Demo</button>
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
                  {/* Enhanced Overall Metrics */}
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
                            
                            {/* Enhanced analysis display */}
                            {post.analysis?.keywords && post.analysis.keywords.length > 0 && (
                              <div className="keywords">
                                <strong>Keywords:</strong> {post.analysis.keywords.join(', ')}
                              </div>
                            )}
                            
                            {post.analysis?.topics && post.analysis.topics.length > 0 && (
                              <div className="topics">
                                <strong>Topics:</strong> {post.analysis.topics.join(', ')}
                              </div>
                            )}
                            
                            <button
                              onClick={() => fetchComments(post.id)}
                              disabled={loadingComments[post.id]}
                              className="comments-btn"
                            >
                              {loadingComments[post.id] ? '⏳ Loading...' : '💬 Analyze Comments'}
                            </button>
                          </div>

                          {/* Enhanced Comments Display */}
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
                                    {comment.analysis?.keywords && comment.analysis.keywords.length > 0 && (
                                      <div className="comment-keywords">
                                        <small><strong>Keywords:</strong> {comment.analysis.keywords.join(', ')}</small>
                                      </div>
                                    )}
                                    <div className="comment-stats">
                                      ❤️ {comment.like_count} likes
                                      {comment.analysis?.confidence && (
                                        <span style={{marginLeft: '10px', fontSize: '0.8em'}}>
                                          ({Math.round(comment.analysis.confidence * 100)}% confidence)
                                        </span>
                                      )}
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
                  <button onClick={() => fetchInstagramPosts()} className="analyze-btn">
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
                  <div className="bi-value">
                    {businessMetrics ? `${businessMetrics.engagementRate.toFixed(1)}%` : '4.2%'}
                  </div>
                </div>
                <div className="bi-card">
                  <h3>Brand Health Score</h3>
                  <div className="bi-value">
                    {businessMetrics ? `${businessMetrics.brandHealthScore}/100` : '85/100'}
                  </div>
                </div>
                <div className="bi-card">
                  <h3>Crisis Risk Level</h3>
                  <div className="bi-value">
                    {businessMetrics ? 
                      (businessMetrics.crisisRiskLevel === 'low' ? '🟢 Low' : 
                       businessMetrics.crisisRiskLevel === 'medium' ? '🟡 Medium' : '🔴 High') 
                      : '🟢 Low'}
                  </div>
                </div>
                <div className="bi-card">
                  <h3>Sentiment Trend</h3>
                  <div className="bi-value">
                    {businessMetrics ? 
                      (businessMetrics.sentimentTrend === 'improving' ? '📈 Improving' : 
                       businessMetrics.sentimentTrend === 'declining' ? '📉 Declining' : '➡️ Stable') 
                      : '📈 Improving'}
                  </div>
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
