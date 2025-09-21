import React, { useState, useEffect } from 'react';
import './App.css';

const FACEBOOK_APP_ID = '760837916843241';

// Professional sentiment analysis function
const analyzeSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', confidence: 0, score: 0, keywords: [] };
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

  const text_lower = text.toLowerCase();
  const words = text_lower.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  const foundKeywords = [];

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    
    positiveWords.forEach(pw => {
      if (cleanWord.includes(pw) || pw.includes(cleanWord)) {
        positiveScore += 1;
        if (!foundKeywords.includes(pw)) foundKeywords.push(pw);
      }
    });
    
    negativeWords.forEach(nw => {
      if (cleanWord.includes(nw) || nw.includes(cleanWord)) {
        negativeScore += 1;
        if (!foundKeywords.includes(nw)) foundKeywords.push(nw);
      }
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
    keywords: [...new Set(foundKeywords)].slice(0, 6)
  };
};

// Analyze multiple comments
const analyzeComments = (comments) => {
  if (!comments || comments.length === 0) {
    return {
      overall: { sentiment: 'neutral', confidence: 0, score: 0 },
      distribution: { positive: 0, negative: 0, neutral: 0 },
      topKeywords: []
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
    .slice(0, 8)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    overall: {
      sentiment: overallSentiment,
      confidence: Math.round(avgConfidence),
      score: Math.round(avgScore)
    },
    distribution,
    topKeywords
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

  const loadPosts = async (page) => {
    setLoadingPosts(true);
    console.log('Loading Instagram posts...');
    
    try {
      let allPosts = [];
      let url = `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_url,permalink,like_count,comments_count,timestamp&access_token=${page.access_token}&limit=25`;
      let pageCount = 0;
      
      while (url && pageCount < 4 && allPosts.length < 100) {
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
      
      const postsWithComments = allPosts.filter(post => post.comments_count > 0);
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
      
      setComments(prev => ({ ...prev, [postId]: allComments }));
      setAnalyses(prev => ({ ...prev, [postId]: analysis }));
      
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(prev => ({ ...prev, [postId]: false }));
    }
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

  const metrics = calculateOverallMetrics();

  if (!user) {
    return (
      <div className="login-page">
        <h1>Instagram Sentiment Analysis</h1>
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

      {loadingPosts && <div className="loading">Loading posts...</div>}

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
                  {comments[post.id]?.length} comments analyzed
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
