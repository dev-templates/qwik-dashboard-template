import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/utils/cn";

interface BoxProps {
  class?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Box = component$<BoxProps>(({ class: className, padding = "md" }) => {
  return (
    <div
      class={cn(
        "bg-white dark:bg-gray-800 shadow rounded-lg",
        {
          "p-4": padding === "sm",
          "p-6": padding === "md",
          "p-8": padding === "lg",
        },
        className,
      )}
    >
      <Slot />
    </div>
  );
});
