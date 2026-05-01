import type { SVGProps } from 'react';

export type SocialIconName = 'facebook' | 'instagram' | 'twitter';

type SocialIconProps = SVGProps<SVGSVGElement> & {
  name: SocialIconName;
  size?: number;
};

export default function SocialIcon({ name, size = 24, ...props }: SocialIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };

  if (name === 'facebook') {
    return (
      <svg {...commonProps}>
        <path d="M15 8h-2c-.6 0-1 .4-1 1v2h3l-.5 3H12v7H9v-7H7v-3h2V9c0-2.2 1.3-4 4-4h2v3Z" />
      </svg>
    );
  }

  if (name === 'instagram') {
    return (
      <svg {...commonProps}>
        <rect width="17" height="17" x="3.5" y="3.5" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M17.5 6.8h.01" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  );
}
