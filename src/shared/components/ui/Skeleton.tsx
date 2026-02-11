import { cn } from "@/shared/utils/cn";

// interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
      {...props}
    />
  );
}
