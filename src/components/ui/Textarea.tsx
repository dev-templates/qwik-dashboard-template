import { component$, type QwikChangeEvent, type QwikFocusEvent } from "@builder.io/qwik";
import { cn } from "~/utils/cn";

interface TextareaProps {
  label?: string;
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onInput$?: (event: QwikChangeEvent<HTMLTextAreaElement>, element: HTMLTextAreaElement) => void;
  onFocus$?: (event: QwikFocusEvent<HTMLTextAreaElement>) => void;
  onBlur$?: (event: QwikFocusEvent<HTMLTextAreaElement>) => void;
  class?: string;
}

export const Textarea = component$<TextareaProps>(
  ({
    label,
    id,
    name,
    value,
    placeholder,
    rows = 3,
    required,
    disabled,
    error,
    onInput$,
    onFocus$,
    onBlur$,
    class: className,
  }) => {
    return (
      <div class={className}>
        {label && (
          <label for={id} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span class="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          rows={rows}
          required={required}
          disabled={disabled}
          onInput$={onInput$}
          onFocus$={onFocus$}
          onBlur$={onBlur$}
          class={cn(
            "block w-full px-3 py-2",
            "border border-gray-300 rounded-md shadow-sm",
            "placeholder-gray-400",
            "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
            "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            "dark:disabled:bg-gray-800 dark:disabled:text-gray-400",
            {
              "border-red-300 focus:border-red-500 focus:ring-red-500": error,
            },
          )}
        />
        {error && <p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);
