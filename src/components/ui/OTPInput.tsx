import { $, component$, type PropFunction, sync$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";

export interface OTPInputProps {
  length?: number;
  name?: string;
  onComplete$?: PropFunction<(value: string) => void>;
  onChange$?: PropFunction<(value: string) => void>;
  class?: string;
  autoFocus?: boolean;
}

export const OTPInput = component$<OTPInputProps>(
  ({ length = 6, name = "otp", onComplete$, onChange$, class: className = "", autoFocus = false }) => {
    const values = useStore<string[]>(Array(length).fill(""));
    const inputRefs = useSignal<(HTMLInputElement | null)[]>(Array(length).fill(null));

    // Generate fixed key array to avoid using index as key
    const inputKeys = Array.from({ length }, (_, i) => `${name}-input-${i}-${length}`);

    // Handle auto focus using useVisibleTask$ instead of autoFocus attribute for better a11y
    // Using document-idle strategy to minimize performance impact
    useVisibleTask$(
      () => {
        if (autoFocus && inputRefs.value[0]) {
          inputRefs.value[0].focus();
        }
      },
      { strategy: "document-idle" },
    );

    const handleChange = $((index: number, value: string) => {
      // Only allow digits
      const numericValue = value.replace(/\D/g, "");

      if (numericValue.length <= 1) {
        // Set new value directly, overwriting existing content
        values[index] = numericValue;

        // If a value is entered, automatically move to next input
        if (numericValue && index < length - 1) {
          const nextInput = inputRefs.value[index + 1];
          nextInput?.focus();
        }

        // Notify change
        const otpValue = values.join("");
        if (onChange$) {
          onChange$(otpValue);
        }

        // Check if all inputs are filled
        if (otpValue.length === length && onComplete$) {
          onComplete$(otpValue);
        }
      } else if (numericValue.length > 1) {
        // Handle pasting multiple digits (via onInput event)
        const chars = numericValue.split("");
        for (let i = 0; i < chars.length && index + i < length; i++) {
          values[index + i] = chars[i];
          const input = inputRefs.value[index + i];
          if (input) {
            input.value = chars[i];
          }
        }

        // Focus on the last filled input
        const lastFilledIndex = Math.min(index + chars.length - 1, length - 1);
        const lastInput = inputRefs.value[lastFilledIndex];
        lastInput?.focus();

        // Notify change
        const otpValue = values.join("");
        if (onChange$) {
          onChange$(otpValue);
        }

        // Check if all inputs are filled
        if (otpValue.length === length && onComplete$) {
          onComplete$(otpValue);
        }
      }
    });

    const handleKeyDown = $((index: number, event: KeyboardEvent) => {
      const key = event.key;

      // If digit key and input has value, clear it first
      if (/^\d$/.test(key) && values[index]) {
        event.preventDefault();
        values[index] = "";
        // Let input continue processing
        const input = event.target as HTMLInputElement;
        input.value = "";
        // Manually trigger input
        setTimeout(() => {
          input.value = key;
          handleChange(index, key);
        }, 0);
      } else if (key === "Backspace") {
        if (!values[index] && index > 0) {
          // If current input is empty, delete previous input content and focus
          const prevInput = inputRefs.value[index - 1];
          if (prevInput) {
            values[index - 1] = "";
            prevInput.focus();
          }
        } else {
          // Clear current input
          values[index] = "";
        }
        // Notify change after backspace
        if (onChange$) {
          onChange$(values.join(""));
        }
      } else if (key === "ArrowLeft" && index > 0) {
        const prevInput = inputRefs.value[index - 1];
        prevInput?.focus();
      } else if (key === "ArrowRight" && index < length - 1) {
        const nextInput = inputRefs.value[index + 1];
        nextInput?.focus();
      }
    });

    // Handle paste using sync$ for synchronous DOM access
    const handlePaste = $(() => {
      // ClipboardData may be cleared after sync handler, so read from DOM instead
      // Get all current input values from the DOM refs
      const currentValues: string[] = [];
      for (let i = 0; i < length; i++) {
        const input = inputRefs.value[i];
        currentValues[i] = input?.value || "";
      }

      // Update state with DOM values
      currentValues.forEach((value, i) => {
        values[i] = value;
      });

      // Notify change
      const otpValue = values.join("");
      if (onChange$) {
        onChange$(otpValue);
      }

      // Check if completed
      if (otpValue.length === length && onComplete$) {
        onComplete$(otpValue);
      }
    });

    // Synchronous paste handler for immediate DOM updates
    const handlePasteSync = sync$((event: ClipboardEvent, currentTarget: HTMLInputElement) => {
      event.preventDefault();

      const pastedData = event.clipboardData?.getData("text") || "";
      const numericData = pastedData.replace(/\D/g, "");

      if (numericData) {
        // Find current input index from aria-label
        const match = currentTarget.getAttribute("aria-label")?.match(/OTP digit (\d+)/);
        if (!match) {
          return;
        }

        const startIndex = parseInt(match[1], 10) - 1;

        // Get the container to scope queries to this component instance only
        const container = currentTarget.parentElement;
        if (!container) {
          return;
        }

        // Get length from DOM (number of inputs in this container)
        const length = container.querySelectorAll("input").length;
        const chars = numericData.slice(0, length - startIndex).split("");

        // Synchronously update DOM inputs within this container
        chars.forEach((char, i) => {
          const index = startIndex + i;
          if (index < length) {
            const input = container.querySelector(`input[aria-label="OTP digit ${index + 1}"]`) as HTMLInputElement;
            if (input) {
              input.value = char;
            }
          }
        });

        // Focus on the last filled input within this container
        const lastIndex = Math.min(startIndex + chars.length - 1, length - 1);
        const lastInput = container.querySelector(`input[aria-label="OTP digit ${lastIndex + 1}"]`) as HTMLInputElement;
        lastInput?.focus();
      }
    });

    const containerClasses = ["flex gap-2 justify-center", className].filter(Boolean).join(" ");

    return (
      <>
        <div class={containerClasses}>
          {inputKeys.map((key, index) => (
            <input
              key={key}
              ref={(el) => {
                inputRefs.value[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={values[index]}
              onInput$={(e) => handleChange(index, (e.target as HTMLInputElement).value)}
              onKeyDown$={(e) => handleKeyDown(index, e)}
              onPaste$={[handlePasteSync, handlePaste]}
              class="w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg shadow-sm
                   border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-indigo-400"
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>
        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={values.join("")} />
      </>
    );
  },
);
