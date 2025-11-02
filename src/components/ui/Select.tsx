import type { QwikJSX } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import { LuChevronDown } from "@qwikest/icons/lucide";
import { cn } from "~/utils/cn";

type SelectElement = QwikJSX.IntrinsicElements["select"];

export interface SelectProps extends SelectElement {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  placeholder?: string;
}

export const Select = component$<SelectProps>(({ label, options, error, class: className, ...props }) => {
  const selectClasses = cn(
    "block w-full h-10 pl-3 pr-10 rounded-md",
    "border border-gray-300 shadow-sm",
    "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
    "text-base",
    "bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white",
    "cursor-pointer",
    "appearance-none", // Remove default browser arrow
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
      <div class="relative">
        <select {...props} class={selectClasses}>
          {props.placeholder && (
            <option value="" disabled selected>
              {props.placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <LuChevronDown class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      </div>
      {error && <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});
