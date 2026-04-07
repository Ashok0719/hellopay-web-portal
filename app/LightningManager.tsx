'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LightningManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bolts, setBolts] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleClick = (e: MouseEvent) => {
      createLightning(e.clientX, e.clientY);
    };
    window.addEventListener('mousedown', handleClick);

    function createLightning(targetX: number, targetY: number) {
      if (!ctx || !canvas) return;
      
      const startX = targetX + (Math.random() - 0.5) * 200;
      const startY = 0;
      
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f2ff';
      
      let curX = startX;
      let curY = startY;
      
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      
      while (curY < targetY) {
        curX += (Math.random() - 0.5) * 50;
        curY += Math.random() * 50;
        ctx.lineTo(curX, curY);
      }
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      
      // Flash effect
      const flash = document.createElement('div');
      flash.style.position = 'fixed';
      flash.style.top = '0';
      flash.style.left = '0';
      flash.style.width = '100vw';
      flash.style.height = '100vh';
      flash.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      flash.style.pointerEvents = 'none';
      flash.style.zIndex = '9999';
      flash.style.transition = 'opacity 0.2s ease-out';
      document.body.appendChild(flash);
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => document.body.removeChild(flash), 200);
      }, 50);

      // Fade out canvas
      setTimeout(() => {
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 150);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[10000]"
      style={{ filter: 'drop-shadow(0 0 10px #00f2ff)' }}
    />
  );
}
