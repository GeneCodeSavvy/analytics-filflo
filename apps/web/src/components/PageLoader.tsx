import { DotmTriangle6 } from "@/components/ui/dotm-triangle-6";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  inline?: boolean;
  className?: string;
  size?: number;
  dotSize?: number;
}

export function PageLoader({
  inline = false,
  className,
  size,
  dotSize,
}: PageLoaderProps) {
  const loaderSize = size ?? (inline ? 32 : 56);
  const loaderDotSize = dotSize ?? (inline ? 5 : 8);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-[--surface-page]",
        inline ? "h-40" : "min-h-svh",
        className,
      )}
    >
      <DotmTriangle6
        size={loaderSize}
        dotSize={loaderDotSize}
        color="var(--ember-500)"
        bloom
        ariaLabel="Loading"
      />
    </div>
  );
}
