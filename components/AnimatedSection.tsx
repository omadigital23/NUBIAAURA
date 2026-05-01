'use client';

import { ReactNode, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: 'fade' | 'slide-left' | 'slide-right' | 'scale' | 'parallax';
  className?: string;
}

export default function AnimatedSection({
  children,
  animation = 'fade',
  className = '',
}: AnimatedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const element = sectionRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) return;

    const context = gsap.context(() => {
      const entranceByAnimation = {
        fade: { opacity: 0, y: 30 },
        'slide-left': { opacity: 0, x: -60 },
        'slide-right': { opacity: 0, x: 60 },
        scale: { opacity: 0, scale: 0.96 },
      } as const;

      if (animation === 'parallax') {
        gsap.to(element, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
        return;
      }

      gsap.from(element, {
        ...(entranceByAnimation[animation] || entranceByAnimation.fade),
        duration: 0.7,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: {
          trigger: element,
          start: 'top 86%',
          toggleActions: 'play none none none',
        },
      });
    }, element);

    return () => context.revert();
  }, [animation]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
}
