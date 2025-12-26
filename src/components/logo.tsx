
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 text-2xl font-bold', className)}>
      <span className="font-headline text-foreground">Zoe</span>
      <span className="font-body text-primary">House</span>
    </Link>
  );
}
