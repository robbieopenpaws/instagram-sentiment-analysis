import React, { useState, useEffect } from 'react';
import './App-INTELLIGENT.css';
import './MetricsExplanation.css';
import './EnhancedTooltip.css';
import MetricsExplanation from './MetricsExplanation';
// import Tooltip from './EnhancedTooltip'; // Removed to avoid conflict

const FACEBOOK_APP_ID = '760837916843241';
const SUPABASE_PROJECT_ID = 'nepwxykmsqhylsaxfxmq';

// Specialized Animal Agriculture Sentiment Analysis (same as before)
const analyzeAnimalAgricultureSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return { 
      category: 'neutral', 
      confidence: 0, 
      score: 0, 
      keywords: [], 
      advocacy_impact: 'none',
      behavioral_indicators: []
    };
  }

  const text_lower = text.toLowerCase();

  // Pro-Animal Agriculture indicators
  const proAnimalAg = {
    keywords: [
      'farmers', 'farming', 'agriculture', 'necessary', 'natural', 'tradition', 'culture',
      'protein', 'nutrition', 'healthy', 'balanced diet', 'food chain', 'circle of life',
      'humane', 'ethical farming', 'grass fed', 'free range', 'local farm', 'small farm',
      'jobs', 'economy', 'livelihood', 'support farmers', 'rural communities',
      'moderation', 'everything in moderation', 'personal choice', 'freedom'
    ],
    phrases: [
      'farmers work hard', 'support local farmers', 'ethical farming', 'humane treatment',
      'personal choice', 'everything in moderation', 'need protein', 'always eaten meat',
      'food chain', 'circle of life', 'natural order', 'been doing this for centuries'
    ]
  };

  // Anti-Animal Agriculture indicators (your content is working!)
  const antiAnimalAg = {
    keywords: [
      'horrific', 'disgusting', 'cruel', 'inhumane', 'torture', 'abuse', 'suffering',
      'heartbreaking', 'devastating', 'shocking', 'appalling', 'barbaric', 'evil',
      'murder', 'killing', 'slaughter', 'violence', 'exploitation', 'slavery',
      'going vegan', 'never again', 'stop eating', 'quit meat', 'plant based',
      'eye opening', 'wake up call', 'changed my mind', 'never knew', 'had no idea'
    ],
    phrases: [
      'going vegan', 'never eating meat again', 'stop supporting this', 'this is horrible',
      'how can people', 'never knew this', 'eye opening', 'changed my perspective',
      'quit dairy', 'stop eating animals', 'this needs to stop', 'boycott',
      'spread awareness', 'share this', 'people need to know'
    ]
  };

  // Questioning/Conflicted indicators (potential converts)
  const questioning = {
    keywords: [
      'maybe', 'perhaps', 'considering', 'thinking about', 'starting to',
      'difficult', 'hard to watch', 'makes me think', 'conflicted', 'torn',
      'reduce', 'cut down', 'less meat', 'alternatives', 'trying',
      'didnt know', 'learning', 'researching', 'looking into'
    ],
    phrases: [
      'makes me think', 'hard to watch', 'considering veganism', 'maybe i should',
      'trying to reduce', 'cut down on meat', 'looking for alternatives',
      'didnt know this', 'learning more', 'makes me question', 'conflicted about'
    ]
  };

  // Defensive indicators (cognitive dissonance)
  const defensive = {
    keywords: [
      'but', 'however', 'still', 'propaganda', 'extreme', 'radical', 'preachy',
      'judgemental', 'forcing', 'pushing', 'agenda', 'biased', 'one sided',
      'lions', 'canine teeth', 'ancestors', 'evolution', 'designed to eat',
      'plants feel pain', 'what about', 'survival', 'third world'
    ],
    phrases: [
      'but we need', 'lions eat meat', 'canine teeth', 'plants feel pain too',
      'what about plants', 'survival of fittest', 'food desert', 'cant afford',
      'pushing agenda', 'being preachy', 'extreme vegans', 'one sided story'
    ]
  };

  // Already Vegan indicators (your supporters)
  const alreadyVegan = {
    keywords: [
      'vegan', 'plant based', 'already know', 'been vegan', 'years ago',
      'exactly', 'absolutely', 'thank you', 'keep sharing', 'spread the word',
      'important message', 'truth', 'reality', 'expose', 'awareness'
    ],
    phrases: [
      'been vegan for', 'already plant based', 'exactly why', 'thank you for sharing',
      'keep spreading', 'important work', 'more people need', 'the truth about',
      'expose the industry', 'raise awareness'
    ]
  };

  let scores = {
    proAnimalAg: 0,
    antiAnimalAg: 0,
    questioning: 0,
    defensive: 0,
    alreadyVegan: 0
  };

  let foundKeywords = [];
  let behavioralIndicators = [];

  // Score each category
  const categories = {
    proAnimalAg,
    antiAnimalAg,
    questioning,
    defensive,
    alreadyVegan
  };

  Object.entries(categories).forEach(([category, indicators]) => {
    // Check keywords
    indicators.keywords.forEach(keyword => {
      if (text_lower.includes(keyword)) {
        scores[category] += 1;
        foundKeywords.push(keyword);
      }
    });

    // Check phrases (weighted higher)
    indicators.phrases.forEach(phrase => {
      if (text_lower.includes(phrase)) {
        scores[category] += 2;
        foundKeywords.push(phrase);
      }
    });
  });

  // Determine primary category
  const maxScore = Math.max(...Object.values(scores));
  let primaryCategory = 'neutral';
  let confidence = 50;

  if (maxScore > 0) {
    primaryCategory = Object.keys(scores).find(key => scores[key] === maxScore);
    confidence = Math.min(95, 60 + (maxScore * 10));
  }

  // Map to advocacy impact
  const advocacyImpactMap = {
    antiAnimalAg: 'highly_effective',
    questioning: 'moderately_effective',
    alreadyVegan: 'preaching_to_choir',
    defensive: 'triggering_resistance',
    proAnimalAg: 'ineffective',
    neutral: 'no_impact'
  };

  // Behavioral change indicators
  if (text_lower.includes('going vegan') || text_lower.includes('never eating meat')) {
    behavioralIndicators.push('commitment_to_change');
  }
  if (text_lower.includes('share') || text_lower.includes('spread')) {
    behavioralIndicators.push('advocacy_amplification');
  }
  if (text_lower.includes('reduce') || text_lower.includes('cut down')) {
    behavioralIndicators.push('harm_reduction');
  }
  if (text_lower.includes('research') || text_lower.includes('learn more')) {
    behavioralIndicators.push('information_seeking');
  }

  // Calculate advocacy effectiveness score (-100 to +100)
  let advocacyScore = 0;
  if (primaryCategory === 'antiAnimalAg') advocacyScore = 80 + (confidence - 60);
  else if (primaryCategory === 'questioning') advocacyScore = 40 + (confidence - 60);
  else if (primaryCategory === 'alreadyVegan') advocacyScore = 20;
  else if (primaryCategory === 'defensive') advocacyScore = -30;
  else if (primaryCategory === 'proAnimalAg') advocacyScore = -60;

  return {
    category: primaryCategory,
    confidence: Math.round(confidence),
    score: Math.round(advocacyScore),
    keywords: [...new Set(foundKeywords)].slice(0, 8),
    advocacy_impact: advocacyImpactMap[primaryCategory],
    behavioral_indicators: behavioralIndicators,
    raw_scores: scores
  };
};

// Analyze multiple comments for advocacy effectiveness
const analyzeAdvocacyEffectiveness = (comments) => {
  if (!comments || comments.length === 0) {
    return {
      overall_effectiveness: 'no_data',
      conversion_potential: 0,
      resistance_level: 0,
      distribution: {},
      top_behavioral_indicators: [],
      advocacy_insights: [],
      impact_score: 0
    };
  }

  const analyses = comments.map(comment => ({
    ...comment,
    analysis: analyzeAnimalAgricultureSentiment(comment.text)
  }));

  // Calculate distribution
  const distribution = analyses.reduce((acc, item) => {
    const category = item.analysis.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Calculate conversion metrics
  const totalComments = analyses.length;
  const converted = (distribution.antiAnimalAg || 0);
  const questioning = (distribution.questioning || 0);
  const resistant = (distribution.defensive || 0) + (distribution.proAnimalAg || 0);
  const supportive = (distribution.alreadyVegan || 0);

  const conversionPotential = Math.round(((converted + questioning) / totalComments) * 100);
  const resistanceLevel = Math.round((resistant / totalComments) * 100);

  // Calculate overall impact score (0-100)
  let impactScore = 0;
  if (totalComments > 0) {
    const conversionWeight = (converted * 3 + questioning * 2) / totalComments;
    const resistanceWeight = resistant / totalComments;
    impactScore = Math.max(0, Math.min(100, Math.round((conversionWeight - resistanceWeight) * 50 + 50)));
  }

  // Behavioral indicators
  const allBehavioralIndicators = analyses.flatMap(item => item.analysis.behavioral_indicators);
  const behavioralCounts = allBehavioralIndicators.reduce((acc, indicator) => {
    acc[indicator] = (acc[indicator] || 0) + 1;
    return acc;
  }, {});

  const topBehavioralIndicators = Object.entries(behavioralCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([indicator, count]) => ({ indicator, count }));

  // Generate insights
  const insights = [];
  
  if (conversionPotential > 30) {
    insights.push(`High conversion potential: ${conversionPotential}% showing openness to change`);
  }
  if (converted > questioning) {
    insights.push(`Strong impact: More people horrified (${converted}) than just questioning (${questioning})`);
  }
  if (resistanceLevel > 40) {
    insights.push(`High resistance: ${resistanceLevel}% showing defensive responses`);
  }
  if (supportive > converted) {
    insights.push(`Preaching to choir: More existing vegans (${supportive}) than new converts (${converted})`);
  }

  // Overall effectiveness rating
  let overallEffectiveness = 'moderate';
  if (conversionPotential > 40 && resistanceLevel < 30) overallEffectiveness = 'highly_effective';
  else if (conversionPotential < 20 || resistanceLevel > 50) overallEffectiveness = 'low_effectiveness';

  return {
    overall_effectiveness: overallEffectiveness,
    conversion_potential: conversionPotential,
    resistance_level: resistanceLevel,
    distribution,
    top_behavioral_indicators: topBehavioralIndicators,
    advocacy_insights: insights,
    analyses,
    impact_score: impactScore
  };
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: 200,
  REQUESTS_PER_HOUR: 1000,
  DELAY_BETWEEN_REQUESTS: 300, // milliseconds
  BATCH_SIZE: 25,
  MAX_RETRIES: 3
};

// Rate limiter class
class RateLimiter {
  constructor() {
    this.requests = [];
    this.hourlyRequests = [];
  }

  async waitForRateLimit() {
    const now = Date.now();
    
    // Clean old requests (older than 1 minute)
    this.requests = this.requests.filter(time => now - time < 60000);
    this.hourlyRequests = this.hourlyRequests.filter(time => now - time < 3600000);
    
    // Check if we're hitting rate limits
    if (this.requests.length >= RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = 60000 - (now - oldestRequest);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    if (this.hourlyRequests.length >= RATE_LIMIT_CONFIG.REQUESTS_PER_HOUR) {
      const oldestRequest = Math.min(...this.hourlyRequests);
      const waitTime = 3600000 - (now - oldestRequest);
      console.log(`Hourly rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.DELAY_BETWEEN_REQUESTS));
    
    // Record this request
    this.requests.push(now);
    this.hourlyRequests.push(now);
  }
}

const rateLimiter = new RateLimiter();

// Date filtering utilities
const getDateRangeFilter = (months) => {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return cutoffDate.toISOString();
};

// Intelligent post filtering
const filterAndPrioritizePosts = (posts, options = {}) => {
  const {
    minComments = 50,
    dateRange = 12, // months
    maxPosts = 500,
    prioritizeEngagement = true
  } = options;

  const cutoffDate = getDateRangeFilter(dateRange);
  
  // Filter by date and comment count
  let filteredPosts = posts.filter(post => {
    const postDate = new Date(post.timestamp);
    const hasEnoughComments = post.comments_count >= minComments;
    const isWithinDateRange = postDate >= new Date(cutoffDate);
    
    return hasEnoughComments && isWithinDateRange;
  });

  // Sort by engagement (comments + likes) if prioritizing
  if (prioritizeEngagement) {
    filteredPosts.sort((a, b) => {
      const engagementA = (a.comments_count || 0) + (a.like_count || 0);
      const engagementB = (b.comments_count || 0) + (b.like_count || 0);
      return engagementB - engagementA;
    });
  }

  // Limit to max posts
  return filteredPosts.slice(0, maxPosts);
};

// Supabase integration
const saveAdvocacyAnalysisToSupabase = async (postId, comments, analysis) => {
  try {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const commentAnalysis = analysis.analyses[i].analysis;
      
      await fetch(`https://manus-mcp-cli.com/supabase/execute_sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: SUPABASE_PROJECT_ID,
          query: `
            INSERT INTO instagram_comments (
              id, post_id, text, username, like_count,
              sentiment_score, sentiment_label, confidence_score, 
              keywords, advocacy_impact, behavioral_indicators
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) ON CONFLICT (id) DO UPDATE SET
              sentiment_score = EXCLUDED.sentiment_score,
              sentiment_label = EXCLUDED.sentiment_label,
              confidence_score = EXCLUDED.confidence_score,
              keywords = EXCLUDED.keywords,
              advocacy_impact = EXCLUDED.advocacy_impact,
              behavioral_indicators = EXCLUDED.behavioral_indicators,
              updated_at = now()
          `,
          params: [
            comment.id,
            postId,
            comment.text,
            comment.username || 'anonymous',
            comment.like_count || 0,
            commentAnalysis.score / 100,
            commentAnalysis.category,
            commentAnalysis.confidence / 100,
            JSON.stringify(commentAnalysis.keywords),
            commentAnalysis.advocacy_impact,
            JSON.stringify(commentAnalysis.behavioral_indicators)
          ]
        })
      });
    }
    
    console.log(`Saved advocacy analysis for ${comments.length} comments`);
  } catch (error) {
    console.error('Error saving advocacy analysis:', error);
  }
};

// Simple Help Text Component
const SimpleTooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="tooltip-container">
      <span 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="tooltip-trigger"
      >
        {children}
      </span>
      {showTooltip && (
        <div className="tooltip">
          {text}
        </div>
      )}
    </div>
  );
};

// Enhanced Inline Legend Component with detailed explanations
const InlineLegend = () => (
  <div className="inline-legend">
    <div className="legend-title">🔍 Advocacy Impact Analysis Key</div>
    <div className="legend-description">
      This analysis measures how effectively your content influences people's attitudes toward animal agriculture and veganism.
    </div>
    <div className="legend-items">
      <div className="legend-item">
        <span className="icon anti-ag">🚫</span>
        <div className="legend-content">
          <div className="legend-label">Anti-Animal Agriculture</div>
          <div className="legend-desc">Horrified by industry practices, expressing intent to go vegan or stop eating meat</div>
          <div className="legend-impact">🎯 <strong>Highly Effective</strong> - Your content is successfully converting people</div>
        </div>
      </div>
      <div className="legend-item">
        <span className="icon questioning">🤔</span>
        <div className="legend-content">
          <div className="legend-label">Questioning & Conflicted</div>
          <div className="legend-desc">Expressing doubt, considering changes, or showing internal conflict about their choices</div>
          <div className="legend-impact">📈 <strong>Moderately Effective</strong> - Potential converts, seeds planted</div>
        </div>
      </div>
      <div className="legend-item">
        <span className="icon defensive">🛡️</span>
        <div className="legend-content">
          <div className="legend-label">Defensive & Resistant</div>
          <div className="legend-desc">Showing cognitive dissonance, making excuses, or attacking the message</div>
          <div className="legend-impact">⚠️ <strong>Triggering Resistance</strong> - May need gentler approach</div>
        </div>
      </div>
      <div className="legend-item">
        <span className="icon pro-ag">🥩</span>
        <div className="legend-content">
          <div className="legend-label">Pro-Animal Agriculture</div>
          <div className="legend-desc">Actively defending industry practices, promoting animal products</div>
          <div className="legend-impact">❌ <strong>Ineffective</strong> - Content not resonating with this audience</div>
        </div>
      </div>
      <div className="legend-item">
        <span className="icon vegan">🌱</span>
        <div className="legend-content">
          <div className="legend-label">Already Vegan</div>
          <div className="legend-desc">Supporting your message, sharing experiences, encouraging others</div>
          <div className="legend-impact">👥 <strong>Preaching to Choir</strong> - Supportive but already converted</div>
        </div>
      </div>
    </div>
    <div className="legend-footer">
      <div className="legend-tip">
        💡 <strong>Tip:</strong> High conversion potential (🚫 + 🤔) with low resistance (🛡️ + 🥩) indicates highly effective advocacy content.
      </div>
    </div>
  </div>
);

// Intelligent Filtering Component
const FilterControls = ({ filters, onFiltersChange, posts }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Calculate filter statistics
  const highEngagementPosts = posts.filter(post => post.comments_count >= filters.minComments).length;
  const dateFilteredPosts = posts.filter(post => {
    const postDate = new Date(post.timestamp);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - filters.dateRange);
    return postDate >= cutoffDate;
  }).length;

  return (
    <div className="filter-controls">
      <div className="filter-section">
        <h3>🎯 Intelligent Filtering</h3>
        <div className="filter-grid">
          <div className="filter-item">
            <label>
              <SimpleTooltip text="Only analyze posts with high engagement to focus on content that generates significant discussion">
                <span>Min Comments: {filters.minComments}</span>
              </SimpleTooltip>
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={filters.minComments}
              onChange={(e) => handleFilterChange('minComments', parseInt(e.target.value))}
              className="filter-slider"
            />
            <div className="filter-stats">{highEngagementPosts} posts qualify</div>
          </div>

          <div className="filter-item">
            <label>
              <SimpleTooltip text="Analyze posts from the last X months to focus on recent content performance">
                <span>Date Range: {filters.dateRange} months</span>
              </SimpleTooltip>
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', parseInt(e.target.value))}
              className="filter-select"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={24}>Last 2 years</option>
              <option value={999}>All time</option>
            </select>
            <div className="filter-stats">{dateFilteredPosts} posts in range</div>
          </div>

          <div className="filter-item">
            <label>
              <SimpleTooltip text="Sort posts by different criteria to prioritize analysis">
                <span>Sort By</span>
              </SimpleTooltip>
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="comments_count">Most Comments</option>
              <option value="like_count">Most Likes</option>
              <option value="timestamp">Most Recent</option>
              <option value="engagement_rate">Highest Engagement</option>
            </select>
          </div>

          <div className="filter-item">
            <label>
              <SimpleTooltip text="Limit the number of posts to analyze to manage processing time">
                <span>Max Posts: {filters.maxPosts}</span>
              </SimpleTooltip>
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={filters.maxPosts}
              onChange={(e) => handleFilterChange('maxPosts', parseInt(e.target.value))}
              className="filter-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ current, total, label, showETA = false, startTime = null }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  // Calculate ETA
  let etaText = '';
  if (showETA && startTime && current > 0) {
    const elapsed = Date.now() - startTime;
    const avgTimePerItem = elapsed / current;
    const remaining = total - current;
    const eta = remaining * avgTimePerItem;
    const etaMinutes = Math.round(eta / 60000);
    etaText = etaMinutes > 0 ? ` (ETA: ${etaMinutes}m)` : ' (Almost done!)';
  }
  
  return (
    <div className="progress-container">
      <div className="progress-label">{label}{etaText}</div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="progress-text">{current} / {total} ({percentage}%)</div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [accountAnalysis, setAccountAnalysis] = useState(null);
  const [runningAccountAnalysis, setRunningAccountAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ 
    current: 0, 
    total: 0, 
    currentPost: '',
    startTime: null
  });

  // Enhanced filtering state
  const [filters, setFilters] = useState({
    minComments: 100,
    dateRange: 6, // months
    sortBy: 'comments_count',
    maxPosts: 50
  });

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

  // Enhanced post loading with intelligent filtering
  const loadPosts = async (page, limit = 200) => {
    setLoadingPosts(true);
    console.log(`Loading up to ${limit} Instagram posts with intelligent filtering...`);
    
    try {
      let allPosts = [];
      let url = `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}/media?fields=id,caption,media_url,permalink,like_count,comments_count,timestamp&access_token=${page.access_token}&limit=25`;
      let pageCount = 0;
      const maxPages = Math.ceil(limit / 25);
      
      while (url && pageCount < maxPages) {
        await rateLimiter.waitForRateLimit();
        
        pageCount++;
        console.log(`Loading page ${pageCount}/${maxPages}...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
          console.error('API Error:', data.error);
          break;
        }
        
        if (data.data && data.data.length > 0) {
          allPosts = [...allPosts, ...data.data];
          url = data.paging && data.paging.next ? data.paging.next : null;
        } else {
          break;
        }
      }
      
      // Apply intelligent filtering
      const filteredPosts = applyIntelligentFiltering(allPosts, filters);
      
      setPosts(filteredPosts);
      console.log(`Loaded ${filteredPosts.length} posts after intelligent filtering`);
      
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Apply intelligent filtering to posts
  const applyIntelligentFiltering = (posts, filters) => {
    let filtered = [...posts];
    
    // Filter by date range
    if (filters.dateRange < 999) {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - filters.dateRange);
      filtered = filtered.filter(post => new Date(post.timestamp) >= cutoffDate);
    }
    
    // Filter by minimum comments
    filtered = filtered.filter(post => post.comments_count >= filters.minComments);
    
    // Sort posts
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'comments_count':
          return b.comments_count - a.comments_count;
        case 'like_count':
          return b.like_count - a.like_count;
        case 'timestamp':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'engagement_rate':
          const aEngagement = (a.like_count + a.comments_count);
          const bEngagement = (b.like_count + b.comments_count);
          return bEngagement - aEngagement;
        default:
          return 0;
      }
    });
    
    // Limit number of posts
    return filtered.slice(0, filters.maxPosts);
  };

  // Enhanced advocacy impact analysis with rate limiting
  const analyzeAdvocacyImpact = async (postId) => {
    setLoading(prev => ({ ...prev, [postId]: true }));
    console.log(`Analyzing advocacy impact for post ${postId}...`);
    
    try {
      let allComments = [];
      let url = `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,text,username,like_count&access_token=${selectedPage.access_token}&limit=100`;
      let pageCount = 0;
      
      while (url && pageCount < 20) {
        await rateLimiter.waitForRateLimit();
        
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
      }
      
      const analysis = analyzeAdvocacyEffectiveness(allComments);
      
      // Save to Supabase
      await saveAdvocacyAnalysisToSupabase(postId, allComments, analysis);
      
      setComments(prev => ({ ...prev, [postId]: allComments }));
      setAnalyses(prev => ({ ...prev, [postId]: analysis }));
      
      console.log(`Analyzed advocacy impact: ${analysis.conversion_potential}% conversion potential`);
      
    } catch (error) {
      console.error('Error analyzing advocacy impact:', error);
    } finally {
      setLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Enhanced account-wide analysis with intelligent filtering
  const runAccountWideAnalysis = async () => {
    setRunningAccountAnalysis(true);
    const startTime = Date.now();
    console.log('Starting intelligent account-wide analysis...');
    
    try {
      // Apply current filters to posts
      const filteredPosts = applyIntelligentFiltering(posts, filters);
      console.log(`Analyzing ${filteredPosts.length} posts based on current filters`);
      
      setAnalysisProgress({ 
        current: 0, 
        total: filteredPosts.length, 
        currentPost: '',
        startTime
      });
      
      let allAccountComments = [];
      let totalPostsAnalyzed = 0;
      
      for (let i = 0; i < filteredPosts.length; i++) {
        const post = filteredPosts[i];
        const postDate = new Date(post.timestamp).toLocaleDateString();
        
        setAnalysisProgress({ 
          current: i + 1, 
          total: filteredPosts.length, 
          currentPost: `Analyzing post from ${postDate} (${post.comments_count} comments)`,
          startTime
        });
        
        if (comments[post.id]) {
          // Already analyzed
          allAccountComments = [...allAccountComments, ...comments[post.id]];
          totalPostsAnalyzed++;
        } else {
          // Analyze this post
          await analyzeAdvocacyImpact(post.id);
          if (comments[post.id]) {
            allAccountComments = [...allAccountComments, ...comments[post.id]];
            totalPostsAnalyzed++;
          }
        }
      }
      
      // Calculate account-wide metrics
      const accountAnalysis = analyzeAdvocacyEffectiveness(allAccountComments);
      accountAnalysis.posts_analyzed = totalPostsAnalyzed;
      accountAnalysis.total_comments = allAccountComments.length;
      accountAnalysis.filters_applied = filters;
      
      setAccountAnalysis(accountAnalysis);
      console.log(`Account-wide analysis complete: ${accountAnalysis.impact_score}/100 impact score`);
      
    } catch (error) {
      console.error('Error in account-wide analysis:', error);
    } finally {
      setRunningAccountAnalysis(false);
      setAnalysisProgress({ current: 0, total: 0, currentPost: '', startTime: null });
    }
  };

  const calculateOverallMetrics = () => {
    const totalPosts = posts.length;
    const analyzedPosts = Object.keys(analyses).length;
    const totalComments = Object.values(comments).reduce((sum, postComments) => sum + postComments.length, 0);
    
    if (analyzedPosts === 0) {
      return { totalPosts, analyzedPosts, totalComments, avgConversion: 0, avgImpactScore: 0 };
    }
    
    const allAnalyses = Object.values(analyses);
    const avgConversion = allAnalyses.reduce((sum, analysis) => sum + analysis.conversion_potential, 0) / allAnalyses.length;
    const avgImpactScore = allAnalyses.reduce((sum, analysis) => sum + analysis.impact_score, 0) / allAnalyses.length;
    
    return { 
      totalPosts, 
      analyzedPosts, 
      totalComments, 
      avgConversion: Math.round(avgConversion),
      avgImpactScore: Math.round(avgImpactScore)
    };
  };

  const metrics = calculateOverallMetrics();

  if (!user) {
    return (
      <div className="login-page">
        <h1>🌱 Vegan Advocacy Impact Analysis</h1>
        <p>Measure how effectively your content influences attitudes toward animal agriculture</p>
        <button onClick={login} className="login-btn">Login with Facebook</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🌱 Vegan Advocacy Impact Analysis</h1>
        <div className="metrics-bar">
          <div className="metric">
            <span className="label">
              Posts 
              <SimpleTooltip text="Total number of Instagram posts loaded from your account">
                <span className="help-icon">?</span>
              </SimpleTooltip>
            </span>
            <span className="value">{metrics.totalPosts}</span>
          </div>
          <div className="metric">
            <span className="label">
              Analyzed 
              <SimpleTooltip text="Number of posts that have been analyzed for advocacy effectiveness">
                <span className="help-icon">?</span>
              </SimpleTooltip>
            </span>
            <span className="value">{metrics.analyzedPosts}</span>
          </div>
          <div className="metric">
            <span className="label">
              Comments 
              <SimpleTooltip text="Total number of comments analyzed across all posts">
                <span className="help-icon">?</span>
              </SimpleTooltip>
            </span>
            <span className="value">{metrics.totalComments}</span>
          </div>
          <div className="metric">
            <span className="label">
              Avg Impact 
              <SimpleTooltip text="Average advocacy effectiveness score (0-100). Higher scores mean your content is more effective at influencing people toward veganism">
                <span className="help-icon">?</span>
              </SimpleTooltip>
            </span>
            <span className="value">{metrics.avgImpactScore}/100</span>
          </div>
          <div className="metric">
            <span className="label">
              Avg Conversion 
              <SimpleTooltip text="Average percentage of people showing openness to change (those who are horrified by animal agriculture + those questioning their choices)">
                <span className="help-icon">?</span>
              </SimpleTooltip>
            </span>
            <span className="value">{metrics.avgConversion}%</span>
          </div>
        </div>
      </header>

      <MetricsExplanation />

      <FilterControls 
        filters={filters} 
        onFiltersChange={setFilters} 
        posts={posts} 
      />

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
          onClick={runAccountWideAnalysis}
          disabled={runningAccountAnalysis || posts.length === 0}
          className="account-analysis-btn"
        >
          {runningAccountAnalysis ? 'Analyzing Account...' : `Run Intelligent Analysis (${applyIntelligentFiltering(posts, filters).length} posts)`}
        </button>
      </div>

      {runningAccountAnalysis && analysisProgress.total > 0 && (
        <div className="analysis-progress">
          <ProgressBar 
            current={analysisProgress.current} 
            total={analysisProgress.total} 
            label="Intelligent Account Analysis Progress"
            showETA={true}
            startTime={analysisProgress.startTime}
          />
          <div className="current-post">{analysisProgress.currentPost}</div>
        </div>
      )}

      {accountAnalysis && (
        <div className="account-analysis">
          <h2>📊 Intelligent Account-Wide Advocacy Analysis</h2>
          
          {accountAnalysis.filters_applied && (
            <div className="filters-applied">
              <h4>🎯 Filters Applied</h4>
              <div className="filter-summary">
                <span>Min Comments: {accountAnalysis.filters_applied.minComments}</span>
                <span>Date Range: {accountAnalysis.filters_applied.dateRange} months</span>
                <span>Sort By: {accountAnalysis.filters_applied.sortBy}</span>
                <span>Max Posts: {accountAnalysis.filters_applied.maxPosts}</span>
              </div>
            </div>
          )}
          <div className="account-metrics">
            <div className="impact-score-card">
              <h3>Overall Impact Score</h3>
              <div className="score-display">
                <span className="score">{accountAnalysis.impact_score}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${accountAnalysis.impact_score}%` }}
                ></div>
              </div>
              <p className="effectiveness">{accountAnalysis.overall_effectiveness.replace('_', ' ').toUpperCase()}</p>
            </div>
            
            <div className="conversion-metrics">
              <div className="metric-card">
                <h4>
                  <SimpleTooltip text="Percentage of people showing openness to change (horrified + questioning)">
                    Conversion Potential
                  </SimpleTooltip>
                </h4>
                <span className="metric-value">{accountAnalysis.conversion_potential}%</span>
              </div>
              <div className="metric-card">
                <h4>
                  <SimpleTooltip text="Percentage of people showing defensive or resistant responses">
                    Resistance Level
                  </SimpleTooltip>
                </h4>
                <span className="metric-value">{accountAnalysis.resistance_level}%</span>
              </div>
              <div className="metric-card">
                <h4>
                  <SimpleTooltip text="Number of high-engagement posts analyzed">
                    Posts Analyzed
                  </SimpleTooltip>
                </h4>
                <span className="metric-value">{accountAnalysis.posts_analyzed}</span>
              </div>
              <div className="metric-card">
                <h4>
                  <SimpleTooltip text="Total number of comments analyzed across all posts">
                    Total Comments
                  </SimpleTooltip>
                </h4>
                <span className="metric-value">{accountAnalysis.total_comments}</span>
              </div>
            </div>
          </div>
          
          <div className="account-distribution">
            <h4>Audience Response Distribution</h4>
            <div className="distribution-grid">
              <div className="dist-item anti-ag">
                <span className="icon">🚫</span>
                <span className="count">{accountAnalysis.distribution.antiAnimalAg || 0}</span>
                <span className="label">Anti-Animal Ag</span>
              </div>
              <div className="dist-item questioning">
                <span className="icon">🤔</span>
                <span className="count">{accountAnalysis.distribution.questioning || 0}</span>
                <span className="label">Questioning</span>
              </div>
              <div className="dist-item defensive">
                <span className="icon">🛡️</span>
                <span className="count">{accountAnalysis.distribution.defensive || 0}</span>
                <span className="label">Defensive</span>
              </div>
              <div className="dist-item pro-ag">
                <span className="icon">🥩</span>
                <span className="count">{accountAnalysis.distribution.proAnimalAg || 0}</span>
                <span className="label">Pro-Animal Ag</span>
              </div>
              <div className="dist-item vegan">
                <span className="icon">🌱</span>
                <span className="count">{accountAnalysis.distribution.alreadyVegan || 0}</span>
                <span className="label">Already Vegan</span>
              </div>
            </div>
          </div>

          {accountAnalysis.advocacy_insights.length > 0 && (
            <div className="account-insights">
              <h4>🎯 Key Insights</h4>
              <ul>
                {accountAnalysis.advocacy_insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loadingPosts && <div className="loading">Loading posts with intelligent filtering...</div>}

      {posts.length > 0 && <InlineLegend />}

      <div className="posts">
        {applyIntelligentFiltering(posts, filters).map(post => (
          <div key={post.id} className="post">
            <div className="post-header">
              <span className="date">{new Date(post.timestamp).toLocaleDateString()}</span>
              <span className="stats">{post.like_count} likes • {post.comments_count} comments</span>
              <button
                onClick={() => analyzeAdvocacyImpact(post.id)}
                disabled={loading[post.id]}
                className="analyze-btn"
              >
                {loading[post.id] ? 'Analyzing...' : 'Analyze Advocacy Impact'}
              </button>
            </div>
            
            <div className="post-content">
              {post.caption && <p className="caption">{post.caption.substring(0, 300)}...</p>}
            </div>
            
            {analyses[post.id] && (
              <div className="analysis">
                <div className="impact-header">
                  <div className="impact-score">
                    <span className="score-label">Impact Score:</span>
                    <span className="score-value">{analyses[post.id].impact_score}/100</span>
                    <div className="score-bar-small">
                      <div 
                        className="score-fill-small" 
                        style={{ width: `${analyses[post.id].impact_score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="conversion-resistance">
                    <span className="conversion">
                      <SimpleTooltip text="Percentage showing openness to change">
                        Conversion: {analyses[post.id].conversion_potential}%
                      </SimpleTooltip>
                    </span>
                    <span className="resistance">
                      <SimpleTooltip text="Percentage showing defensive responses">
                        Resistance: {analyses[post.id].resistance_level}%
                      </SimpleTooltip>
                    </span>
                  </div>
                </div>
                
                <div className="distribution">
                  <span className="anti-ag" title="Anti-Animal Agriculture - Horrified, considering veganism">
                    🚫 {analyses[post.id].distribution.antiAnimalAg || 0}
                  </span>
                  <span className="questioning" title="Questioning/Conflicted - Potential converts">
                    🤔 {analyses[post.id].distribution.questioning || 0}
                  </span>
                  <span className="defensive" title="Defensive - Cognitive dissonance">
                    🛡️ {analyses[post.id].distribution.defensive || 0}
                  </span>
                  <span className="pro-ag" title="Pro-Animal Agriculture - Supporting industry">
                    🥩 {analyses[post.id].distribution.proAnimalAg || 0}
                  </span>
                  <span className="vegan" title="Already Vegan - Supporting your message">
                    🌱 {analyses[post.id].distribution.alreadyVegan || 0}
                  </span>
                </div>
                
                {analyses[post.id].advocacy_insights.length > 0 && (
                  <div className="insights">
                    <strong>Key Insights:</strong>
                    <ul>
                      {analyses[post.id].advocacy_insights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="comment-count">
                  {comments[post.id]?.length} comments analyzed • Advocacy data saved to database
                </div>
                
                <InlineLegend />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
