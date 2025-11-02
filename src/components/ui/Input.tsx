import type { QwikJSX } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import { cn } from "~/utils/cn";

type InputElement = QwikJSX.IntrinsicElements["input"];

export interface InputProps extends InputElement {
  label?: string;
  error?: string;
}

export const Input = component$<InputProps>(({ label, error, class: className, ...props }) => {
  const inputClasses = cn(
    "block w-full h-10 px-3 rounded-md",
    "border-gray-300 shadow-sm",
    "focus:border-indigo-500 focus:ring-indigo-500",
    "text-base",
    "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
    {
      "border-red-500 focus:border-red-500 focus:ring-red-500": error,
    },
    className,
  );

  return (
    <div>
      {label && (
        <label for={props.id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input {...props} class={inputClasses} />
      {error && <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});
