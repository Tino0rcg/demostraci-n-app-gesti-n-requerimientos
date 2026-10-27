import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image 
        src="/logo-online-system.png" 
        alt="Online System Logo" 
        width={180} 
        height={80}
        priority
        className="object-contain h-10 sm:h-11 w-auto max-w-[170px] drop-shadow-[0_2px_10px_rgba(0,180,255,0.25)] filter brightness-110"
      />
    </div>
  );
}
