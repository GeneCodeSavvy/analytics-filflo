import { DotmTriangle6 } from "@/components/ui/dotm-triangle-6";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  inline?: boolean;
  className?: string;
}

export function PageLoader({ inline = false, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-[--surface-page]",
        inline ? "h-40" : "min-h-svh",
        className
      )}
    >
      <DotmTriangle6
        size={inline ? 32 : 56}
        dotSize={inline ? 5 : 8}
        color="var(--ember-500)"
        bloom
        ariaLabel="Loading"
      />
    </div>
  );
}
