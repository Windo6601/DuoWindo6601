import React, { useEffect, useRef } from 'react';

interface IshiharaPlateCanvasProps {
  number: string;
  image?: string;
  className?: string;
  size?: number;
}

export const IshiharaPlateCanvas: React.FC<IshiharaPlateCanvasProps> = ({
  number,
  image,
  className = "w-full h-full object-cover",
  size = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // If we have a valid base64 image from Gemini API (>200 chars), we don't need to render canvas
    if (image && image.length > 200) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = size;
    const height = size;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = size * 0.44;

    // Offscreen canvas for rendering target number text to sample pixel brightness
    const textCanvas = document.createElement('canvas');
    textCanvas.width = width;
    textCanvas.height = height;
    const textCtx = textCanvas.getContext('2d');
    if (textCtx) {
      textCtx.fillStyle = '#000000';
      textCtx.fillRect(0, 0, width, height);
      textCtx.fillStyle = '#FFFFFF';
      textCtx.font = `900 ${Math.floor(size * 0.42)}px "Arial", sans-serif`;
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(number || '12', centerX, centerY + size * 0.02);
    }
    const textData = textCtx?.getImageData(0, 0, width, height).data;

    const isNumberPoint = (x: number, y: number) => {
      if (!textData) return false;
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || px >= width || py < 0 || py >= height) return false;
      const idx = (py * width + px) * 4;
      return textData[idx] > 128;
    };

    // Authentic Ishihara Color Palettes (Red-Green Color Perception Test)
    // Digit dots: Red / Coral / Pink / Orange shades
    const numberPalette = [
      '#E74C3C', '#EC7063', '#C0392B', '#E67E22', 
      '#F39C12', '#D35400', '#FF6B6B', '#FF8E72', '#E55039'
    ];
    // Background dots: Green / Sage / Olive / Brownish-Gray shades
    const bgPalette = [
      '#27AE60', '#2ECC71', '#58D68D', '#82E0AA', 
      '#73C6B6', '#52BE80', '#A2D9CE', '#95A5A6', '#7F8C8D', '#88D49E', '#38ADA9'
    ];

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Dark circular container background
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#1A202C';
    ctx.fill();

    // Generate non-overlapping dots
    interface Dot { x: number; y: number; r: number; color: string }
    const dots: Dot[] = [];
    const maxAttempts = 10000;
    
    for (let i = 0; i < maxAttempts && dots.length < 800; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rDist = Math.sqrt(Math.random()) * (radius - 6);
      const x = centerX + Math.cos(angle) * rDist;
      const y = centerY + Math.sin(angle) * rDist;
      
      const dotR = (Math.random() * 4.5 + 3.5) * (size / 300);

      let overlaps = false;
      for (let j = 0; j < dots.length; j++) {
        const dot = dots[j];
        const dx = x - dot.x;
        const dy = y - dot.y;
        if (dx * dx + dy * dy < (dot.r + dotR + 1.8) * (dot.r + dotR + 1.8)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        const isNum = isNumberPoint(x, y);
        const palette = isNum ? numberPalette : bgPalette;
        const color = palette[Math.floor(Math.random() * palette.length)];
        dots.push({ x, y, r: dotR, color });
      }
    }

    // Render dots
    dots.forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fillStyle = dot.color;
      ctx.fill();
    });

    ctx.restore();
  }, [number, image, size]);

  if (image && image.length > 200) {
    return <img src={`data:image/png;base64,${image}`} className={className} alt={`Ishihara Test Plate ${number}`} />;
  }

  return (
    <canvas 
      ref={canvasRef} 
      className={className} 
      width={size} 
      height={size} 
    />
  );
};
