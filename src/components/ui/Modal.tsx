import { component$, Slot, useSignal, useTask$ } from "@builder.io/qwik";
import { LuX } from "@qwikest/icons/lucide";
import { cn } from "~/utils/cn";

export interface ModalProps {
  show: boolean;
  onClose$?: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal = component$<ModalProps>(({ show, onClose$, title, size = "md" }) => {
  const modalRef = useSignal<HTMLDivElement>();

  // Handle escape key
  useTask$(({ track }) => {
    track(() => show);

    if (!show) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose$) {
        onClose$();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  });

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  if (!show) return null;

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-gray-500 opacity-25 transition-opacity"
        onClick$={() => {
          if (onClose$) {
            onClose$();
          }
        }}
      ></div>

      {/* Modal panel */}
      <div
        class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        onClick$={(e) => e.stopPropagation()}
      >
        <div
          ref={modalRef}
          class={cn(
            "relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800",
            "text-left shadow-xl transition-all sm:my-8 w-full",
            sizeClasses[size],
          )}
        >
          {/* Header */}
          {(title || onClose$) && (
            <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div class="flex items-center justify-between">
                {title && (
                  <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                    {title}
                  </h3>
                )}
                {onClose$ && (
                  <button
                    type="button"
                    class="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick$={onClose$}
                  >
                    <span class="sr-only">Close</span>
                    <LuX class="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div class="px-6 py-4">
            <Slot />
          </div>
        </div>
      </div>
    </div>
  );
});
