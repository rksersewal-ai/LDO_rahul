import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "960px",
  md: "1180px",
  lg: "1480px",
  xl: "1680px",
} as const;

interface PageFrameProps {
  children: React.ReactNode;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function PageFrame({ children, size = "lg", className }: PageFrameProps) {
  return (
    <div
      className={cn("mx-auto mt-[18px] mb-8 w-full px-4", className)}
      style={{ maxWidth: sizeMap[size] }}
    >
      {children}
    </div>
  );
}
