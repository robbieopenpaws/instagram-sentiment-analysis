import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nepwxykmsqhylsaxfxmq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcHd4eWttc3FoeWxzYXhmeG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTUxNDcsImV4cCI6MjA3MTE3MTE0N30.-8IUv_NrSpW-pzvLEKQiQ6EOT7uip_9GTFA0wMORmZ0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database helper functions
export const dbHelpers = {
  // Save user session data
  async saveUserSession(userId, sessionData) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: userId,
          facebook_access_token: sessionData.accessToken,
          facebook_user_id: sessionData.facebookUserId,
          selected_page_id: sessionData.selectedPageId,
          selected_page_name: sessionData.selectedPageName,
          expires_at: sessionData.expiresAt,
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving user session:', error)
      throw error
    }
  },

  // Get user session data
  async getUserSession(userId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return data
    } catch (error) {
      console.error('Error getting user session:', error)
      return null
    }
  },

  // Save Instagram posts
  async savePosts(userId, posts) {
    try {
      const postsToSave = posts.map(post => ({
        id: post.id,
        user_id: userId,
        caption: post.caption,
        media_type: post.media_type,
        media_url: post.media_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        like_count: post.like_count,
        comments_count: post.comments_count,
        sentiment_score: post.analysis?.score,
        sentiment_label: post.analysis?.sentiment,
        confidence_score: post.analysis?.confidence,
        emotions: post.analysis?.emotions,
        keywords: post.analysis?.keywords,
        topics: post.analysis?.topics,
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('instagram_posts')
        .upsert(postsToSave)
        .select()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving posts:', error)
      throw error
    }
  },

  // Save Instagram comments
  async saveComments(userId, postId, comments) {
    try {
      const commentsToSave = comments.map(comment => ({
        id: comment.id,
        post_id: postId,
        user_id: userId,
        text: comment.text,
        username: comment.username,
        like_count: comment.like_count,
        sentiment_score: comment.analysis?.score,
        sentiment_label: comment.analysis?.sentiment,
        confidence_score: comment.analysis?.confidence,
        emotions: comment.analysis?.emotions,
        keywords: comment.analysis?.keywords,
        topics: comment.analysis?.topics,
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('instagram_comments')
        .upsert(commentsToSave)
        .select()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving comments:', error)
      throw error
    }
  },

  // Save business metrics
  async saveBusinessMetrics(userId, metrics) {
    try {
      const { data, error } = await supabase
        .from('business_metrics')
        .upsert({
          user_id: userId,
          metric_date: new Date().toISOString().split('T')[0], // Today's date
          total_posts: metrics.totalPosts,
          positive_posts: metrics.positivePosts,
          negative_posts: metrics.negativePosts,
          neutral_posts: metrics.neutralPosts,
          total_comments: metrics.totalComments,
          positive_comments: metrics.positiveComments,
          negative_comments: metrics.negativeComments,
          neutral_comments: metrics.neutralComments,
          avg_sentiment_score: metrics.avgSentimentScore,
          brand_health_score: metrics.brandHealthScore,
          crisis_risk_level: metrics.crisisRiskLevel,
          engagement_rate: metrics.engagementRate,
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving business metrics:', error)
      throw error
    }
  },

  // Get historical posts
  async getPosts(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting posts:', error)
      return []
    }
  },

  // Get comments for a post
  async getComments(userId, postId) {
    try {
      const { data, error } = await supabase
        .from('instagram_comments')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting comments:', error)
      return []
    }
  },

  // Get business metrics history
  async getBusinessMetrics(userId, days = 30) {
    try {
      const { data, error } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('metric_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting business metrics:', error)
      return []
    }
  }
}
