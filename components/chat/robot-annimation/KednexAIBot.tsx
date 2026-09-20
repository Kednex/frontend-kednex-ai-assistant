'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function KednexAIBot () {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 560,
        aspectRatio: '1 / 1',
        margin: '0 auto',
      }}
    >
      {/* Ambient glow backdrop */}
      <div style={{
        position: 'absolute', inset: '6%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,80,192,0.14) 0%, transparent 70%)',
        filter: 'blur(28px)',
        pointerEvents: 'none',
      }} />

      {/* annimation*/}
      <DotLottieReact src="/annimations/heroai.json" autoplay loop />
    </div>
  )
}

