import type { QwikJSX } from "@builder.io/qwik";
import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/utils/cn";

type ButtonElement = QwikJSX.IntrinsicElements["button"];

export interface ButtonProps extends ButtonElement {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = component$<ButtonProps>(
  ({ variant = "primary", size = "md", class: className, loading = false, disabled, ...props }) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed";

    const variantClasses = {
      primary: "border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
      secondary:
        "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600",
      danger: "border border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
      ghost:
        "border-0 shadow-none text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-gray-500",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-11 px-6 text-base",
    };

    const buttonClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      {
        "opacity-50": loading || disabled,
        "cursor-pointer": !(loading || disabled),
      },
      className,
    );

    return (
      <button {...props} class={buttonClasses} disabled={loading || disabled}>
        <Slot />
      </button>
    );
  },
);
