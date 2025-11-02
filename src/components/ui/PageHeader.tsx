import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/utils/cn";

interface PageHeaderProps {
  title: string;
  class?: string;
}

export const PageHeader = component$<PageHeaderProps>(({ title, class: className }) => {
  return (
    <div class={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between", className)}>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      <div class="mt-4 sm:mt-0">
        <Slot />
      </div>
    </div>
  );
});
