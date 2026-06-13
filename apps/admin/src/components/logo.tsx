import Image from 'next/image';
import Link from 'next/link';

const SIZES = {
  sm: { height: 22, width: 77 },
  md: { height: 28, width: 98 },
  lg: { height: 36, width: 126 },
} as const;

export function Logo({
  size = 'md',
  href,
}: {
  size?: keyof typeof SIZES;
  href?: string;
}) {
  const { height, width } = SIZES[size];
  const image = (
    <Image
      src="/logo.png"
      alt="Backent"
      width={width}
      height={height}
      style={{ height, width: 'auto', maxWidth: width }}
      priority
    />
  );
  if (href) return <Link href={href}>{image}</Link>;
  return image;
}
