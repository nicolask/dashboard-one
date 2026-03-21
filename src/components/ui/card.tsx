import { cn } from "@/lib/utils/cn";

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-panel backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

