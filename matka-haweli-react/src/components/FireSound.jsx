import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Ambient fire crackling sound generator using Web Audio API.
 * Uses filtered noise + random crackle pops to simulate a realistic fire.
 */
export default function FireSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioCtxRef = useRef(null);
  const nodesRef = useRef({});

  const createFireSound = useCallback(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.12;
    masterGain.connect(ctx.destination);

    // === Layer 1: Low rumble (brownian noise) ===
    const bufferSize = 2 * ctx.sampleRate;
    const rumbleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const rumbleData = rumbleBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      rumbleData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = rumbleData[i];
      rumbleData[i] *= 3.5;
    }
    const rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;
    rumbleSource.loop = true;

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 120;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.6;

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    rumbleSource.start();

    // === Layer 2: Mid crackle (filtered white noise) ===
    const crackleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      crackleData[i] = Math.random() * 2 - 1;
      // Random amplitude modulation for crackle effect
      if (Math.random() > 0.97) {
        crackleData[i] *= 3;
      }
    }
    const crackleSource = ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.value = 800;
    crackleFilter.Q.value = 0.5;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.15;

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(masterGain);
    crackleSource.start();

    // === Layer 3: High hiss ===
    const hissBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const hissData = hissBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      hissData[i] = Math.random() * 2 - 1;
    }
    const hissSource = ctx.createBufferSource();
    hissSource.buffer = hissBuffer;
    hissSource.loop = true;

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 3000;

    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.03;

    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(masterGain);
    hissSource.start();

    // === Layer 4: Random pops (crackle scheduler) ===
    let popInterval;
    function schedulePop() {
      const osc = ctx.createOscillator();
      const popGain = ctx.createGain();
      const popFilter = ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.value = 100 + Math.random() * 400;
      popFilter.type = 'bandpass';
      popFilter.frequency.value = 600 + Math.random() * 1200;
      popFilter.Q.value = 5;

      popGain.gain.setValueAtTime(0.08 + Math.random() * 0.12, ctx.currentTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05 + Math.random() * 0.05);

      osc.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }

    popInterval = setInterval(() => {
      if (Math.random() > 0.4) schedulePop();
    }, 150 + Math.random() * 300);

    nodesRef.current = {
      masterGain,
      rumbleSource,
      crackleSource,
      hissSource,
      popInterval,
    };
  }, []);

  const toggleSound = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      createFireSound();
      setIsPlaying(true);
      return;
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlaying) {
      ctx.suspend();
      setIsPlaying(false);
    } else {
      ctx.resume();
      setIsPlaying(true);
    }
  }, [hasInteracted, isPlaying, createFireSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nodesRef.current.popInterval) {
        clearInterval(nodesRef.current.popInterval);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <button
      className="fire-sound-btn"
      onClick={toggleSound}
      aria-label={isPlaying ? 'Mute fire sound' : 'Play fire sound'}
      title={isPlaying ? 'Mute fire ambience' : 'Play fire ambience'}
    >
      <span className="sound-icon">
        {isPlaying ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </span>
      <span className="sound-label">{isPlaying ? '🔥 Fire On' : '🔇 Sound Off'}</span>
    </button>
  );
}
