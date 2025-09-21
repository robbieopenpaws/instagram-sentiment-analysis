import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';

// Professional sentiment analysis function
const analyzeSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', confidence: 0, score: 0, keywords: [], emotions: [] };
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

  const emotionalWords = {
    joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'cheerful', 'elated'],
    anger: ['angry', 'mad', 'furious', 'rage', 'irritated', 'annoyed', 'frustrated'],
    sadness: ['sad', 'depressed', 'disappointed', 'heartbroken', 'grief', 'sorrow'],
    fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified', 'panic'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'wow'],
    disgust: ['disgusting', 'gross', 'revolting', 'sick', 'nasty', 'awful']
  };

  const text_lower = text.toLowerCase();
  const words = text_lower.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  const foundKeywords = [];
  const foundEmotions = [];

  // Analyze words
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
    Object.entries(emotionalWords).forEach(([emotion, emotionWords]) => {
      emotionWords.forEach(ew => {
        if (cleanWord.includes(ew) || ew.includes(cleanWord)) {
          if (!foundEmotions.includes(emotion)) foundEmotions.push(emotion);
        }
      });
    });
  });

  // Enhanced sentiment calculation
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
  } else if (sentimentWords > 0) {
    sentiment = 'mixed';
    confidence = 40 + (sentimentRatio * 20);
  }

  // Extract meaningful keywords from text
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
    emotions: foundEmotions,
    wordCount: totalWords,
    sentimentWordCount: sentimentWords
  };
};

// Analyze multiple comments for comprehensive insights
const analyzeComments = (comments) => {
  if (!comments || comments.length === 0) {
    return {
      overall: { sentiment: 'neutral', confidence: 0, score: 0 },
      distribution: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
      topKeywords: [],
      topEmotions: [],
      insights: []
    };
  }

  const analyses = comments.map(comment => ({
    ...comment,
    analysis: analyzeSentiment(comment.text)
  }));

  // Calculate distribution
  const distribution = analyses.reduce((acc, item) => {
    acc[item.analysis.sentiment] = (acc[item.analysis.sentiment] || 0) + 1;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0, mixed: 0 });

  // Calculate overall sentiment
  const totalScore = analyses.reduce((sum, item) => sum + item.analysis.score, 0);
  const avgScore = totalScore / analyses.length;
  const avgConfidence = analyses.reduce((sum, item) => sum + item.analysis.confidence, 0) / analyses.length;

  let overallSentiment = 'neutral';
  if (avgScore > 10) overallSentiment = 'positive';
  else if (avgScore < -10) overallSentiment = 'negative';
  else if (Math.abs(avgScore) > 5) overallSentiment = 'mixed';

  // Collect all keywords and emotions
  const allKeywords = analyses.flatMap(item => item.analysis.keywords);
  const allEmotions = analyses.flatMap(item => item.analysis.emotions);

  // Count frequency
  const keywordCounts = allKeywords.reduce((acc, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1;
    return acc;
  }, {});

  const emotionCounts = allEmotions.reduce((acc, emotion) => {
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {});

  // Get top keywords and emotions
  const topKeywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  const topEmotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([emotion, count]) => ({ emotion, count }));

  // Generate insights
  const insights = [];
  const totalComments = comments.length;
  const positivePercent = Math.round((distribution.positive / totalComments) * 100);
  const negativePercent = Math.round((distribution.negative / totalComments) * 100);

  if (positivePercent > 60) {
    insights.push(`Strong positive response (${positivePercent}% positive comments)`);
  } else if (negativePercent > 40) {
    insights.push(`Concerning negative feedback (${negativePercent}% negative comments)`);
  }

  if (topKeywords.length > 0) {
    insights.push(`Most discussed: ${topKeywords.slice(0, 3).map(k => k.keyword).join(', ')}`);
  }

  if (topEmotions.length > 0) {
    insights.push(`Primary emotions: ${topEmotions.slice(0, 2).map(e => e.emotion).join(', ')}`);
  }

  return {
    overall: {
      sentiment: overallSentiment,
      confidence: Math.round(avgConfidence),
      score: Math.round(avgScore)
    },
    distribution,
    topKeywords,
    topEmotions,
    insights,
    analyses
  };
};

function App() {
  const [user, setUser] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState({});
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Initialize Facebook SDK
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

  // Login with Facebook
  const login = () => {
    window.FB.login((response) => {
      if (response.authResponse) {
        loadUserData();
      }
    }, { scope: 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_comments' });
  };

  // Load user and page data
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

  // Load 100 Instagram posts and filter out zero-comment posts
  const loadPosts = async (page) => {
    setLoadingPosts(true);
    console.log('Loading up to 100 Instagram posts...');
    
    try {
      let allPosts = [];
      let url = `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_url,permalink,like_count,comments_count,timestamp&access_token=${page.access_token}&limit=25`;
      let pageCount = 0;
      
      while (url && pageCount < 4 && allPosts.length < 100) { // 4 pages * 25 = 100 posts max
        pageCount++;
        console.log(`Loading posts page ${pageCount}...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.data) {
          allPosts = [...allPosts, ...data.data];
          console.log(`Page ${pageCount}: Got ${data.data.length} posts. Total: ${allPosts.length}`);
          url = data.paging && data.paging.next ? data.paging.next : null;
        } else {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
      }
      
      // Filter out posts with zero comments
      const postsWithComments = allPosts.filter(post => post.comments_count > 0);
      console.log(`Filtered to ${postsWithComments.length} posts with comments (from ${allPosts.length} total posts)`);
      
      setPosts(postsWithComments);
      
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load ALL comments for a post with professional analysis
  const loadAllComments = async (postId) => {
    if (loading[postId] || comments[postId]) return;
    
    setLoading(prev => ({ ...prev, [postId]: true }));
    console.log(`Starting professional analysis for post: ${postId}`);
    
    try {
      let allComments = [];
      let url = `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count,timestamp&access_token=${selectedPage.access_token}&limit=50`;
      let pageCount = 0;
      
      while (url && pageCount < 20) { // Safety limit
        pageCount++;
        console.log(`Fetching comments page ${pageCount}...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          break;
        }
        
        if (data.data && data.data.length > 0) {
          allComments = [...allComments, ...data.data];
          console.log(`Page ${pageCount}: Got ${data.data.length} comments. Total: ${allComments.length}`);
          url = data.paging && data.paging.next ? data.paging.next : null;
        } else {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Analyzing ${allComments.length} comments for sentiment...`);
      
      // Perform professional sentiment analysis
      const analysis = analyzeComments(allComments);
      
      setComments(prev => ({ ...prev, [postId]: allComments }));
      setAnalyses(prev => ({ ...prev, [postId]: analysis }));
      
      console.log(`Analysis complete:`, analysis.overall);
      
    } catch (error) {
      console.error('Error loading comments:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Calculate overall metrics
  const calculateOverallMetrics = () => {
    const totalPosts = posts.length;
    const analyzedPosts = Object.keys(analyses).length;
    const totalComments = Object.values(comments).reduce((sum, postComments) => sum + postComments.length, 0);
    
    if (analyzedPosts === 0) {
      return { totalPosts, analyzedPosts, totalComments, avgSentiment: 0, distribution: {} };
    }
    
    const allAnalyses = Object.values(analyses);
    const avgSentiment = allAnalyses.reduce((sum, analysis) => sum + analysis.overall.score, 0) / allAnalyses.length;
    
    const distribution = allAnalyses.reduce((acc, analysis) => {
      const sentiment = analysis.overall.sentiment;
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});
    
    return { totalPosts, analyzedPosts, totalComments, avgSentiment: Math.round(avgSentiment), distribution };
  };

  const metrics = calculateOverallMetrics();

  if (!user) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h1>Professional Instagram Sentiment Analysis</h1>
        <p>Analyze up to 100 posts and perform comprehensive sentiment analysis on comments</p>
        <button 
          onClick={login}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Login with Facebook
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <header style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#1877f2', marginBottom: '15px' }}>Professional Instagram Sentiment Analysis</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{metrics.totalPosts}</div>
            <div style={{ color: '#666' }}>Posts with Comments</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1877f2' }}>{metrics.analyzedPosts}</div>
            <div style={{ color: '#666' }}>Posts Analyzed</div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{metrics.totalComments}</div>
            <div style={{ color: '#666' }}>Total Comments</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: metrics.avgSentiment > 0 ? '#28a745' : metrics.avgSentiment < 0 ? '#dc3545' : '#6c757d' }}>
              {metrics.avgSentiment > 0 ? '+' : ''}{metrics.avgSentiment}
            </div>
            <div style={{ color: '#666' }}>Avg Sentiment Score</div>
          </div>
        </div>
        <p style={{ marginTop: '15px', color: '#666' }}>
          Connected as: <strong>{user.name}</strong> • Instagram: <strong>{selectedPage?.name}</strong>
        </p>
      </header>

      {loadingPosts && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading Instagram posts...</div>
          <div style={{ color: '#666' }}>Fetching up to 100 posts and filtering for posts with comments</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {posts.map(post => (
          <div key={post.id} style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <strong>{new Date(post.timestamp).toLocaleDateString()}</strong>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                  ❤️ {post.like_count || 0} likes • 💬 {post.comments_count || 0} comments
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => loadAllComments(post.id)}
                  disabled={loading[post.id]}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading[post.id] ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading[post.id] ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading[post.id] ? 'Analyzing...' : 'Analyze Comments'}
                </button>
                <a 
                  href={post.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    padding: '10px 20px',
                    color: '#1877f2',
                    textDecoration: 'none',
                    border: '1px solid #1877f2',
                    borderRadius: '6px'
                  }}
                >
                  View Post →
                </a>
              </div>
            </div>
            
            {post.media_url && (
              <img 
                src={post.media_url} 
                alt="Post" 
                style={{ maxWidth: '300px', height: 'auto', borderRadius: '8px', marginBottom: '15px' }}
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              {post.caption ? (post.caption.length > 300 ? post.caption.substring(0, 300) + '...' : post.caption) : 'No caption'}
            </p>
            
            {analyses[post.id] && (
              <div style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px',
                border: `3px solid ${
                  analyses[post.id].overall.sentiment === 'positive' ? '#28a745' :
                  analyses[post.id].overall.sentiment === 'negative' ? '#dc3545' :
                  analyses[post.id].overall.sentiment === 'mixed' ? '#ffc107' : '#6c757d'
                }`
              }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>
                  Professional Sentiment Analysis ({comments[post.id]?.length} comments analyzed)
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: analyses[post.id].overall.sentiment === 'positive' ? '#28a745' :
                             analyses[post.id].overall.sentiment === 'negative' ? '#dc3545' :
                             analyses[post.id].overall.sentiment === 'mixed' ? '#ffc107' : '#6c757d'
                    }}>
                      {analyses[post.id].overall.sentiment.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {analyses[post.id].overall.confidence}% confidence
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1877f2' }}>
                      {analyses[post.id].overall.score > 0 ? '+' : ''}{analyses[post.id].overall.score}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Sentiment Score</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <strong>Distribution:</strong>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '14px' }}>
                    <span style={{ color: '#28a745' }}>✓ Positive: {analyses[post.id].distribution.positive}</span>
                    <span style={{ color: '#dc3545' }}>✗ Negative: {analyses[post.id].distribution.negative}</span>
                    <span style={{ color: '#6c757d' }}>○ Neutral: {analyses[post.id].distribution.neutral}</span>
                    {analyses[post.id].distribution.mixed > 0 && (
                      <span style={{ color: '#ffc107' }}>◐ Mixed: {analyses[post.id].distribution.mixed}</span>
                    )}
                  </div>
                </div>
                
                {analyses[post.id].topKeywords.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Top Keywords:</strong>
                    <div style={{ marginTop: '5px' }}>
                      {analyses[post.id].topKeywords.slice(0, 8).map(item => (
                        <span key={item.keyword} style={{ 
                          display: 'inline-block',
                          background: '#e9ecef',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          margin: '2px',
                          fontSize: '12px'
                        }}>
                          {item.keyword} ({item.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {analyses[post.id].topEmotions.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Emotions Detected:</strong>
                    <div style={{ marginTop: '5px' }}>
                      {analyses[post.id].topEmotions.map(item => (
                        <span key={item.emotion} style={{ 
                          display: 'inline-block',
                          background: '#fff3cd',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          margin: '2px',
                          fontSize: '12px'
                        }}>
                          {item.emotion} ({item.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {analyses[post.id].insights.length > 0 && (
                  <div>
                    <strong>Key Insights:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      {analyses[post.id].insights.map((insight, index) => (
                        <li key={index} style={{ fontSize: '14px', marginBottom: '3px' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
