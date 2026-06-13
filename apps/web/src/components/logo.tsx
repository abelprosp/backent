import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { height: 22, width: 77 },
  md: { height: 28, width: 98 },
  lg: { height: 36, width: 126 },
  xl: { height: 44, width: 154 },
} as const;

interface LogoProps {
  size?: keyof typeof SIZES;
  href?: string;
  className?: string;
}

export function Logo({ size = 'md', href, className }: LogoProps) {
  const { height, width } = SIZES[size];

  const image = (
    <Image
      src="/logo.png"
      alt="Backent"
      width={width}
      height={height}
      className={cn('h-auto w-auto object-contain', className)}
      style={{ height, width: 'auto', maxWidth: width }}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{image}</span>;
}
