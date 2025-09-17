# Instagram Sentiment Analysis Platform

An advanced AI-powered sentiment analysis platform for Instagram business accounts that provides comprehensive insights into post performance, audience engagement, and brand health monitoring.

## 🚀 Live Demo

**[Try the Live Application](https://instagram-sentiment-app.vercel.app)**

## ✨ Features

### 🎯 Executive Dashboard
- **Brand Health Score** - Comprehensive 0-100 metric for overall brand performance
- **Net Sentiment Score** - Industry-standard KPI for sentiment tracking
- **Crisis Risk Detection** - Early warning system for negative sentiment spikes
- **Real-time Analytics** - Live monitoring of engagement and sentiment trends

### 📊 Advanced Analytics
- **Post Sentiment Analysis** - AI-powered emotion detection with confidence scores
- **Comment Analysis** - Deep sentiment analysis of individual comments
- **Engagement Correlation** - ROI analysis linking sentiment to engagement
- **Historical Trends** - Pattern recognition over time periods

### 🔍 Single Post Analysis
- **URL-based Analysis** - Analyze any Instagram post by URL
- **Complete Comment Breakdown** - Sentiment analysis of all comments
- **Viral Potential Assessment** - Predictive engagement metrics
- **Crisis Risk Evaluation** - Individual post risk assessment

### 🧠 Business Intelligence
- **Content Performance Insights** - What content drives positive vs negative sentiment
- **Audience Behavior Analysis** - Engagement patterns and preferences
- **Competitive Positioning** - Market position analysis
- **Strategic Recommendations** - AI-powered actionable insights

## 🛠 Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Facebook Login SDK
- **API Integration**: Instagram Graph API
- **Deployment**: Vercel
- **AI/ML**: Custom sentiment analysis algorithm

## 📋 Prerequisites

- Facebook Developer Account
- Instagram Business Account
- Node.js 18+ and npm

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/robbieopenpaws/instagram-sentiment-analysis.git
cd instagram-sentiment-analysis
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Facebook App Setup
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Basic Display and Instagram Graph API products
3. Configure OAuth redirect URIs
4. Request permissions: `instagram_business_basic`, `pages_read_engagement`, `pages_show_list`

### 4. Update Configuration
Update the Facebook App ID in `src/App.jsx`:
```javascript
window.FB.init({
  appId: 'YOUR_FACEBOOK_APP_ID', // Replace with your App ID
  cookie: true,
  xfbml: true,
  version: 'v18.0'
})
```

### 5. Run Development Server
```bash
npm run dev
```

### 6. Build for Production
```bash
npm run build
```

## 🔧 Configuration

### Facebook App Permissions
The app requires these permissions for full functionality:
- `instagram_business_basic` - Access to Instagram business account data
- `pages_read_engagement` - Read post engagement metrics
- `pages_show_list` - List connected Facebook pages

### Environment Setup
No environment variables required - the app uses client-side Facebook SDK integration.

## 📊 Sentiment Analysis Algorithm

The platform uses an advanced multi-layered sentiment analysis algorithm that:

- **Detects 5 core emotions**: Joy, Anger, Sadness, Fear, Surprise
- **Analyzes context**: Business language vs emotional content
- **Handles complex topics**: Social issues, activism, industry-specific content
- **Provides confidence scores**: 0-100% accuracy ratings
- **Multi-language support**: Extensible keyword detection

### Algorithm Features
- 200+ emotional keywords across 5 categories
- Context-aware business language detection
- Enhanced scoring for nuanced sentiment analysis
- Real-time processing of posts and comments

## 🎯 Use Cases

### For Marketing Teams
- **Campaign Performance**: Track sentiment impact of marketing campaigns
- **Content Optimization**: Identify what content resonates with audience
- **Crisis Management**: Early detection of negative sentiment trends
- **ROI Analysis**: Correlate sentiment with engagement and business metrics

### For Brand Managers
- **Brand Health Monitoring**: Real-time brand perception tracking
- **Competitive Analysis**: Compare sentiment against industry benchmarks
- **Reputation Management**: Proactive response to sentiment changes
- **Strategic Planning**: Data-driven content strategy development

### For Social Media Managers
- **Content Planning**: Optimize posting strategy based on sentiment data
- **Community Management**: Prioritize response to negative sentiment
- **Performance Reporting**: Comprehensive analytics for stakeholders
- **Trend Analysis**: Identify emerging topics and sentiment patterns

## 📈 Business Value

### Key Performance Indicators
- **Brand Health Score**: Comprehensive business metric (0-100)
- **Net Sentiment Score**: Industry-standard sentiment KPI
- **Engagement Rate**: Correlation between sentiment and engagement
- **Crisis Risk Level**: Early warning system for reputation management

### ROI Benefits
- **Reduced Crisis Response Time**: Early detection saves reputation costs
- **Improved Content Performance**: Data-driven content optimization
- **Enhanced Customer Satisfaction**: Proactive response to negative sentiment
- **Competitive Advantage**: Advanced analytics beyond basic social media tools

## 🔒 Privacy & Security

- **No Data Storage**: All analysis performed client-side
- **Facebook OAuth**: Secure authentication through Facebook
- **API Rate Limiting**: Respects Instagram API limits
- **Privacy Compliant**: No personal data collection or storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- Facebook/Meta for Instagram Graph API
- React and Vite communities
- Tailwind CSS for styling framework
- Vercel for deployment platform

---

**Built with ❤️ for better social media analytics**
# Fixed Vercel framework configuration - now using Vite instead of Next.js
# Fresh deployment test with reconnected Git repository
