import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered reveal animations.
 * @param {Object} options
 * @param {string} options.animation - 'fade-up' | 'fade-down' | 'slide-right' | 'slide-left' | 'zoom' | 'title'
 * @param {number} options.delay - delay in ms before applying visible class
 * @param {number} options.threshold - intersection threshold (0-1)
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export function useScrollReveal({ animation = 'fade-up', delay = 0, threshold = 0.12 } = {}) {
  const [element, setElement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, delay, threshold]);

  const animClass = `scroll-hidden scroll-${animation}`;
  const className = isVisible ? `${animClass} scroll-visible` : animClass;

  return { ref: setElement, isVisible, className };
}

/**
 * Custom hook for counter animation.
 */
export function useCountUp(target, duration = 2000, threshold = 0.5) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(target * eased));
            if (p < 1) {
              requestAnimationFrame(tick);
            } else {
              setCount(target);
            }
          }

          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, threshold]);

  return { ref, count };
}
