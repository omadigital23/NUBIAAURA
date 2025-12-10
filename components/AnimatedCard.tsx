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

    switch (animation) {
      case 'fade':
        gsap.fromTo(
          element,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay,
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 0.3,
            },
          }
        );
        break;

      case 'slide-left':
        gsap.fromTo(
          element,
          { opacity: 0, x: -40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            delay,
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 0.4,
            },
          }
        );
        break;

      case 'slide-right':
        gsap.fromTo(
          element,
          { opacity: 0, x: 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            delay,
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 0.4,
            },
          }
        );
        break;

      case 'scale':
        gsap.fromTo(
          element,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay,
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 0.4,
            },
          }
        );
        break;

      case 'bounce':
        gsap.fromTo(
          element,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay,
            ease: 'back.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 0.3,
            },
          }
        );
        break;

      default:
        break;
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
    };
  }, [animation, delay]);

  return (
    <div ref={cardRef} className={className}>
      {children}
    </div>
  );
}
