'use client';

import { ReactNode, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  animation?: 'fade' | 'slide-left' | 'slide-right' | 'scale' | 'bounce';
}

export default function AnimatedCard({
  children,
  delay = 0,
  className = '',
  animation = 'fade',
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const element = cardRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) return;

    const context = gsap.context(() => {
      const entranceByAnimation = {
        fade: { opacity: 0, y: 20 },
        'slide-left': { opacity: 0, x: -40 },
        'slide-right': { opacity: 0, x: 40 },
        scale: { opacity: 0, scale: 0.96 },
        bounce: { opacity: 0, y: 30 },
      } as const;

      gsap.from(element, {
        ...(entranceByAnimation[animation] || entranceByAnimation.fade),
        duration: animation === 'bounce' ? 0.75 : 0.6,
        delay,
        ease: animation === 'bounce' ? 'back.out(1.4)' : 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: element,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    }, element);

    return () => context.revert();
  }, [animation, delay]);

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  );
}
