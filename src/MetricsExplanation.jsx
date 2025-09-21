import React, { useState } from 'react';

// Comprehensive Metrics Explanation Component
const MetricsExplanation = () => {
  const [activeTab, setActiveTab] = useState('impact');

  const tabs = [
    { id: 'impact', label: 'Impact Score', icon: '🎯' },
    { id: 'conversion', label: 'Conversion', icon: '📈' },
    { id: 'resistance', label: 'Resistance', icon: '🛡️' },
    { id: 'categories', label: 'Categories', icon: '📊' }
  ];

  const explanations = {
    impact: {
      title: 'Impact Score (0-100)',
      description: 'Overall effectiveness of your content at influencing people toward veganism',
      details: [
        {
          range: '80-100',
          label: 'Highly Effective',
          color: '#4ade80',
          description: 'Your content is successfully converting people and generating strong anti-animal agriculture sentiment'
        },
        {
          range: '60-79',
          label: 'Moderately Effective',
          color: '#fbbf24',
          description: 'Good impact with significant questioning and some conversion, manageable resistance'
        },
        {
          range: '40-59',
          label: 'Mixed Results',
          color: '#f59e0b',
          description: 'Some positive impact but also notable resistance. Consider refining your approach'
        },
        {
          range: '20-39',
          label: 'Low Effectiveness',
          color: '#ef4444',
          description: 'Limited positive impact, high resistance. May need different messaging strategy'
        },
        {
          range: '0-19',
          label: 'Ineffective',
          color: '#dc2626',
          description: 'Content is not resonating or is triggering strong defensive responses'
        }
      ],
      calculation: 'Based on weighted conversion potential minus resistance level, adjusted for behavioral indicators'
    },
    conversion: {
      title: 'Conversion Potential (%)',
      description: 'Percentage of people showing openness to changing their relationship with animal products',
      details: [
        {
          component: 'Anti-Animal Agriculture',
          weight: '3x',
          description: 'People horrified by industry practices, expressing intent to go vegan'
        },
        {
          component: 'Questioning & Conflicted',
          weight: '2x',
          description: 'People expressing doubt or considering changes to their diet'
        }
      ],
      calculation: 'Conversion Potential = (Anti-Animal Ag × 3 + Questioning × 2) ÷ Total Comments × 100',
      benchmarks: [
        { range: '40%+', label: 'Excellent', description: 'Very high conversion potential' },
        { range: '25-39%', label: 'Good', description: 'Strong advocacy impact' },
        { range: '15-24%', label: 'Moderate', description: 'Some people are being influenced' },
        { range: '5-14%', label: 'Low', description: 'Limited conversion happening' },
        { range: '<5%', label: 'Very Low', description: 'Content may need adjustment' }
      ]
    },
    resistance: {
      title: 'Resistance Level (%)',
      description: 'Percentage of people showing defensive or opposing responses to your advocacy',
      details: [
        {
          type: 'Defensive Responses',
          indicators: ['Cognitive dissonance', 'Making excuses', 'Deflecting with "but" statements'],
          examples: ['"But we need protein"', '"Lions eat meat"', '"Plants feel pain too"']
        },
        {
          type: 'Pro-Animal Agriculture',
          indicators: ['Actively defending industry', 'Promoting animal products', 'Attacking veganism'],
          examples: ['"Support local farmers"', '"Humane meat"', '"Vegan propaganda"']
        }
      ],
      calculation: 'Resistance Level = (Defensive + Pro-Animal Ag) ÷ Total Comments × 100',
      interpretation: [
        { range: '<20%', label: 'Low Resistance', description: 'Your message is well-received' },
        { range: '20-39%', label: 'Moderate Resistance', description: 'Some pushback but manageable' },
        { range: '40-59%', label: 'High Resistance', description: 'Significant defensive responses' },
        { range: '60%+', label: 'Very High Resistance', description: 'Consider gentler messaging approach' }
      ]
    },
    categories: {
      title: 'Response Categories',
      description: 'How we classify different types of responses to your advocacy content',
      categories: [
        {
          name: 'Anti-Animal Agriculture',
          icon: '🚫',
          color: '#ef4444',
          keywords: ['horrific', 'disgusting', 'cruel', 'going vegan', 'never again', 'eye opening'],
          phrases: ['never eating meat again', 'this is horrible', 'going vegan', 'stop supporting this'],
          impact: 'Highly Effective - Direct conversion happening'
        },
        {
          name: 'Questioning & Conflicted',
          icon: '🤔',
          color: '#3b82f6',
          keywords: ['maybe', 'considering', 'thinking about', 'conflicted', 'reduce', 'alternatives'],
          phrases: ['makes me think', 'considering veganism', 'trying to reduce', 'looking for alternatives'],
          impact: 'Moderately Effective - Seeds planted for future conversion'
        },
        {
          name: 'Defensive & Resistant',
          icon: '🛡️',
          color: '#f59e0b',
          keywords: ['but', 'however', 'propaganda', 'extreme', 'lions', 'canine teeth', 'ancestors'],
          phrases: ['but we need', 'lions eat meat', 'plants feel pain too', 'pushing agenda'],
          impact: 'Triggering Resistance - May need gentler approach'
        },
        {
          name: 'Pro-Animal Agriculture',
          icon: '🥩',
          color: '#6b7280',
          keywords: ['farmers', 'tradition', 'natural', 'protein', 'humane', 'local farm'],
          phrases: ['support farmers', 'ethical farming', 'personal choice', 'everything in moderation'],
          impact: 'Ineffective - Content not resonating'
        },
        {
          name: 'Already Vegan',
          icon: '🌱',
          color: '#10b981',
          keywords: ['vegan', 'plant based', 'exactly', 'thank you', 'keep sharing', 'spread the word'],
          phrases: ['been vegan for', 'thank you for sharing', 'keep spreading', 'important work'],
          impact: 'Preaching to Choir - Supportive but already converted'
        }
      ]
    }
  };

  const activeExplanation = explanations[activeTab];

  return (
    <div className="metrics-explanation">
      <div className="explanation-header">
        <h3>📚 Understanding Your Advocacy Metrics</h3>
        <p>Learn how we measure the effectiveness of your vegan advocacy content</p>
      </div>

      <div className="explanation-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="explanation-content">
        <div className="content-header">
          <h4>{activeExplanation.title}</h4>
          <p>{activeExplanation.description}</p>
        </div>

        {activeTab === 'impact' && (
          <div className="impact-explanation">
            <div className="score-ranges">
              {activeExplanation.details.map((range, idx) => (
                <div key={idx} className="score-range" style={{ borderLeftColor: range.color }}>
                  <div className="range-header">
                    <span className="range-value">{range.range}</span>
                    <span className="range-label" style={{ color: range.color }}>{range.label}</span>
                  </div>
                  <p className="range-description">{range.description}</p>
                </div>
              ))}
            </div>
            <div className="calculation-info">
              <h5>How It's Calculated:</h5>
              <p>{activeExplanation.calculation}</p>
            </div>
          </div>
        )}

        {activeTab === 'conversion' && (
          <div className="conversion-explanation">
            <div className="components">
              <h5>Components:</h5>
              {activeExplanation.details.map((component, idx) => (
                <div key={idx} className="component">
                  <div className="component-header">
                    <span className="component-name">{component.component}</span>
                    <span className="component-weight">Weight: {component.weight}</span>
                  </div>
                  <p>{component.description}</p>
                </div>
              ))}
            </div>
            <div className="calculation-formula">
              <h5>Formula:</h5>
              <code>{activeExplanation.calculation}</code>
            </div>
            <div className="benchmarks">
              <h5>Benchmarks:</h5>
              {activeExplanation.benchmarks.map((benchmark, idx) => (
                <div key={idx} className="benchmark">
                  <span className="benchmark-range">{benchmark.range}</span>
                  <span className="benchmark-label">{benchmark.label}</span>
                  <span className="benchmark-desc">{benchmark.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resistance' && (
          <div className="resistance-explanation">
            <div className="resistance-types">
              {activeExplanation.details.map((type, idx) => (
                <div key={idx} className="resistance-type">
                  <h5>{type.type}</h5>
                  <div className="indicators">
                    <strong>Indicators:</strong>
                    <ul>
                      {type.indicators.map((indicator, i) => (
                        <li key={i}>{indicator}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="examples">
                    <strong>Common Examples:</strong>
                    <div className="example-phrases">
                      {type.examples.map((example, i) => (
                        <span key={i} className="example-phrase">"{example}"</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="calculation-formula">
              <h5>Formula:</h5>
              <code>{activeExplanation.calculation}</code>
            </div>
            <div className="interpretation">
              <h5>Interpretation:</h5>
              {activeExplanation.interpretation.map((interp, idx) => (
                <div key={idx} className="interpretation-item">
                  <span className="interp-range">{interp.range}</span>
                  <span className="interp-label">{interp.label}</span>
                  <span className="interp-desc">{interp.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="categories-explanation">
            <div className="categories-grid">
              {activeExplanation.categories.map((category, idx) => (
                <div key={idx} className="category-card" style={{ borderTopColor: category.color }}>
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </div>
                  <div className="category-keywords">
                    <strong>Key Words:</strong>
                    <div className="keyword-list">
                      {category.keywords.slice(0, 6).map((keyword, i) => (
                        <span key={i} className="keyword">{keyword}</span>
                      ))}
                    </div>
                  </div>
                  <div className="category-phrases">
                    <strong>Common Phrases:</strong>
                    <div className="phrase-list">
                      {category.phrases.slice(0, 3).map((phrase, i) => (
                        <span key={i} className="phrase">"{phrase}"</span>
                      ))}
                    </div>
                  </div>
                  <div className="category-impact">
                    <strong>Impact:</strong> {category.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsExplanation;
