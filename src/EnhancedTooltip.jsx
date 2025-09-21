import React, { useState, useRef, useEffect } from 'react';

// Enhanced Tooltip Component with better positioning and mobile support
const EnhancedTooltip = ({ 
  text, 
  children, 
  position = 'top', 
  delay = 300,
  maxWidth = '300px',
  className = '',
  showOnMobile = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculatePosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip fits in the preferred position
    switch (position) {
      case 'top':
        if (triggerRect.top - tooltipRect.height < 10) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (triggerRect.left - tooltipRect.width < 10) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
          newPosition = 'left';
        }
        break;
    }

    setActualPosition(newPosition);
  };

  const showTooltip = () => {
    if (!showOnMobile && isMobile) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after tooltip becomes visible
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleClick = () => {
    if (isMobile) {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipStyle = () => {
    const baseStyle = {
      maxWidth,
      zIndex: 1000,
    };

    if (isMobile) {
      // On mobile, center the tooltip
      return {
        ...baseStyle,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
      };
    }

    return baseStyle;
  };

  const getTooltipClasses = () => {
    const baseClasses = `enhanced-tooltip ${actualPosition} ${className}`;
    const mobileClasses = isMobile ? 'mobile' : '';
    const visibleClasses = isVisible ? 'visible' : '';
    
    return `${baseClasses} ${mobileClasses} ${visibleClasses}`.trim();
  };

  return (
    <div className="tooltip-container">
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={handleClick}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        tabIndex={0}
      >
        {children}
      </div>
      
      {isVisible && (
        <>
          {isMobile && <div className="tooltip-overlay" onClick={hideTooltip} />}
          <div
            ref={tooltipRef}
            className={getTooltipClasses()}
            style={getTooltipStyle()}
            role="tooltip"
            aria-hidden={!isVisible}
          >
            <div className="tooltip-content">
              {text}
            </div>
            {!isMobile && <div className="tooltip-arrow" />}
            {isMobile && (
              <button 
                className="tooltip-close"
                onClick={hideTooltip}
                aria-label="Close tooltip"
              >
                ×
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Simple Tooltip component for backward compatibility
const Tooltip = ({ text, children, ...props }) => {
  return (
    <EnhancedTooltip text={text} {...props}>
      {children}
    </EnhancedTooltip>
  );
};

export { EnhancedTooltip, Tooltip };
export default Tooltip;
