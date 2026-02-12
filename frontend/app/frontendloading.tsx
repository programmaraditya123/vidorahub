import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500">
      {/* Container with a smooth fade-in animation */}
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
        
        <svg 
          width="400" 
          height="120" 
          viewBox="0 0 400 120" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* VidoraHub Text with Laser-Draw Effect */}
          <text 
            x="50%" 
            y="50%" 
            textAnchor="middle" 
            fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            fontWeight="900" 
            fontSize="52" 
            fill="transparent" 
            stroke="#00c6ff" 
            strokeWidth="1.5" 
            strokeDasharray="450" 
            strokeDashoffset="450"
            filter="url(#glow)"
          >
            VidoraHub
            <animate 
              attributeName="stroke-dashoffset" 
              values="450;0;450" 
              dur="3s" 
              repeatCount="indefinite" 
              calcMode="spline"
              keySplines="0.42, 0, 0.58, 1; 0.42, 0, 0.58, 1"
            />
            <animate 
              attributeName="stroke" 
              values="#00c6ff;#0072ff;#00c6ff" 
              dur="3s" 
              repeatCount="indefinite" 
            />
          </text>

          {/* Bottom Progress Bar Track */}
          <line 
            x1="130" y1="85" x2="270" y2="85" 
            stroke="currentColor" 
            className="text-slate-200 dark:text-slate-800" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
          
          {/* Animated Progress Indicator */}
          <line 
            x1="130" y1="85" x2="270" y2="85" 
            stroke="#0072ff" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeDasharray="30 110"
          >
            <animate 
              attributeName="stroke-dashoffset" 
              from="140" to="0" 
              dur="1.2s" 
              repeatCount="indefinite" 
            />
          </line>
        </svg>

        {/* Dynamic Status Text */}
        <p className="mt-4 text-sm font-medium tracking-widest text-slate-500 uppercase animate-pulse">
          Synchronizing Hub...
        </p>
      </div>
    </div>
  );
}
