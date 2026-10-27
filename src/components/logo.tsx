import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center', className)}>
      <Image 
        src="https://github.com/Tino0rcg/imagenes-pagina-online-2.0/blob/main/LOGO%20ONLINE%20SYSTEM%20NORMAL.png?raw=true" 
        alt="Online System Logo" 
        width={140} 
        height={48}
        priority
        className="object-contain h-9 w-auto max-w-[150px]"
      />
    </div>
  );
}
