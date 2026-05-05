import { DotmTriangle6 } from "@/components/ui/dotm-triangle-6";

export function PageLoader() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-[--surface-page]">
      <DotmTriangle6
        size={56}
        dotSize={8}
        color="var(--ember-500)"
        bloom
        ariaLabel="Loading"
      />
    </main>
  );
}
