import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full min-w-0 p-4 sm:p-6 h-[80vh]">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md bg-white/5" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px] sm:w-[400px] bg-white/5" />
          <Skeleton className="h-4 w-[200px] sm:w-[300px] bg-white/5" />
        </div>
      </div>
      
      <div className="flex-1 rounded-xl border border-white/10 glass-panel overflow-hidden p-6 flex flex-col items-center justify-center space-y-4">
         <Loader2 className="h-10 w-10 text-primary animate-spin" />
         <p className="text-muted-foreground text-sm font-medium animate-pulse tracking-widest uppercase">Cargando datos seguros...</p>
      </div>
    </div>
  );
}
