import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nepwxykmsqhylsaxfxmq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcHd4eWttc3FoeWxzYXhmeG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTUxNDcsImV4cCI6MjA3MTE3MTE0N30.-8IUv_NrSpW-pzvLEKQiQ6EOT7uip_9GTFA0wMORmZ0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced database helper functions with better error handling and logging
export const dbHelpers = {
  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('Database connection test failed:', error)
        return false
      }
      
      console.log('Database connection successful')
      return true
    } catch (error) {
      console.error('Database connection error:', error)
      return false
    }
  },

  // Enhanced user session management
  async saveUserSession(userId, sessionData) {
    try {
      console.log('Saving user session to database:', { userId, sessionData })
      
      const sessionRecord = {
        user_id: userId,
        facebook_access_token: sessionData.accessToken,
        facebook_user_id: sessionData.facebookUserId,
        selected_page_id: sessionData.selectedPageId,
        selected_page_name: sessionData.selectedPageName,
        expires_at: sessionData.expiresAt,
        updated_at: new Date().toISOString(),
        is_demo_mode: sessionData.isDemoMode || false
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .upsert(sessionRecord, {
          onConflict: 'user_id'
        })
        .select()
      
      if (error) {
        console.error('Error saving user session:', error)
        throw error
      }
      
      console.log('User session saved successfully:', data)
      return data
    } catch (error) {
      console.error('Database error saving user session:', error)
      throw error
    }
  },

  // Enhanced user session retrieval
  async getUserSession(userId) {
    try {
      console.log('Getting user session from database:', userId)
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error getting user session:', error)
        throw error
      }
      
      if (data) {
        console.log('User session retrieved successfully:', data)
      } else {
        console.log('No user session found for user:', userId)
      }
      
      return data
    } catch (error) {
      console.error('Database error getting user session:', error)
      return null
    }
  },

  // Enhanced Instagram posts saving with comprehensive data
  async savePosts(userId, posts) {
    try {
      console.log('Saving posts to database:', { userId, postCount: posts.length })
      
      const postsToSave = posts.map(post => {
        // Extract keywords and topics from analysis
        const keywords = post.analysis?.keywords || []
        const topics = post.analysis?.topics || []
        const emotions = post.analysis?.emotions || {}
        
        return {
          id: post.id,
          user_id: userId,
          caption: post.caption || '',
          media_type: post.media_type || 'IMAGE',
          media_url: post.media_url || '',
          permalink: post.permalink || '',
          timestamp: post.timestamp || new Date().toISOString(),
          like_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          sentiment_score: Math.min(9.99, Math.max(0, post.analysis?.score || 0.5)),
          sentiment_label: post.analysis?.sentiment || 'neutral',
          confidence_score: Math.min(9.99, Math.max(0, (post.analysis?.confidence || 50) / 100)),
          emotions: JSON.stringify(emotions),
          keywords: JSON.stringify(keywords),
          topics: JSON.stringify(topics),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      const { data, error } = await supabase
        .from('instagram_posts')
        .upsert(postsToSave, {
          onConflict: 'id'
        })
        .select()
      
      if (error) {
        console.error('Error saving posts:', error)
        throw error
      }
      
      console.log('Posts saved successfully:', data?.length || 0, 'records')
      return data
    } catch (error) {
      console.error('Database error saving posts:', error)
      throw error
    }
  },

  // Enhanced Instagram comments saving with comprehensive analysis
  async saveComments(userId, postId, comments) {
    try {
      console.log('Saving comments to database:', { userId, postId, commentCount: comments.length })
      
      const commentsToSave = comments.map(comment => {
        // Extract analysis data
        const keywords = comment.analysis?.keywords || []
        const topics = comment.analysis?.topics || []
        const emotions = comment.analysis?.emotions || {}
        
        return {
          id: comment.id,
          post_id: postId,
          user_id: userId,
          text: comment.text || '',
          username: comment.username || 'anonymous',
          like_count: comment.like_count || 0,
          sentiment_score: Math.min(9.99, Math.max(0, comment.analysis?.score || 0.5)),
          sentiment_label: comment.analysis?.sentiment || 'neutral',
          confidence_score: Math.min(9.99, Math.max(0, (comment.analysis?.confidence || 50) / 100)),
          emotions: JSON.stringify(emotions),
          keywords: JSON.stringify(keywords),
          topics: JSON.stringify(topics),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      const { data, error } = await supabase
        .from('instagram_comments')
        .upsert(commentsToSave, {
          onConflict: 'id'
        })
        .select()
      
      if (error) {
        console.error('Error saving comments:', error)
        throw error
      }
      
      console.log('Comments saved successfully:', data?.length || 0, 'records')
      return data
    } catch (error) {
      console.error('Database error saving comments:', error)
      throw error
    }
  },

  // Enhanced business metrics calculation and saving
  async saveBusinessMetrics(userId, metrics) {
    try {
      console.log('Saving business metrics to database:', { userId, metrics })
      
      const metricsRecord = {
        user_id: userId,
        metric_date: new Date().toISOString().split('T')[0], // Today's date
        total_posts: metrics.totalPosts || 0,
        positive_posts: metrics.positivePosts || 0,
        negative_posts: metrics.negativePosts || 0,
        neutral_posts: metrics.neutralPosts || 0,
        total_comments: metrics.totalComments || 0,
        positive_comments: metrics.positiveComments || 0,
        negative_comments: metrics.negativeComments || 0,
        neutral_comments: metrics.neutralComments || 0,
        avg_sentiment_score: metrics.avgSentimentScore || 0.5,
        brand_health_score: metrics.brandHealthScore || 50,
        crisis_risk_level: metrics.crisisRiskLevel || 'low',
        engagement_rate: metrics.engagementRate || 0,
        top_keywords: JSON.stringify(metrics.topKeywords || []),
        top_topics: JSON.stringify(metrics.topTopics || []),
        sentiment_trend: metrics.sentimentTrend || 'stable',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('business_metrics')
        .upsert(metricsRecord, {
          onConflict: 'user_id,metric_date'
        })
        .select()
      
      if (error) {
        console.error('Error saving business metrics:', error)
        throw error
      }
      
      console.log('Business metrics saved successfully:', data)
      return data
    } catch (error) {
      console.error('Database error saving business metrics:', error)
      throw error
    }
  },

  // Enhanced posts retrieval with filtering and sorting
  async getPosts(userId, options = {}) {
    try {
      console.log('Getting posts from database:', { userId, options })
      
      const {
        limit = 50,
        offset = 0,
        sentiment = null,
        dateFrom = null,
        dateTo = null,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options

      let query = supabase
        .from('instagram_posts')
        .select('*')
        .eq('user_id', userId)

      // Apply filters
      if (sentiment) {
        query = query.eq('sentiment_label', sentiment)
      }
      
      if (dateFrom) {
        query = query.gte('timestamp', dateFrom)
      }
      
      if (dateTo) {
        query = query.lte('timestamp', dateTo)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query
      
      if (error) {
        console.error('Error getting posts:', error)
        throw error
      }
      
      // Parse JSON fields
      const processedData = (data || []).map(post => ({
        ...post,
        emotions: post.emotions ? JSON.parse(post.emotions) : {},
        keywords: post.keywords ? JSON.parse(post.keywords) : [],
        topics: post.topics ? JSON.parse(post.topics) : []
      }))
      
      console.log('Posts retrieved successfully:', processedData.length, 'records')
      return processedData
    } catch (error) {
      console.error('Database error getting posts:', error)
      return []
    }
  },

  // Enhanced comments retrieval with analysis data
  async getComments(userId, postId, options = {}) {
    try {
      console.log('Getting comments from database:', { userId, postId, options })
      
      const {
        limit = 100,
        sentiment = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options

      let query = supabase
        .from('instagram_comments')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)

      // Apply filters
      if (sentiment) {
        query = query.eq('sentiment_label', sentiment)
      }

      // Apply sorting and limit
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit)

      const { data, error } = await query
      
      if (error) {
        console.error('Error getting comments:', error)
        throw error
      }
      
      // Parse JSON fields
      const processedData = (data || []).map(comment => ({
        ...comment,
        emotions: comment.emotions ? JSON.parse(comment.emotions) : {},
        keywords: comment.keywords ? JSON.parse(comment.keywords) : [],
        topics: comment.topics ? JSON.parse(comment.topics) : []
      }))
      
      console.log('Comments retrieved successfully:', processedData.length, 'records')
      return processedData
    } catch (error) {
      console.error('Database error getting comments:', error)
      return []
    }
  },

  // Enhanced business metrics retrieval with trend analysis
  async getBusinessMetrics(userId, options = {}) {
    try {
      console.log('Getting business metrics from database:', { userId, options })
      
      const {
        days = 30,
        limit = 100
      } = options

      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('metric_date', fromDate)
        .order('metric_date', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error getting business metrics:', error)
        throw error
      }
      
      // Parse JSON fields
      const processedData = (data || []).map(metric => ({
        ...metric,
        top_keywords: metric.top_keywords ? JSON.parse(metric.top_keywords) : [],
        top_topics: metric.top_topics ? JSON.parse(metric.top_topics) : []
      }))
      
      console.log('Business metrics retrieved successfully:', processedData.length, 'records')
      return processedData
    } catch (error) {
      console.error('Database error getting business metrics:', error)
      return []
    }
  },

  // Calculate comprehensive business metrics from posts and comments
  async calculateBusinessMetrics(userId) {
    try {
      console.log('Calculating business metrics for user:', userId)
      
      // Get all posts for the user
      const posts = await this.getPosts(userId, { limit: 1000 })
      
      if (posts.length === 0) {
        console.log('No posts found for metrics calculation')
        return null
      }

      // Get all comments for all posts
      const allComments = []
      for (const post of posts) {
        const comments = await this.getComments(userId, post.id, { limit: 1000 })
        allComments.push(...comments)
      }

      // Calculate post metrics
      const positivePosts = posts.filter(p => p.sentiment_label === 'positive').length
      const negativePosts = posts.filter(p => p.sentiment_label === 'negative').length
      const neutralPosts = posts.filter(p => p.sentiment_label === 'neutral').length

      // Calculate comment metrics
      const positiveComments = allComments.filter(c => c.sentiment_label === 'positive').length
      const negativeComments = allComments.filter(c => c.sentiment_label === 'negative').length
      const neutralComments = allComments.filter(c => c.sentiment_label === 'neutral').length

      // Calculate average sentiment score
      const allSentimentScores = [
        ...posts.map(p => p.sentiment_score),
        ...allComments.map(c => c.sentiment_score)
      ]
      const avgSentimentScore = allSentimentScores.length > 0 
        ? allSentimentScores.reduce((sum, score) => sum + score, 0) / allSentimentScores.length
        : 0.5

      // Calculate brand health score (0-100)
      const positiveRatio = (positivePosts + positiveComments) / (posts.length + allComments.length)
      const negativeRatio = (negativePosts + negativeComments) / (posts.length + allComments.length)
      const brandHealthScore = Math.round((positiveRatio - negativeRatio + 1) * 50)

      // Calculate engagement rate
      const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
      const engagementRate = posts.length > 0 
        ? ((totalLikes + totalComments) / posts.length) / 1000 // Normalize to percentage
        : 0

      // Determine crisis risk level
      let crisisRiskLevel = 'low'
      if (negativeRatio > 0.4) crisisRiskLevel = 'high'
      else if (negativeRatio > 0.2) crisisRiskLevel = 'medium'

      // Extract top keywords and topics
      const allKeywords = []
      const allTopics = []
      
      posts.forEach(post => {
        if (post.keywords) allKeywords.push(...post.keywords)
        if (post.topics) allTopics.push(...post.topics)
      })
      
      allComments.forEach(comment => {
        if (comment.keywords) allKeywords.push(...comment.keywords)
        if (comment.topics) allTopics.push(...comment.topics)
      })

      // Count and sort keywords/topics
      const keywordCounts = {}
      const topicCounts = {}
      
      allKeywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
      })
      
      allTopics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })

      const topKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }))

      const topTopics = Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }))

      // Determine sentiment trend (would need historical data for real trend)
      let sentimentTrend = 'stable'
      if (avgSentimentScore > 0.6) sentimentTrend = 'improving'
      else if (avgSentimentScore < 0.4) sentimentTrend = 'declining'

      const metrics = {
        totalPosts: posts.length,
        positivePosts,
        negativePosts,
        neutralPosts,
        totalComments: allComments.length,
        positiveComments,
        negativeComments,
        neutralComments,
        avgSentimentScore,
        brandHealthScore,
        crisisRiskLevel,
        engagementRate,
        topKeywords,
        topTopics,
        sentimentTrend
      }

      console.log('Business metrics calculated:', metrics)
      
      // Save the calculated metrics
      await this.saveBusinessMetrics(userId, metrics)
      
      return metrics
    } catch (error) {
      console.error('Error calculating business metrics:', error)
      return null
    }
  },

  // Get analytics dashboard data
  async getDashboardData(userId) {
    try {
      console.log('Getting dashboard data for user:', userId)
      
      const [posts, metrics] = await Promise.all([
        this.getPosts(userId, { limit: 10 }),
        this.getBusinessMetrics(userId, { days: 7 })
      ])

      const dashboardData = {
        recentPosts: posts,
        recentMetrics: metrics,
        summary: {
          totalPosts: posts.length,
          avgSentiment: posts.length > 0 
            ? posts.reduce((sum, post) => sum + post.sentiment_score, 0) / posts.length
            : 0.5,
          lastUpdated: new Date().toISOString()
        }
      }

      console.log('Dashboard data retrieved successfully')
      return dashboardData
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return {
        recentPosts: [],
        recentMetrics: [],
        summary: {
          totalPosts: 0,
          avgSentiment: 0.5,
          lastUpdated: new Date().toISOString()
        }
      }
    }
  },

  // Clean up old data (optional maintenance function)
  async cleanupOldData(userId, daysToKeep = 90) {
    try {
      console.log('Cleaning up old data for user:', userId, 'keeping', daysToKeep, 'days')
      
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
        .toISOString()

      // Clean up old posts
      const { error: postsError } = await supabase
        .from('instagram_posts')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate)

      if (postsError) {
        console.error('Error cleaning up old posts:', postsError)
      }

      // Clean up old comments
      const { error: commentsError } = await supabase
        .from('instagram_comments')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate)

      if (commentsError) {
        console.error('Error cleaning up old comments:', commentsError)
      }

      // Clean up old metrics
      const { error: metricsError } = await supabase
        .from('business_metrics')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate)

      if (metricsError) {
        console.error('Error cleaning up old metrics:', metricsError)
      }

      console.log('Data cleanup completed successfully')
    } catch (error) {
      console.error('Error during data cleanup:', error)
    }
  }
}

// Test database connection on module load
dbHelpers.testConnection().then(connected => {
  if (connected) {
    console.log('✅ Supabase database connection established successfully')
  } else {
    console.error('❌ Failed to establish Supabase database connection')
  }
})

export default dbHelpers
