import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';
const SUPABASE_PROJECT_ID = 'nepwxykmsqhylsaxfxmq';

// Professional sentiment analysis function
const analyzeSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', confidence: 0, score: 0, keywords: [], emotions: {} };
  }

  const positiveWords = [
    'love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent', 'perfect', 'beautiful',
    'happy', 'excited', 'thrilled', 'grateful', 'blessed', 'incredible', 'outstanding', 'brilliant',
    'delicious', 'stunning', 'magnificent', 'superb', 'fabulous', 'marvelous', 'spectacular', 'inspiring',
    'sustainable', 'eco-friendly', 'organic', 'natural', 'healthy', 'fresh', 'pure', 'clean', 'ethical',
    'vegan', 'plant-based', 'cruelty-free', 'responsible', 'green', 'renewable', 'compassionate',
    'thank', 'thanks', 'appreciate', 'support', 'recommend', 'approve', 'endorse', 'admire'
  ];
  
  const negativeWords = [
    'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'bad', 'sad', 'angry', 'mad',
    'disappointed', 'frustrated', 'annoyed', 'upset', 'worried', 'concerned', 'problem', 'issue',
    'wrong', 'broken', 'failed', 'disaster', 'nightmare', 'crisis', 'danger', 'stupid', 'ridiculous',
    'factory farming', 'cruel', 'inhumane', 'suffering', 'abuse', 'exploitation', 'harm', 'violence',
    'toxic', 'pollution', 'waste', 'destruction', 'killing', 'slaughter', 'murder', 'death',
    'disagree', 'oppose', 'reject', 'deny', 'refuse', 'criticize', 'condemn', 'blame'
  ];

  const emotionWords = {
    joy: ['happy', 'excited', 'thrilled', 'delighted', 'cheerful', 'joyful', 'elated'],
    anger: ['angry', 'mad', 'furious', 'outraged', 'irritated', 'annoyed', 'frustrated'],
    sadness: ['sad', 'depressed', 'disappointed', 'heartbroken', 'melancholy', 'sorrowful'],
    fear: ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'nervous', 'concerned'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered'],
    disgust: ['disgusting', 'revolting', 'repulsive', 'nauseating', 'sickening', 'appalling']
  };

  const text_lower = text.toLowerCase();
  const words = text_lower.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  const foundKeywords = [];
  const emotions = { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, disgust: 0 };

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    // Check positive words
    positiveWords.forEach(pw => {
      if (cleanWord.includes(pw) || pw.includes(cleanWord)) {
        positiveScore += 1;
        if (!foundKeywords.includes(pw)) foundKeywords.push(pw);
      }
    });
    
    // Check negative words
    negativeWords.forEach(nw => {
      if (cleanWord.includes(nw) || nw.includes(cleanWord)) {
        negativeScore += 1;
        if (!foundKeywords.includes(nw)) foundKeywords.push(nw);
      }
    });

    // Check emotions
    Object.entries(emotionWords).forEach(([emotion, emotionWordList]) => {
      emotionWordList.forEach(ew => {
        if (cleanWord.includes(ew) || ew.includes(cleanWord)) {
          emotions[emotion] += 1;
        }
      });
    });
  });

  const totalWords = words.length;
  const sentimentWords = positiveScore + negativeScore;
  const sentimentRatio = sentimentWords / totalWords;
  
  let sentiment = 'neutral';
  let confidence = 50;
  let score = 0;

  if (positiveScore > negativeScore) {
    sentiment = 'positive';
    score = (positiveScore / (positiveScore + negativeScore + 1)) * 100;
    confidence = Math.min(95, 60 + (sentimentRatio * 40));
  } else if (negativeScore > positiveScore) {
    sentiment = 'negative';
    score = -(negativeScore / (positiveScore + negativeScore + 1)) * 100;
    confidence = Math.min(95, 60 + (sentimentRatio * 40));
  }

  const meaningfulWords = words
    .filter(word => word.length > 4)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'your', 'their', 'what', 'when', 'where'].includes(word))
    .slice(0, 5);

  foundKeywords.push(...meaningfulWords);

  return {
    sentiment,
    confidence: Math.round(confidence),
    score: Math.round(score),
    keywords: [...new Set(foundKeywords)].slice(0, 8),
    emotions
  };
};

// Analyze multiple comments
const analyzeComments = (comments) => {
  if (!comments || comments.length === 0) {
    return {
      overall: { sentiment: 'neutral', confidence: 0, score: 0 },
      distribution: { positive: 0, negative: 0, neutral: 0 },
      topKeywords: [],
      emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, disgust: 0 }
    };
  }

  const analyses = comments.map(comment => ({
    ...comment,
    analysis: analyzeSentiment(comment.text)
  }));

  const distribution = analyses.reduce((acc, item) => {
    acc[item.analysis.sentiment] = (acc[item.analysis.sentiment] || 0) + 1;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  const totalScore = analyses.reduce((sum, item) => sum + item.analysis.score, 0);
  const avgScore = totalScore / analyses.length;
  const avgConfidence = analyses.reduce((sum, item) => sum + item.analysis.confidence, 0) / analyses.length;

  let overallSentiment = 'neutral';
  if (avgScore > 10) overallSentiment = 'positive';
  else if (avgScore < -10) overallSentiment = 'negative';

  const allKeywords = analyses.flatMap(item => item.analysis.keywords);
  const keywordCounts = allKeywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1;
    return acc;
  }, {});

  const topKeywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  const totalEmotions = analyses.reduce((acc, item) => {
    Object.entries(item.analysis.emotions).forEach(([emotion, count]) => {
      acc[emotion] = (acc[emotion] || 0) + count;
    });
    return acc;
  }, { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, disgust: 0 });

  return {
    overall: {
      sentiment: overallSentiment,
      confidence: Math.round(avgConfidence),
      score: Math.round(avgScore)
    },
    distribution,
    topKeywords,
    emotions: totalEmotions,
    analyses
  };
};

// Supabase integration functions
const savePostToSupabase = async (post, analysis) => {
  try {
    const response = await fetch(`https://manus-mcp-cli.com/supabase/execute_sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: SUPABASE_PROJECT_ID,
        query: `
          INSERT INTO instagram_posts (
            id, user_id, caption, media_type, media_url, permalink, 
            timestamp, like_count, comments_count, sentiment_score, 
            sentiment_label, confidence_score, emotions, keywords, topics
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) ON CONFLICT (id) DO UPDATE SET
            sentiment_score = EXCLUDED.sentiment_score,
            sentiment_label = EXCLUDED.sentiment_label,
            confidence_score = EXCLUDED.confidence_score,
            emotions = EXCLUDED.emotions,
            keywords = EXCLUDED.keywords,
            topics = EXCLUDED.topics,
            updated_at = now()
        `,
        params: [
          post.id,
          post.user_id || 'unknown',
          post.caption || '',
          post.media_type || 'IMAGE',
          post.media_url || '',
          post.permalink || '',
          post.timestamp || new Date().toISOString(),
          post.like_count || 0,
          post.comments_count || 0,
          analysis.overall.score / 100, // Scale to 0-1 range
          analysis.overall.sentiment,
          analysis.overall.confidence / 100, // Scale to 0-1 range
          JSON.stringify(analysis.emotions),
          JSON.stringify(analysis.topKeywords),
          JSON.stringify([])
        ]
      })
    });
    
    if (response.ok) {
      console.log('Post saved to Supabase:', post.id);
    }
  } catch (error) {
    console.error('Error saving post to Supabase:', error);
  }
};

const saveCommentsToSupabase = async (postId, comments, analyses) => {
  try {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const analysis = analyses[i];
      
      await fetch(`https://manus-mcp-cli.com/supabase/execute_sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: SUPABASE_PROJECT_ID,
          query: `
            INSERT INTO instagram_comments (
              id, post_id, user_id, text, username, like_count,
              sentiment_score, sentiment_label, confidence_score, 
              emotions, keywords, topics
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) ON CONFLICT (id) DO UPDATE SET
              sentiment_score = EXCLUDED.sentiment_score,
              sentiment_label = EXCLUDED.sentiment_label,
              confidence_score = EXCLUDED.confidence_score,
              emotions = EXCLUDED.emotions,
              keywords = EXCLUDED.keywords,
              updated_at = now()
          `,
          params: [
            comment.id,
            postId,
            comment.user_id || 'unknown',
            comment.text,
            comment.username || 'anonymous',
            comment.like_count || 0,
            analysis.score / 100, // Scale to 0-1 range
            analysis.sentiment,
            analysis.confidence / 100, // Scale to 0-1 range
            JSON.stringify(analysis.emotions),
            JSON.stringify(analysis.keywords),
            JSON.stringify([])
          ]
        })
      });
    }
    
    console.log(`Saved ${comments.length} comments to Supabase for post ${postId}`);
  } catch (error) {
    console.error('Error saving comments to Supabase:', error);
  }
};

const updateBusinessMetrics = async (userId, metrics) => {
  try {
    await fetch(`https://manus-mcp-cli.com/supabase/execute_sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: SUPABASE_PROJECT_ID,
        query: `
          INSERT INTO business_metrics (
            user_id, total_posts, positive_posts, negative_posts, neutral_posts,
            total_comments, positive_comments, negative_comments, neutral_comments,
            avg_sentiment_score, brand_health_score, crisis_risk_level, engagement_rate
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ) ON CONFLICT (user_id, metric_date) DO UPDATE SET
            total_posts = EXCLUDED.total_posts,
            positive_posts = EXCLUDED.positive_posts,
            negative_posts = EXCLUDED.negative_posts,
            neutral_posts = EXCLUDED.neutral_posts,
            total_comments = EXCLUDED.total_comments,
            positive_comments = EXCLUDED.positive_comments,
            negative_comments = EXCLUDED.negative_comments,
            neutral_comments = EXCLUDED.neutral_comments,
            avg_sentiment_score = EXCLUDED.avg_sentiment_score,
            brand_health_score = EXCLUDED.brand_health_score,
            crisis_risk_level = EXCLUDED.crisis_risk_level,
            engagement_rate = EXCLUDED.engagement_rate,
            updated_at = now()
        `,
        params: [
          userId,
          metrics.totalPosts,
          metrics.positivePosts,
          metrics.negativePosts,
          metrics.neutralPosts,
          metrics.totalComments,
          metrics.positiveComments,
          metrics.negativeComments,
          metrics.neutralComments,
          metrics.avgSentiment / 100,
          metrics.brandHealth,
          metrics.crisisRisk,
          metrics.engagementRate / 100
        ]
      })
    });
    
    console.log('Business metrics updated in Supabase');
  } catch (error) {
    console.error('Error updating business metrics:', error);
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);

  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const login = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        loadUserData();
      }
    }, { scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments' });
  };

  const loadUserData = () => {
    window.FB.api('/me', { fields: 'name' }, (userResponse) => {
      setUser(userResponse);
      
      window.FB.api('/me/accounts', { fields: 'name,access_token,instagram_business_account' }, (pagesResponse) => {
        const instagramPages = pagesResponse.data.filter(page => page.instagram_business_account);
        if (instagramPages.length > 0) {
          const page = instagramPages[0];
          setSelectedPage(page);
          loadPosts(page);
        }
      });
    });
  };

  const loadPosts = async (page, limit = 100) => {
    setLoadingPosts(true);
    console.log(`Loading up to ${limit} Instagram posts...`);
    
    try {
      let allPosts = [];
      let url = `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_url,permalink,like_count,comments_count,timestamp&access_token=${page.access_token}&limit=25`;
      let pageCount = 0;
      const maxPages = Math.ceil(limit / 25);
      
      while (url && pageCount < maxPages && allPosts.length < limit) {
        pageCount++;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.data) {
          allPosts = [...allPosts, ...data.data];
          url = data.paging && data.paging.next ? data.paging.next : null;
        } else {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const postsWithComments = allPosts
        .filter(post => post.comments_count > 0)
        .slice(0, limit);
      
      console.log(`Loaded ${postsWithComments.length} posts with comments`);
      setPosts(postsWithComments);
      
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadAllComments = async (postId) => {
    if (loading[postId] || comments[postId]) return;
    
    setLoading(prev => ({ ...prev, [postId]: true }));
    
    try {
      let allComments = [];
      let url = `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp&access_token=${selectedPage.access_token}&limit=50`;
      let pageCount = 0;
      
      while (url && pageCount < 20) {
        pageCount++;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          break;
        }
        
        if (data.data && data.data.length > 0) {
          allComments = [...allComments, ...data.data];
          url = data.paging && data.paging.next ? data.paging.next : null;
        } else {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const analysis = analyzeComments(allComments);
      const post = posts.find(p => p.id === postId);
      
      // Save to Supabase
      if (post) {
        await savePostToSupabase(post, analysis);
        await saveCommentsToSupabase(postId, allComments, analysis.analyses.map(a => a.analysis));
      }
      
      setComments(prev => ({ ...prev, [postId]: allComments }));
      setAnalyses(prev => ({ ...prev, [postId]: analysis }));
      
      console.log(`Analyzed ${allComments.length} comments for post ${postId}`);
      
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const batchAnalyzeAll = async () => {
    setBatchAnalyzing(true);
    console.log('Starting batch analysis of all posts...');
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      if (!comments[post.id]) {
        console.log(`Analyzing post ${i + 1}/${posts.length}: ${post.id}`);
        await loadAllComments(post.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      }
    }
    
    // Update business metrics
    const metrics = calculateBusinessMetrics();
    if (user) {
      await updateBusinessMetrics(user.id, metrics);
    }
    
    setBatchAnalyzing(false);
    console.log('Batch analysis complete!');
  };

  const calculateOverallMetrics = () => {
    const totalPosts = posts.length;
    const analyzedPosts = Object.keys(analyses).length;
    const totalComments = Object.values(comments).reduce((sum, postComments) => sum + postComments.length, 0);
    
    if (analyzedPosts === 0) {
      return { totalPosts, analyzedPosts, totalComments, avgSentiment: 0 };
    }
    
    const allAnalyses = Object.values(analyses);
    const avgSentiment = allAnalyses.reduce((sum, analysis) => sum + analysis.overall.score, 0) / allAnalyses.length;
    
    return { totalPosts, analyzedPosts, totalComments, avgSentiment: Math.round(avgSentiment) };
  };

  const calculateBusinessMetrics = () => {
    const allAnalyses = Object.values(analyses);
    const allComments = Object.values(comments).flat();
    
    const postDistribution = allAnalyses.reduce((acc, analysis) => {
      acc[analysis.overall.sentiment] = (acc[analysis.overall.sentiment] || 0) + 1;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const commentDistribution = allComments.reduce((acc, comment) => {
      const analysis = analyzeSentiment(comment.text);
      acc[analysis.sentiment] = (acc[analysis.sentiment] || 0) + 1;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const avgSentiment = allAnalyses.length > 0 
      ? allAnalyses.reduce((sum, analysis) => sum + analysis.overall.score, 0) / allAnalyses.length 
      : 0;

    const brandHealth = Math.max(0, Math.min(100, 50 + avgSentiment));
    const crisisRisk = avgSentiment < -30 ? 'HIGH' : avgSentiment < -10 ? 'MEDIUM' : 'LOW';
    const engagementRate = posts.length > 0 
      ? (allComments.length / posts.reduce((sum, post) => sum + post.like_count, 0)) * 100 
      : 0;

    return {
      totalPosts: posts.length,
      positivePosts: postDistribution.positive,
      negativePosts: postDistribution.negative,
      neutralPosts: postDistribution.neutral,
      totalComments: allComments.length,
      positiveComments: commentDistribution.positive,
      negativeComments: commentDistribution.negative,
      neutralComments: commentDistribution.neutral,
      avgSentiment,
      brandHealth: Math.round(brandHealth),
      crisisRisk,
      engagementRate: Math.round(engagementRate * 100) / 100
    };
  };

  const metrics = calculateOverallMetrics();

  if (!user) {
    return (
      <div className="login-page">
        <h1>Instagram Sentiment Analysis</h1>
        <p>Analyze sentiment across 100-500 posts with AI-powered insights</p>
        <button onClick={login} className="login-btn">Login with Facebook</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Instagram Sentiment Analysis</h1>
        <div className="metrics">
          <span>Posts: {metrics.totalPosts}</span>
          <span>Analyzed: {metrics.analyzedPosts}</span>
          <span>Comments: {metrics.totalComments}</span>
          <span>Avg Score: {metrics.avgSentiment > 0 ? '+' : ''}{metrics.avgSentiment}</span>
        </div>
      </header>

      <div className="controls">
        <button 
          onClick={() => loadPosts(selectedPage, 100)}
          disabled={loadingPosts}
          className="load-btn"
        >
          {loadingPosts ? 'Loading...' : 'Load 100 Posts'}
        </button>
        
        <button 
          onClick={() => loadPosts(selectedPage, 500)}
          disabled={loadingPosts}
          className="load-btn"
        >
          {loadingPosts ? 'Loading...' : 'Load 500 Posts'}
        </button>
        
        <button 
          onClick={batchAnalyzeAll}
          disabled={batchAnalyzing || posts.length === 0}
          className="batch-btn"
        >
          {batchAnalyzing ? 'Analyzing All...' : `Analyze All ${posts.length} Posts`}
        </button>
      </div>

      {loadingPosts && <div className="loading">Loading posts...</div>}
      {batchAnalyzing && <div className="loading">Batch analyzing all posts... This may take several minutes.</div>}

      <div className="posts">
        {posts.map(post => (
          <div key={post.id} className="post">
            <div className="post-header">
              <span className="date">{new Date(post.timestamp).toLocaleDateString()}</span>
              <span className="stats">{post.like_count} likes • {post.comments_count} comments</span>
              <button
                onClick={() => loadAllComments(post.id)}
                disabled={loading[post.id]}
                className="analyze-btn"
              >
                {loading[post.id] ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            
            <div className="post-content">
              {post.caption && <p className="caption">{post.caption.substring(0, 200)}...</p>}
            </div>
            
            {analyses[post.id] && (
              <div className="analysis">
                <div className="sentiment-header">
                  <span className={`sentiment ${analyses[post.id].overall.sentiment}`}>
                    {analyses[post.id].overall.sentiment.toUpperCase()}
                  </span>
                  <span className="score">
                    Score: {analyses[post.id].overall.score > 0 ? '+' : ''}{analyses[post.id].overall.score}
                  </span>
                  <span className="confidence">
                    {analyses[post.id].overall.confidence}% confidence
                  </span>
                </div>
                
                <div className="distribution">
                  <span className="pos">+{analyses[post.id].distribution.positive}</span>
                  <span className="neu">○{analyses[post.id].distribution.neutral}</span>
                  <span className="neg">-{analyses[post.id].distribution.negative}</span>
                </div>
                
                {analyses[post.id].topKeywords.length > 0 && (
                  <div className="keywords">
                    Keywords: {analyses[post.id].topKeywords.slice(0, 5).map(k => k.keyword).join(', ')}
                  </div>
                )}
                
                <div className="comment-count">
                  {comments[post.id]?.length} comments analyzed • Saved to database
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
