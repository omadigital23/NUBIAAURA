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

    switch (animation) {
      case 'fade':
        gsap.fromTo(
          element,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              end: 'top 20%',
              scrub: 0.5,
            },
          }
        );
        break;

      case 'slide-left':
        gsap.fromTo(
          element,
          { opacity: 0, x: -60 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              end: 'top 20%',
              scrub: 0.6,
            },
          }
        );
        break;

      case 'slide-right':
        gsap.fromTo(
          element,
          { opacity: 0, x: 60 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              end: 'top 20%',
              scrub: 0.6,
            },
          }
        );
        break;

      case 'scale':
        gsap.fromTo(
          element,
          { opacity: 0, scale: 0.85 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.9,
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              end: 'top 20%',
              scrub: 0.6,
            },
          }
        );
        break;

      case 'parallax':
        gsap.to(element, {
          y: -60,
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
        break;

      default:
        break;
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
    };
  }, [animation]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
}
