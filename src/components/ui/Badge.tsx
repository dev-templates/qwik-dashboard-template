import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/utils/cn";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  class?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  primary: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  success: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export const Badge = component$<BadgeProps>(({ variant = "default", class: className }) => {
  return (
    <span class={cn("inline-flex px-2 text-xs font-semibold rounded-full", variantClasses[variant], className)}>
      <Slot />
    </span>
  );
});
