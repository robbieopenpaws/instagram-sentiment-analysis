import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

const FACEBOOK_APP_ID = '760837916843241';

// Enhanced sentiment analysis for vegan advocacy
const analyzeAdvocacyImpact = (text) => {
  const lowerText = text.toLowerCase();
  
  // Anti-animal agriculture keywords (strong advocacy impact)
  const antiAnimalAgKeywords = [
    'factory farm', 'animal cruelty', 'slaughter', 'suffering', 'torture', 'abuse',
    'environmental impact', 'climate change', 'greenhouse gas', 'deforestation',
    'water pollution', 'land use', 'sustainability', 'ethical', 'compassion',
    'go vegan', 'plant based', 'stop eating meat', 'animal rights', 'exploitation'
  ];
  
  // Questioning/curious keywords (moderate advocacy impact)
  const questioningKeywords = [
    'interesting', 'never thought', 'makes me think', 'good point', 'eye opening',
    'didnt know', 'learn more', 'tell me more', 'how do', 'what about',
    'considering', 'maybe', 'perhaps', 'might try', 'thinking about'
  ];
  
  // Defensive keywords (low advocacy impact)
  const defensiveKeywords = [
    'personal choice', 'my choice', 'stop preaching', 'forcing', 'judging',
    'respect my choice', 'not your business', 'live and let live', 'to each their own',
    'dont tell me', 'mind your own', 'freedom', 'my decision'
  ];
  
  // Pro-animal agriculture keywords (negative advocacy impact)
  const proAnimalAgKeywords = [
    'love meat', 'bacon', 'steak', 'delicious', 'tasty', 'yummy',
    'need protein', 'natural', 'food chain', 'apex predator', 'tradition',
    'farmers', 'agriculture', 'livestock', 'humane', 'free range'
  ];
  
  // Already vegan keywords (neutral advocacy impact)
  const alreadyVeganKeywords = [
    'already vegan', 'been vegan', 'vegan for', 'plant based for',
    'stopped eating meat', 'gave up meat', 'no longer eat', 'switched to vegan'
  ];
  
  let maxScore = 0;
  let category = 'defensive'; // Default to a valid database category
  let advocacy_impact = 'low';
  let conversion_potential = 0.3;
  let resistance_level = 0.3;
  
  // Check each category
  const antiScore = antiAnimalAgKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? keyword.split(' ').length : 0), 0);
  const questioningScore = questioningKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? keyword.split(' ').length : 0), 0);
  const defensiveScore = defensiveKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? keyword.split(' ').length : 0), 0);
  const proScore = proAnimalAgKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? keyword.split(' ').length : 0), 0);
  const veganScore = alreadyVeganKeywords.reduce((score, keyword) => 
    score + (lowerText.includes(keyword) ? keyword.split(' ').length : 0), 0);
  
  const scores = [
    { category: 'anti_animal_ag', score: antiScore },
    { category: 'questioning', score: questioningScore },
    { category: 'defensive', score: defensiveScore },
    { category: 'pro_animal_ag', score: proScore },
    { category: 'already_vegan', score: veganScore }
  ];
  
  const highest = scores.reduce((max, current) => current.score > max.score ? current : max);
  
  if (highest.score > 0) {
    category = highest.category;
    maxScore = highest.score;
  }
  
  // Set advocacy impact based on category
  if (category === 'anti_animal_ag') {
    advocacy_impact = 'very_high';
    conversion_potential = 0.9;
    resistance_level = 0.1;
  } else if (category === 'questioning') {
    advocacy_impact = 'high';
    conversion_potential = 0.7;
    resistance_level = 0.2;
  } else if (category === 'already_vegan') {
    advocacy_impact = 'medium';
    conversion_potential = 0.1;
    resistance_level = 0.0;
  } else if (category === 'defensive') {
    advocacy_impact = 'low';
    conversion_potential = 0.2;
    resistance_level = 0.8;
  } else if (category === 'pro_animal_ag') {
    advocacy_impact = 'very_low';
    conversion_potential = 0.1;
    resistance_level = 0.9;
  }

  // Ensure all values are valid for database
  const validCategories = ['anti_animal_ag', 'questioning', 'defensive', 'pro_animal_ag', 'already_vegan'];
  const validImpacts = ['very_low', 'low', 'medium', 'high', 'very_high'];
  
  // Safety checks
  if (!validCategories.includes(category)) {
    category = 'defensive';
  }
  if (!validImpacts.includes(advocacy_impact)) {
    advocacy_impact = 'low';
  }

  return {
    category: category,
    confidence: Math.min(maxScore / 10, 1) || 0,
    score: (maxScore / 10) || 0,
    advocacy_impact: advocacy_impact,
    conversion_potential: conversion_potential || 0,
    resistance_level: resistance_level || 0
  };
};

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [accountAnalysis, setAccountAnalysis] = useState(null);
  const [postUrl, setPostUrl] = useState('');
  const [debugLogs, setDebugLogs] = useState([]);
  const [currentOperation, setCurrentOperation] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  // Filter settings
  const [minComments, setMinComments] = useState(100);
  const [dateRange, setDateRange] = useState(6);
  const [sortBy, setSortBy] = useState('comments');
  const [maxPosts, setMaxPosts] = useState(50);

  // Add debug logging function
  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
    setDebugLogs(prev => [...prev.slice(-20), logEntry]); // Keep last 20 logs
  };

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
  const loginWithFacebook = () => {
    setLoading(true);
    setError('');
    
    window.FB.login(function(response) {
      if (response.authResponse) {
        const userData = {
          id: response.authResponse.userID,
          accessToken: response.authResponse.accessToken
        };
        setUser(userData);
        
        // Fetch available Instagram accounts after setting user
        fetchAvailableAccounts(userData.accessToken).then(() => {
          setLoading(false);
        }).catch((err) => {
          console.error('Error fetching accounts:', err);
          setLoading(false);
        });
      } else {
        setError('Facebook login failed. Please try again.');
        setLoading(false);
      }
    }, {
      scope: 'instagram_basic,pages_show_list,instagram_manage_insights'
    });
  };

  // Fetch available Instagram accounts
  const fetchAvailableAccounts = async (accessToken) => {
    try {
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data) return;
      
      const accounts = [];
      
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
          const igData = await igResponse.json();
          
          if (igData.instagram_business_account) {
            // Get Instagram account details
            const igDetailsResponse = await fetch(`https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username,name&access_token=${accessToken}`);
            const igDetails = await igDetailsResponse.json();
            
            accounts.push({
              id: igData.instagram_business_account.id,
              username: igDetails.username || 'Unknown',
              name: igDetails.name || page.name,
              pageId: page.id,
              pageName: page.name
            });
          }
        } catch (err) {
          console.log('Error fetching Instagram details for page:', page.name);
        }
      }
      
      setAvailableAccounts(accounts);
      if (accounts.length === 1) {
        setSelectedAccountId(accounts[0].id);
      }
    } catch (err) {
      console.error('Error fetching Instagram accounts:', err);
    }
  };

  // Generate AI analysis paragraph
  const generateDeepAnalysis = (analysis, post) => {
    const totalComments = analysis.total_comments;
    const antiAnimalAg = analysis.categories['anti-animal-ag'];
    const questioning = analysis.categories['questioning'];
    const defensive = analysis.categories['defensive'];
    const proAnimalAg = analysis.categories['pro-animal-ag'];
    const alreadyVegan = analysis.categories['already-vegan'];
    
    const conversionRate = Math.round(((antiAnimalAg + questioning) / totalComments) * 100);
    const resistanceRate = Math.round(((defensive + proAnimalAg) / totalComments) * 100);
    
    // Analyze emotional intensity and themes
    const emotionalIntensity = analysis.detailed_comments.reduce((sum, comment) => {
      const intensity = comment.text.match(/[!]{2,}|[A-Z]{3,}|amazing|disgusting|love|hate|incredible|terrible/gi);
      return sum + (intensity ? intensity.length : 0);
    }, 0);
    
    const keyThemes = [];
    const environmentalMentions = analysis.detailed_comments.filter(c => 
      /environment|climate|planet|earth|sustainability/i.test(c.text)).length;
    const healthMentions = analysis.detailed_comments.filter(c => 
      /health|nutrition|protein|vitamin|diet/i.test(c.text)).length;
    const animalMentions = analysis.detailed_comments.filter(c => 
      /animal|cruelty|suffering|rights|welfare/i.test(c.text)).length;
    const personalMentions = analysis.detailed_comments.filter(c => 
      /personal|choice|freedom|force|preach/i.test(c.text)).length;
    
    if (environmentalMentions > totalComments * 0.1) keyThemes.push('environmental concerns');
    if (healthMentions > totalComments * 0.1) keyThemes.push('health and nutrition');
    if (animalMentions > totalComments * 0.1) keyThemes.push('animal welfare');
    if (personalMentions > totalComments * 0.1) keyThemes.push('personal choice debates');
    
    // Generate comprehensive analysis
    let analysisText = `This post generated significant engagement with ${totalComments} comments, revealing important insights into audience attitudes toward animal agriculture and veganism. `;
    
    if (conversionRate > 40) {
      analysisText += `The content demonstrates strong advocacy effectiveness with ${conversionRate}% of responses showing openness to anti-animal agriculture perspectives. `;
    } else if (conversionRate > 20) {
      analysisText += `The content shows moderate advocacy impact with ${conversionRate}% of responses indicating potential for attitude change. `;
    } else {
      analysisText += `The content faces significant resistance with only ${conversionRate}% of responses showing openness to change. `;
    }
    
    if (antiAnimalAg > questioning) {
      analysisText += `Notably, ${antiAnimalAg} commenters expressed strong anti-animal agriculture sentiments, suggesting the content effectively reinforced existing beliefs and potentially converted fence-sitters. `;
    } else if (questioning > 0) {
      analysisText += `Encouragingly, ${questioning} commenters showed genuine curiosity and questioning, indicating the content successfully planted seeds of doubt about animal agriculture. `;
    }
    
    if (resistanceRate > 30) {
      analysisText += `However, ${resistanceRate}% of responses showed defensive or pro-animal agriculture stances, highlighting the polarizing nature of the topic. `;
      if (defensive > proAnimalAg) {
        analysisText += `The prevalence of defensive responses (${defensive}) suggests the content triggered cognitive dissonance, which can be a precursor to attitude change with continued exposure. `;
      }
    }
    
    if (keyThemes.length > 0) {
      analysisText += `Key discussion themes included ${keyThemes.join(', ')}, indicating which aspects of veganism resonate most with this audience. `;
    }
    
    if (emotionalIntensity > totalComments * 0.3) {
      analysisText += `The high emotional intensity in responses suggests the content successfully evoked strong feelings, which is crucial for memorable advocacy impact. `;
    }
    
    // Strategic recommendations
    if (questioning > antiAnimalAg) {
      analysisText += `Strategic recommendation: Follow up with educational content addressing common questions to convert curious commenters into advocates.`;
    } else if (defensive > questioning) {
      analysisText += `Strategic recommendation: Consider softer messaging approaches to reduce defensiveness while maintaining advocacy impact.`;
    } else {
      analysisText += `Strategic recommendation: This content format appears highly effective - replicate similar messaging and themes for maximum advocacy impact.`;
    }
    
    return analysisText;
  };

  // Load individual post from URL
  const loadInstagramPostFromUrl = async () => {
    try {
      if (!postUrl.trim()) {
        setError('Please enter an Instagram post URL');
        return;
      }

      if (!user || !user.accessToken) {
        setError('Please login with Facebook first');
        return;
      }

      if (!selectedAccountId) {
        setError('Please select an Instagram account first');
        return;
      }

      // Clear previous state
      setLoading(true);
      setAnalyzing(true);
      setProgress(0);
      setError('');
      setDebugLogs([]);
      setCurrentOperation('Starting analysis...');
      
      addDebugLog('Starting Instagram post analysis');
      addDebugLog(`Post URL: ${postUrl}`);
      
      // Extract post ID from Instagram URL
      setCurrentOperation('Extracting post ID...');
      addDebugLog('Extracting post ID from URL');
      const postIdMatch = postUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
      if (!postIdMatch) {
        throw new Error('Invalid Instagram post URL. Please use format: https://www.instagram.com/p/POST_ID/');
      }
      
      const shortcode = postIdMatch[1];
      addDebugLog(`Extracted shortcode: ${shortcode}`);
      
      // Use the selected Instagram account
      setCurrentOperation('Using selected Instagram account...');
      setProgress(10);
      const instagramAccountId = selectedAccountId;
      addDebugLog(`Using selected Instagram account ID: ${instagramAccountId}`);
      
      // Get Instagram media - fetch more posts to increase chances of finding the target
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=100&access_token=${user.accessToken}`);
      const mediaData = await mediaResponse.json();
      
      if (!mediaData.data) {
        throw new Error('Could not fetch Instagram posts. Make sure your Instagram account is connected.');
      }
      
      console.log('Total posts found:', mediaData.data.length);
      console.log('Looking for shortcode:', shortcode);
      
      // Try multiple methods to find the post
      let targetPost = null;
      
      // Method 1: Try permalink matching (if available)
      if (!targetPost) {
        targetPost = mediaData.data.find(post => post.permalink && post.permalink.includes(shortcode));
        if (targetPost) console.log('Found post via permalink matching');
      }
      
      // Method 2: Try to get individual post data using Instagram's media endpoint
      if (!targetPost) {
        try {
          // Try to construct the media ID from shortcode (Instagram's internal method)
          for (const post of mediaData.data) {
            try {
              // Get detailed post info which might include the shortcode
              const detailResponse = await fetch(`https://graph.facebook.com/v18.0/${post.id}?fields=id,caption,media_type,permalink,timestamp,like_count,comments_count,shortcode&access_token=${user.accessToken}`);
              const detailData = await detailResponse.json();
              
              if (detailData.shortcode === shortcode || 
                  (detailData.permalink && detailData.permalink.includes(shortcode))) {
                targetPost = detailData;
                console.log('Found post via detailed lookup');
                break;
              }
            } catch (err) {
              // Continue to next post
            }
          }
        } catch (err) {
          console.log('Detailed lookup failed:', err);
        }
      }
      
      // Method 3: If still not found, show available posts for manual selection
      if (!targetPost) {
        const recentPosts = mediaData.data.slice(0, 10).map((post, index) => {
          const date = new Date(post.timestamp).toLocaleDateString();
          const caption = post.caption ? post.caption.substring(0, 100) + '...' : 'No caption';
          return `${index + 1}. ${date} - ${caption}`;
        }).join('\n');
        
        throw new Error(`Post with shortcode "${shortcode}" not found in your recent posts. 

This might happen because:
1. The post is older than your recent 100 posts
2. The post URL format is different
3. The Instagram API permissions need adjustment

Your recent posts:
${recentPosts}

Try using a more recent post URL, or contact support if this is a recent post.`);
      }
        // Step 4: Fetch all comments using chunked approach
      setCurrentOperation('Fetching comments in chunks...');
      setProgress(30);
      
      let allComments = []; // Declare outside try block to fix scope issue
      
      try {
        addDebugLog(`Starting chunked fetch for post with ${targetPost.comments_count} total comments`);
      
      // First, clear any existing comments for this post in Supabase
      const { error: deleteError } = await supabase
        .from('advocacy_comments')
        .delete()
        .eq('post_id', targetPost.id);
      
      if (deleteError) {
        addDebugLog(`Warning: Could not clear existing comments: ${deleteError.message}`, 'warn');
      }
      
      let totalCommentsFetched = 0;
      let nextUrl = `https://graph.facebook.com/v18.0/${targetPost.id}/comments?fields=text,username,timestamp&limit=100&access_token=${user.accessToken}`;
      let chunkCount = 0;
      const maxChunks = 15; // Limit to prevent infinite loops (1500 comments max)
      
      try {
        while (nextUrl && chunkCount < maxChunks) {
          try {
            const currentProgress = 20 + (chunkCount / maxChunks) * 60;
            setProgress(currentProgress);
            setCurrentOperation(`Fetching chunk ${chunkCount + 1}/${maxChunks}... (${totalCommentsFetched} comments so far)`);
            addDebugLog(`Fetching chunk ${chunkCount + 1}, total comments so far: ${totalCommentsFetched}`);
            
            const commentsResponse = await fetch(nextUrl);
            
            if (!commentsResponse.ok) {
              const errorMsg = `Comments API response not ok: ${commentsResponse.status} ${commentsResponse.statusText}`;
              addDebugLog(errorMsg, 'error');
              throw new Error(errorMsg);
            }
            
            addDebugLog(`Comments API response OK, parsing JSON...`);
            const commentsData = await commentsResponse.json();
            
            if (commentsData.error) {
              const errorMsg = `Comments API error: ${JSON.stringify(commentsData.error)}`;
              addDebugLog(errorMsg, 'error');
              throw new Error(errorMsg);
            }
            
            if (commentsData.data && Array.isArray(commentsData.data)) {
              const chunkComments = commentsData.data;
              addDebugLog(`Chunk ${chunkCount + 1}: Received ${chunkComments.length} comments`);
              
              // Store this chunk in Supabase immediately
              setCurrentOperation(`Storing chunk ${chunkCount + 1} in database...`);
              
              const commentsToStore = chunkComments.map((comment, index) => {
                // Quick sentiment analysis for database storage
                const sentiment = analyzeAdvocacyImpact(comment.text || '');
                
                // Ensure all values are valid and not null
                const validCategory = sentiment.category || 'defensive';
                const validImpact = sentiment.advocacy_impact || 'low';
                const validScore = typeof sentiment.score === 'number' ? sentiment.score : 0;
                const validConversion = typeof sentiment.conversion_potential === 'number' ? sentiment.conversion_potential : 0;
                const validResistance = typeof sentiment.resistance_level === 'number' ? sentiment.resistance_level : 0;
                
                return {
                  post_id: targetPost.id,
                  comment_id: comment.id || `${targetPost.id}_${Date.now()}_${index}`,
                  text: comment.text || '',
                  username: comment.username || 'unknown',
                  timestamp: comment.timestamp || new Date().toISOString(),
                  advocacy_category: validCategory,
                  sentiment_score: validScore
                };
              });
              
              const { error: insertError } = await supabase
                .from('advocacy_comments')
                .insert(commentsToStore);
              
              if (insertError) {
                addDebugLog(`Error storing chunk ${chunkCount + 1}: ${insertError.message}`, 'error');
                throw new Error(`Failed to store comments in database: ${insertError.message}`);
              }
              
              totalCommentsFetched += chunkComments.length;
              addDebugLog(`Chunk ${chunkCount + 1}: Stored ${chunkComments.length} comments. Total: ${totalCommentsFetched}`);
              
            } else {
              addDebugLog(`No valid comments data in chunk ${chunkCount + 1}`, 'warn');
            }
            
            // Check if there are more comments to fetch
            if (commentsData.paging && commentsData.paging.next && commentsData.data && commentsData.data.length > 0) {
              nextUrl = commentsData.paging.next;
              chunkCount++;
              addDebugLog(`Has next page, continuing... (chunk ${chunkCount} complete)`);
              // Add delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              addDebugLog('No more pages to fetch');
              nextUrl = null;
            }
            
          } catch (chunkError) {
            const errorMsg = `Error processing chunk ${chunkCount + 1}: ${chunkError.message}`;
            addDebugLog(errorMsg, 'error');
            throw chunkError;
          }
        }
        
        addDebugLog(`Successfully fetched and stored ${totalCommentsFetched} total comments in ${chunkCount} chunks`);
        
        // Now retrieve all comments from Supabase for analysis
        setCurrentOperation('Loading comments from database for analysis...');
        setProgress(85);
        
        const { data: storedComments, error: fetchError } = await supabase
          .from('advocacy_comments')
          .select('*')
          .eq('post_id', targetPost.id)
          .order('timestamp', { ascending: true });
        
        if (fetchError) {
          throw new Error(`Failed to retrieve comments from database: ${fetchError.message}`);
        }
        
        addDebugLog(`Retrieved ${storedComments?.length || 0} comments from database for analysis`);
        
        // Convert Supabase format back to Instagram format for analysis
        allComments = (storedComments || []).map(comment => ({
          text: comment.text,
          username: comment.username,
          timestamp: comment.timestamp,
          id: comment.comment_id
        }));
        
      } catch (fetchError) {
        const errorMsg = `Error in chunked comment fetching: ${fetchError.message}`;
        addDebugLog(errorMsg, 'error');
        throw fetchError;
      }
      
      // Step 5: Create post object and complete analysis
      setProgress(90);
      
      const post = {
        id: targetPost.id,
        caption: targetPost.caption || '',
        media_type: targetPost.media_type,
        like_count: targetPost.like_count || 0,
        comments_count: targetPost.comments_count || 0,
        timestamp: targetPost.timestamp,
        url: postUrl,
        comments: allComments
      };
      
      console.log(`Created post object with ${allComments.length} comments`);
      
      setPosts([post]);
      setProgress(100);
      setLoading(false);
      setAnalyzing(false);
      
    } catch (err) {
      const errorMessage = `Failed to load post: ${err.message}`;
      addDebugLog(`FATAL ERROR: ${err.message}`, 'error');
      addDebugLog(`Error stack: ${err.stack}`, 'error');
      console.error('Error in loadInstagramPostFromUrl:', err);
      
      setError(errorMessage);
      setCurrentOperation('Error occurred');
      setLoading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  // Enhanced analyze individual post
  const analyzePost = (post) => {
    if (!post.comments) return null;

    const analysis = {
      total_comments: post.comments.length,
      categories: {
        'anti-animal-ag': 0,
        'questioning': 0,
        'defensive': 0,
        'pro-animal-ag': 0,
        'already-vegan': 0
      },
      detailed_comments: [],
      impact_score: 0,
      conversion_potential: 0,
      resistance_level: 0,
      emotional_intensity: 0,
      key_themes: [],
      audience_segments: {},
      deep_analysis: ''
    };

    post.comments.forEach(comment => {
      const sentiment = analyzeAdvocacyImpact(comment.text);
      analysis.categories[sentiment.category]++;
      analysis.detailed_comments.push({
        text: comment.text,
        username: comment.username,
        category: sentiment.category,
        impact: sentiment.advocacy_impact,
        conversion_potential: sentiment.conversion_potential,
        resistance_level: sentiment.resistance_level
      });
    });

    // Calculate overall metrics
    const totalComments = analysis.total_comments;
    const positiveResponses = analysis.categories['anti-animal-ag'] + analysis.categories['questioning'];
    const negativeResponses = analysis.categories['defensive'] + analysis.categories['pro-animal-ag'];
    
    analysis.impact_score = Math.round((positiveResponses / totalComments) * 100);
    analysis.conversion_potential = Math.round(((analysis.categories['anti-animal-ag'] * 0.8 + analysis.categories['questioning'] * 0.6) / totalComments) * 100);
    analysis.resistance_level = Math.round((negativeResponses / totalComments) * 100);
    
    // Calculate emotional intensity
    analysis.emotional_intensity = Math.round((analysis.detailed_comments.reduce((sum, comment) => {
      const intensity = comment.text.match(/[!]{2,}|[A-Z]{3,}|amazing|disgusting|love|hate|incredible|terrible/gi);
      return sum + (intensity ? intensity.length : 0);
    }, 0) / totalComments) * 100);
    
    // Identify key themes
    const themes = {
      environmental: analysis.detailed_comments.filter(c => /environment|climate|planet|earth|sustainability/i.test(c.text)).length,
      health: analysis.detailed_comments.filter(c => /health|nutrition|protein|vitamin|diet/i.test(c.text)).length,
      animal_welfare: analysis.detailed_comments.filter(c => /animal|cruelty|suffering|rights|welfare/i.test(c.text)).length,
      personal_choice: analysis.detailed_comments.filter(c => /personal|choice|freedom|force|preach/i.test(c.text)).length,
      economics: analysis.detailed_comments.filter(c => /cost|expensive|cheap|afford|price/i.test(c.text)).length
    };
    
    analysis.key_themes = Object.entries(themes)
      .filter(([theme, count]) => count > totalComments * 0.05)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme: theme.replace('_', ' '), count, percentage: Math.round((count / totalComments) * 100) }));
    
    // Audience segmentation
    analysis.audience_segments = {
      advocates: analysis.categories['anti-animal-ag'],
      curious: analysis.categories['questioning'],
      resistant: analysis.categories['defensive'],
      opponents: analysis.categories['pro-animal-ag'],
      already_converted: analysis.categories['already-vegan']
    };
    
    // Generate deep AI analysis
    analysis.deep_analysis = generateDeepAnalysis(analysis, post);

    return analysis;
  };

  // Run account-wide analysis (keeping existing implementation)
  const runAccountWideAnalysis = async () => {
    if (!user || !user.accessToken) {
      setError('Please login with Facebook first');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setError('');
    
    try {
      setProgress(10);
      
      // Get Instagram Business Account ID
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${user.accessToken}`);
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook pages found. You need a Facebook page connected to an Instagram Business account.');
      }
      
      let instagramAccountId = null;
      
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${user.accessToken}`);
          const igData = await igResponse.json();
          
          if (igData.instagram_business_account) {
            instagramAccountId = igData.instagram_business_account.id;
            break;
          }
        } catch (err) {
          console.log('No Instagram account for page:', page.name);
        }
      }
      
      if (!instagramAccountId) {
        throw new Error('No Instagram Business account found. Please connect your Instagram Business account to your Facebook page.');
      }
      
      setProgress(20);
      
      // Calculate date filter
      const dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - dateRange);
      const since = Math.floor(dateFilter.getTime() / 1000);
      
      // Get Instagram media with filtering
      const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media?fields=id,caption,media_type,permalink,timestamp,like_count,comments_count&since=${since}&limit=${maxPosts}&access_token=${user.accessToken}`);
      const mediaData = await mediaResponse.json();
      
      if (!mediaData.data) {
        throw new Error('Could not fetch Instagram posts. Make sure your Instagram account is connected.');
      }
      
      setProgress(40);
      
      // Filter posts by minimum comments
      const filteredPosts = mediaData.data.filter(post => 
        (post.comments_count || 0) >= minComments
      );
      
      // Sort posts based on sortBy setting
      filteredPosts.sort((a, b) => {
        switch (sortBy) {
          case 'comments':
            return (b.comments_count || 0) - (a.comments_count || 0);
          case 'likes':
            return (b.like_count || 0) - (a.like_count || 0);
          case 'recent':
            return new Date(b.timestamp) - new Date(a.timestamp);
          case 'engagement':
            const aEngagement = (a.like_count || 0) + (a.comments_count || 0);
            const bEngagement = (b.like_count || 0) + (b.comments_count || 0);
            return bEngagement - aEngagement;
          default:
            return 0;
        }
      });
      
      setProgress(60);
      
      // Analyze posts with rate limiting
      const analyzedPosts = [];
      const categoryTotals = {
        'anti-animal-ag': 0,
        'questioning': 0,
        'defensive': 0,
        'pro-animal-ag': 0,
        'already-vegan': 0
      };
      
      let totalComments = 0;
      let totalImpactScore = 0;
      let totalConversionPotential = 0;
      let totalResistanceLevel = 0;
      
      for (let i = 0; i < Math.min(filteredPosts.length, maxPosts); i++) {
        const post = filteredPosts[i];
        
        try {
          // Get ALL comments for this post with pagination and rate limiting
          await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
          
          let allComments = [];
          let nextUrl = `https://graph.facebook.com/v18.0/${post.id}/comments?fields=text,username,timestamp&limit=100&access_token=${user.accessToken}`;
          
          while (nextUrl && allComments.length < 1000) { // Limit to 1000 comments per post for performance
            const commentsResponse = await fetch(nextUrl);
            const commentsData = await commentsResponse.json();
            
            if (commentsData.data) {
              allComments = allComments.concat(commentsData.data);
            }
            
            if (commentsData.paging && commentsData.paging.next) {
              nextUrl = commentsData.paging.next;
              await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting between pages
            } else {
              nextUrl = null;
            }
          }
          
          if (allComments && allComments.length > 0) {
            const postWithComments = {
              ...post,
              comments: allComments
            };
            
            const analysis = analyzePost(postWithComments);
            if (analysis) {
              analyzedPosts.push({
                ...postWithComments,
                analysis
              });
              
              // Aggregate data
              Object.keys(categoryTotals).forEach(category => {
                categoryTotals[category] += analysis.categories[category];
              });
              
              totalComments += analysis.total_comments;
              totalImpactScore += analysis.impact_score;
              totalConversionPotential += analysis.conversion_potential;
              totalResistanceLevel += analysis.resistance_level;
            }
          }
          
          // Update progress
          const progressPercent = 60 + (i / Math.min(filteredPosts.length, maxPosts)) * 35;
          setProgress(Math.round(progressPercent));
          
        } catch (err) {
          console.error('Error analyzing post:', err);
        }
      }
      
      setProgress(95);
      
      // Calculate averages
      const postsAnalyzed = analyzedPosts.length;
      const avgImpactScore = postsAnalyzed > 0 ? Math.round(totalImpactScore / postsAnalyzed) : 0;
      const avgConversionPotential = postsAnalyzed > 0 ? Math.round(totalConversionPotential / postsAnalyzed) : 0;
      const avgResistanceLevel = postsAnalyzed > 0 ? Math.round(totalResistanceLevel / postsAnalyzed) : 0;
      
      // Get top performing posts
      const topPosts = analyzedPosts
        .sort((a, b) => b.analysis.impact_score - a.analysis.impact_score)
        .slice(0, 3)
        .map(post => ({
          caption: post.caption || 'No caption',
          impact_score: post.analysis.impact_score,
          comments_count: post.comments_count || 0,
          conversion_potential: post.analysis.conversion_potential
        }));
      
      const accountData = {
        total_posts_analyzed: postsAnalyzed,
        total_comments_analyzed: totalComments,
        date_range: `Last ${dateRange} months`,
        filter_settings: {
          min_comments: minComments,
          sort_by: sortBy,
          max_posts: maxPosts
        },
        overall_metrics: {
          avg_impact_score: avgImpactScore,
          avg_conversion_potential: avgConversionPotential,
          avg_resistance_level: avgResistanceLevel,
          total_engagement: analyzedPosts.reduce((sum, post) => sum + (post.like_count || 0) + (post.comments_count || 0), 0)
        },
        category_distribution: categoryTotals,
        top_performing_posts: topPosts
      };
      
      setAccountAnalysis(accountData);
      setAnalyzing(false);
      setProgress(100);
      
    } catch (err) {
      setError('Analysis failed: ' + err.message);
      setAnalyzing(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    setUser(null);
    setPosts([]);
    setAccountAnalysis(null);
    setError('');
    setPostUrl('');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🌱 Instagram Sentiment Analysis</h1>
          <p>AI-Powered Vegan Advocacy Analytics</p>
          {user && (
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          )}
        </div>
      </header>

      <main className="main">
        {!user ? (
          <div className="login-container">
            <div className="login-card">
              <h2>🌱 Vegan Advocacy Impact Analysis</h2>
              <p>Measure how effectively your content influences attitudes toward animal agriculture</p>
              <button 
                onClick={loginWithFacebook} 
                disabled={loading}
                className="login-btn"
              >
                📘 {loading ? 'Connecting...' : 'Login with Facebook'}
              </button>
              <div className="login-note">
                <strong>Note:</strong> You need an Instagram Business or Creator account connected to a Facebook page to use this tool.
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome! 👋</h2>
              <p>Connected to Instagram via Facebook</p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="post-analysis-section">
              <h3>📱 Individual Post Analysis</h3>
              
              {availableAccounts.length > 1 && (
                <div className="account-selector">
                  <label>Select Instagram Account:</label>
                  <select 
                    value={selectedAccountId} 
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="account-select"
                  >
                    <option value="">Choose an account...</option>
                    {availableAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        @{account.username} ({account.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {availableAccounts.length === 1 && (
                <div className="selected-account">
                  <span>📸 Using: @{availableAccounts[0].username}</span>
                </div>
              )}
              
              <div className="post-input-section">
                <input
                  type="text"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="Paste Instagram post URL (e.g., https://www.instagram.com/p/POST_ID/)"
                  className="post-url-input"
                />
                <button 
                  onClick={loadInstagramPostFromUrl}
                  disabled={loading || analyzing || !selectedAccountId}
                  className="load-post-btn"
                >
                  {analyzing ? `Analyzing... ${progress}%` : loading ? 'Loading...' : 'Analyze Post'}
                </button>
              </div>              
              {analyzing && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p>{currentOperation} {progress}%</p>
                </div>
              )}
              
              {debugLogs.length > 0 && (
                <div className="debug-section">
                  <h4>🔍 Debug Logs</h4>
                  <div className="debug-logs">
                    {debugLogs.slice(-10).map((log, index) => (
                      <div key={index} className={`debug-log ${log.includes('ERROR') ? 'error' : log.includes('WARN') ? 'warn' : 'info'}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="settings-section">
              <h3>🎯 Analysis Settings</h3>
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Minimum Comments</label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={minComments}
                    onChange={(e) => setMinComments(parseInt(e.target.value))}
                  />
                  <span>{minComments}+ comments</span>
                </div>

                <div className="setting-item">
                  <label>Date Range</label>
                  <select value={dateRange} onChange={(e) => setDateRange(parseInt(e.target.value))}>
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                    <option value={24}>Last 24 months</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="comments">Most Comments</option>
                    <option value="likes">Most Likes</option>
                    <option value="recent">Most Recent</option>
                    <option value="engagement">Best Engagement</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Max Posts</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={maxPosts}
                    onChange={(e) => setMaxPosts(parseInt(e.target.value))}
                  />
                  <span>{maxPosts} posts</span>
                </div>
              </div>

              <button 
                onClick={runAccountWideAnalysis}
                disabled={analyzing}
                className="account-analysis-btn"
              >
                🚀 {analyzing ? `Analyzing... ${progress}%` : 'Run Account-Wide Analysis'}
              </button>
            </div>

            {posts.length > 0 && (
              <div className="results-section">
                <h3>📊 Individual Post Results</h3>
                {posts.map((post, index) => {
                  const analysis = analyzePost(post);
                  if (!analysis) return null;

                  return (
                    <div key={index} className="post-analysis">
                      <div className="post-header">
                        <h4>{post.caption.substring(0, 100)}...</h4>
                        <div className="post-stats">
                          ❤️ {post.like_count} 💬 {post.comments_count}
                        </div>
                      </div>

                      <div className="analysis-metrics">
                        <div className="metric-card">
                          <h4>Impact Score: {analysis.impact_score}%</h4>
                          <p>Conversion: {analysis.conversion_potential}%</p>
                          <p>Resistance: {analysis.resistance_level}%</p>
                          <p>Emotional Intensity: {analysis.emotional_intensity}%</p>
                        </div>
                      </div>

                      <div className="deep-analysis-section">
                        <h4>🧠 AI Deep Analysis</h4>
                        <div className="analysis-text">
                          {analysis.deep_analysis}
                        </div>
                      </div>

                      <div className="themes-section">
                        <h4>🎯 Key Themes</h4>
                        <div className="themes-grid">
                          {analysis.key_themes.map((theme, i) => (
                            <div key={i} className="theme-item">
                              <span className="theme-name">{theme.theme}</span>
                              <span className="theme-count">{theme.count} ({theme.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="audience-segments">
                        <h4>👥 Audience Segments</h4>
                        <div className="segments-grid">
                          <div className="segment">Advocates: {analysis.audience_segments.advocates}</div>
                          <div className="segment">Curious: {analysis.audience_segments.curious}</div>
                          <div className="segment">Resistant: {analysis.audience_segments.resistant}</div>
                          <div className="segment">Opponents: {analysis.audience_segments.opponents}</div>
                          <div className="segment">Already Converted: {analysis.audience_segments.already_converted}</div>
                        </div>
                      </div>

                      <div className="response-categories">
                        <h4>Response Categories:</h4>
                        <div className="categories-grid">
                          <div className="category anti-animal-ag">anti animal-ag: {analysis.categories['anti-animal-ag']}</div>
                          <div className="category questioning">questioning: {analysis.categories['questioning']}</div>
                          <div className="category defensive">defensive: {analysis.categories['defensive']}</div>
                          <div className="category pro-animal-ag">pro animal-ag: {analysis.categories['pro-animal-ag']}</div>
                          <div className="category already-vegan">already vegan: {analysis.categories['already-vegan']}</div>
                        </div>
                      </div>

                      <div className="comment-analysis">
                        <h4>Comment Analysis:</h4>
                        <div className="comments-list">
                          {analysis.detailed_comments.slice(0, 10).map((comment, i) => (
                            <div key={i} className="comment-item">
                              <div className="comment-text">"{comment.text}"</div>
                              <div className="comment-meta">
                                <span className={`category ${comment.category}`}>{comment.category}</span>
                                <span className="impact">Impact: {comment.impact}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {accountAnalysis && (
              <div className="account-results-section">
                <h3>📊 Account Analysis Results</h3>
                <div className="account-metrics">
                  <div className="metric-card">
                    <h4>{accountAnalysis.total_posts_analyzed}</h4>
                    <p>Posts Analyzed</p>
                  </div>
                  <div className="metric-card">
                    <h4>{accountAnalysis.overall_metrics.avg_impact_score}%</h4>
                    <p>Avg Impact Score</p>
                  </div>
                  <div className="metric-card">
                    <h4>{accountAnalysis.overall_metrics.avg_conversion_potential}%</h4>
                    <p>Conversion Potential</p>
                  </div>
                  <div className="metric-card">
                    <h4>{accountAnalysis.total_comments_analyzed}</h4>
                    <p>Total Comments</p>
                  </div>
                </div>

                <div className="response-distribution">
                  <h4>Response Distribution:</h4>
                  <div className="distribution-grid">
                    <div className="dist-item anti-animal-ag">anti animal-ag: {accountAnalysis.category_distribution['anti-animal-ag']} comments</div>
                    <div className="dist-item questioning">questioning: {accountAnalysis.category_distribution['questioning']} comments</div>
                    <div className="dist-item defensive">defensive: {accountAnalysis.category_distribution['defensive']} comments</div>
                    <div className="dist-item pro-animal-ag">pro animal-ag: {accountAnalysis.category_distribution['pro-animal-ag']} comments</div>
                    <div className="dist-item already-vegan">already vegan: {accountAnalysis.category_distribution['already-vegan']} comments</div>
                  </div>
                </div>

                <div className="top-posts">
                  <h4>Top Performing Posts:</h4>
                  {accountAnalysis.top_performing_posts.map((post, index) => (
                    <div key={index} className="top-post-item">
                      <div className="post-caption">"{post.caption.substring(0, 80)}..."</div>
                      <div className="post-metrics">
                        <span>Impact: {post.impact_score}%</span>
                        <span>Comments: {post.comments_count}</span>
                        <span>Conversion: {post.conversion_potential}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
