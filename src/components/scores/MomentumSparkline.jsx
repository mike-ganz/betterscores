import React from 'react';

export default function MomentumSparkline({ plays, homeId }) {
  if (!plays || plays.length === 0) return null;

  // Take last 20 plays to show recent momentum
  const recentPlays = plays.slice(-20);
  const dataPoints = recentPlays.map(play => {
    const awayScore = parseInt(play.awayScore || 0);
    const homeScore = parseInt(play.homeScore || 0);
    return awayScore - homeScore;
  });

  if (dataPoints.length < 2) return null;

  const max = Math.max(...dataPoints.map(Math.abs), 5);
  const height = 40;
  const width = 120;
  
  // High-fidelity smoothed curve
  const points = dataPoints.map((d, i) => {
    const x = i * (width / (dataPoints.length - 1));
    const y = (height / 2) - (d / max * (height / 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-end gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-500 sm:translate-y-1 sm:group-hover:translate-y-0">
      <svg width={width} height={height} className="overflow-visible">
        {/* Baseline */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="currentColor" className="text-white/5" strokeWidth="1" strokeDasharray="2,2" />
        {/* Momentum Line */}
        <polyline
          fill="none"
          stroke="url(#momentumGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <defs>
          <linearGradient id="momentumGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
