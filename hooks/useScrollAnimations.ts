import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export const useScrollAnimations = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Fade in on scroll
    const fadeElements = containerRef.current.querySelectorAll('[data-animate="fade"]');
    fadeElements.forEach((element) => {
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
            markers: false,
          },
        }
      );
    });

    // Slide in from left
    const slideLeftElements = containerRef.current.querySelectorAll('[data-animate="slide-left"]');
    slideLeftElements.forEach((element) => {
      gsap.fromTo(
        element,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5,
          },
        }
      );
    });

    // Slide in from right
    const slideRightElements = containerRef.current.querySelectorAll('[data-animate="slide-right"]');
    slideRightElements.forEach((element) => {
      gsap.fromTo(
        element,
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5,
          },
        }
      );
    });

    // Scale up
    const scaleElements = containerRef.current.querySelectorAll('[data-animate="scale"]');
    scaleElements.forEach((element) => {
      gsap.fromTo(
        element,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5,
          },
        }
      );
    });

    // Parallax effect
    const parallaxElements = containerRef.current.querySelectorAll('[data-animate="parallax"]');
    parallaxElements.forEach((element) => {
      gsap.to(element, {
        y: -50,
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
          markers: false,
        },
      });
    });

    // Stagger animation
    const staggerElements = containerRef.current.querySelectorAll('[data-animate="stagger"]');
    if (staggerElements.length > 0) {
      gsap.fromTo(
        staggerElements,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: staggerElements[0].parentElement,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5,
          },
        }
      );
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return containerRef;
};

// Hook for individual element animations
export const useElementAnimation = (animationType: string) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    switch (animationType) {
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
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
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

      case 'slide-right':
        gsap.fromTo(
          element,
          { opacity: 0, x: 50 },
          {
            opacity: 1,
            x: 0,
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

      case 'scale':
        gsap.fromTo(
          element,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
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

      case 'parallax':
        gsap.to(element, {
          y: -50,
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
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [animationType]);

  return elementRef;
};
