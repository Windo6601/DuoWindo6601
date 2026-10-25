import React from 'react';

// A clean SVG reconstruction of the Mascot with variants and proportional original Duolingo crying tears (no face distortion)
export const Mascot: React.FC<{ 
    emotion?: 'neutral' | 'happy' | 'confused' | 'sad' | 'thinking' | 'surprised'; 
    className?: string;
    variant?: 'default' | 'math' | 'music' | 'chess';
}> = ({ emotion = 'neutral', className = "w-48 h-48", variant = 'default' }) => {
  
  return (
    <div className={`relative mx-auto ${className}`}>
       {/* React Atom Static */}
       <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 opacity-80 z-10">
         <svg viewBox="0 0 100 100" className="w-full h-full text-blue-300">
            <circle cx="50" cy="50" r="5" fill="currentColor" />
            <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(0 50 50)" />
            <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(60 50 50)" />
            <ellipse cx="50" cy="50" rx="45" ry="12" fill="none" stroke="currentColor" strokeWidth="4" transform="rotate(120 50 50)" />
         </svg>
       </div>

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
        {/* Wings */}
        <path d="M10 100 Q 5 70 40 80 L 45 130 Z" fill="#003366" /> 
        <path d="M190 100 Q 195 70 160 80 L 155 130 Z" fill="#003366" />
        
        {/* Body */}
        <path d="M50 60 Q 100 20 150 60 L 160 160 Q 100 190 40 160 Z" fill="#0047AB" />
        
        {/* Face Mask Area */}
        <path d="M55 70 Q 75 50 100 80 Q 125 50 145 70 Q 155 100 135 120 Q 100 130 65 120 Q 45 100 55 70" fill="#0056D2" />

        {/* Eyes */}
        <g transform="translate(0, 5)">
            <ellipse cx="75" cy="90" rx="22" ry="25" fill="white" />
            <ellipse cx="125" cy="90" rx="22" ry="25" fill="white" />
            
            {/* Eyelids/Expression */}
            {emotion === 'neutral' && (
                <>
                <circle cx="75" cy="90" r="10" fill="#131F24" />
                <circle cx="125" cy="90" r="10" fill="#131F24" />
                <path d="M53 80 Q 75 80 97 80" stroke="#131F24" strokeWidth="6" fill="none" />
                <path d="M103 80 Q 125 80 147 80" stroke="#131F24" strokeWidth="6" fill="none" />
                </>
            )}
            {emotion === 'happy' && (
                <>
                 <path d="M60 90 Q 75 75 90 90" stroke="#131F24" strokeWidth="4" fill="none" />
                 <path d="M110 90 Q 125 75 140 90" stroke="#131F24" strokeWidth="4" fill="none" />
                </>
            )}
            {emotion === 'confused' && (
                <>
                <circle cx="75" cy="90" r="10" fill="#131F24" />
                <circle cx="125" cy="90" r="10" fill="#131F24" />
                <path d="M53 75 Q 75 90 97 75" stroke="#131F24" strokeWidth="6" fill="none" />
                <path d="M103 85 Q 125 75 147 80" stroke="#131F24" strokeWidth="6" fill="none" />
                </>
            )}
            {emotion === 'sad' && (
                <>
                {/* Proportional Sad Eyes (No facial distortion) */}
                <circle cx="75" cy="90" r="9" fill="#131F24" />
                <circle cx="125" cy="90" r="9" fill="#131F24" />
                <path d="M53 78 Q 75 88 97 78" stroke="#131F24" strokeWidth="5" fill="none" />
                <path d="M103 78 Q 125 88 147 78" stroke="#131F24" strokeWidth="5" fill="none" />
                
                {/* Original Duolingo Crying Tears (Blue Teardrops streaming from eyes) */}
                <path d="M 67 105 Q 73 122 67 132 Q 61 122 67 105 Z" fill="#38bdf8" opacity="0.95" />
                <path d="M 123 105 Q 129 122 123 132 Q 117 122 123 105 Z" fill="#38bdf8" opacity="0.95" />
                <circle cx="67" cy="137" r="3" fill="#38bdf8" opacity="0.9" />
                <circle cx="123" cy="137" r="3" fill="#38bdf8" opacity="0.9" />
                </>
            )}
            {emotion === 'thinking' && (
                <>
                <circle cx="75" cy="85" r="9" fill="#131F24" />
                <circle cx="125" cy="90" r="9" fill="#131F24" />
                <path d="M53 75 Q 75 80 97 75" stroke="#131F24" strokeWidth="5" fill="none" />
                <path d="M103 80 Q 125 80 147 80" stroke="#131F24" strokeWidth="5" fill="none" />
                </>
            )}
            {emotion === 'surprised' && (
                <>
                <circle cx="75" cy="90" r="12" fill="#131F24" />
                <circle cx="125" cy="90" r="12" fill="#131F24" />
                <path d="M53 72 Q 75 68 97 72" stroke="#131F24" strokeWidth="5" fill="none" />
                <path d="M103 72 Q 125 68 147 72" stroke="#131F24" strokeWidth="5" fill="none" />
                </>
            )}
        </g>

        {/* Beak / Sad Mouth */}
        {emotion === 'sad' ? (
            <path d="M85 125 Q 100 115 115 125 Q 100 135 85 125" fill="#FF8C00" />
        ) : (
            <path d="M90 115 Q 100 135 110 115 Q 100 110 90 115" fill="#FF8C00" />
        )}
        
        {/* Accessories based on Variant */}
        {variant === 'math' && (
            <g>
                <circle cx="75" cy="90" r="25" stroke="#333" strokeWidth="3" fill="none" opacity="0.6"/>
                <circle cx="125" cy="90" r="25" stroke="#333" strokeWidth="3" fill="none" opacity="0.6"/>
                <line x1="100" y1="90" x2="100" y2="85" stroke="#333" strokeWidth="3"/>
                <rect x="10" y="80" width="20" height="60" fill="#FFD700" transform="rotate(-15 20 110)" />
            </g>
        )}

        {variant === 'music' && (
             <g>
                <path d="M50 90 Q 50 30 100 30 Q 150 30 150 90" stroke="#333" strokeWidth="8" fill="none" />
                <rect x="35" y="80" width="20" height="40" rx="5" fill="#FF4081" />
                <rect x="145" y="80" width="20" height="40" rx="5" fill="#FF4081" />
                <text x="140" y="160" fontSize="30" fill="white">♪</text>
            </g>
        )}

        {variant === 'chess' && (
             <g>
                <path d="M70 50 L 70 30 L 85 40 L 100 25 L 115 40 L 130 30 L 130 50 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
                <path d="M20 170 L 180 170 L 195 190 L 5 190 Z" fill="#f0d9b5" stroke="#b58863" strokeWidth="2" />
            </g>
        )}

        {/* Book */}
        {variant === 'default' && (
            <>
                <path d="M60 140 L 100 155 L 140 140 L 140 170 L 100 185 L 60 170 Z" fill="#FFC800" />
                <path d="M100 155 L 100 185" stroke="#D6A600" strokeWidth="2" />
                <rect x="85" y="160" width="30" height="15" rx="2" fill="#8B4513" opacity="0.4" />
            </>
        )}

        {/* Feet */}
        <ellipse cx="80" cy="185" rx="15" ry="8" fill="#FF8C00" />
        <ellipse cx="120" cy="185" rx="15" ry="8" fill="#FF8C00" />
      </svg>
    </div>
  );
};