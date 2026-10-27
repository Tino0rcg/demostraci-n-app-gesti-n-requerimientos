import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Image 
        src="https://github.com/Tino0rcg/imagenes-pagina-online-2.0/blob/main/LOGO%20ONLINE%20SYSTEM%20NORMAL.png?raw=true" 
        alt="Online System Logo" 
        width={130} 
        height={45}
        priority
        className="object-contain h-8 w-auto max-w-[140px]"
      />
    </div>
  );
}
