import { $, component$, type PropFunction, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";

export interface OTPInputProps {
  length?: number;
  name?: string;
  onComplete$?: PropFunction<(value: string) => void>;
  class?: string;
  autoFocus?: boolean;
}

export const OTPInput = component$<OTPInputProps>(
  ({ length = 6, name = "otp", onComplete$, class: className = "", autoFocus = false }) => {
    const values = useStore<string[]>(Array(length).fill(""));
    const inputRefs = useSignal<(HTMLInputElement | null)[]>([]);

    // Generate fixed key array to avoid using index as key
    const inputKeys = Array.from({ length }, (_, i) => `${name}-input-${i}-${length}`);

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

        // Check if all inputs are filled
        const otpValue = values.join("");
        if (otpValue.length === length && onComplete$) {
          onComplete$(otpValue);
        }
      } else if (numericValue.length > 1) {
        // Handle pasting multiple digits
        const chars = numericValue.split("");
        for (let i = 0; i < chars.length && index + i < length; i++) {
          values[index + i] = chars[i];
        }

        // Focus on the last filled input or the last input
        const lastFilledIndex = Math.min(index + chars.length - 1, length - 1);
        const lastInput = inputRefs.value[lastFilledIndex];
        lastInput?.focus();

        // Check if all inputs are filled
        const otpValue = values.join("");
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
      } else if (key === "ArrowLeft" && index > 0) {
        const prevInput = inputRefs.value[index - 1];
        prevInput?.focus();
      } else if (key === "ArrowRight" && index < length - 1) {
        const nextInput = inputRefs.value[index + 1];
        nextInput?.focus();
      }
    });

    const containerClasses = ["flex gap-2 justify-center", className].filter(Boolean).join(" ");

    // Add native paste event listener and handle autofocus
    useVisibleTask$(() => {
      // Handle autofocus
      if (autoFocus && inputRefs.value[0]) {
        inputRefs.value[0].focus();
      }
      const handleNativePaste = (e: ClipboardEvent) => {
        const target = e.target as HTMLInputElement;

        // Check if it's our OTP input
        if (!target || !target.getAttribute("aria-label")?.includes("OTP digit")) {
          return;
        }

        e.preventDefault();

        const pastedData = e.clipboardData?.getData("text") || "";
        const numericData = pastedData.replace(/\D/g, "");

        if (numericData) {
          // Find current input index
          const match = target.getAttribute("aria-label")?.match(/OTP digit (\d+)/);
          if (!match) return;

          const startIndex = parseInt(match[1]) - 1;
          const chars = numericData.slice(0, length - startIndex).split("");

          // Fill inputs
          chars.forEach((char, i) => {
            const index = startIndex + i;
            if (index < length) {
              values[index] = char;
              const input = inputRefs.value[index];
              if (input) {
                input.value = char;
              }
            }
          });

          // Focus on the last filled input
          const lastIndex = Math.min(startIndex + chars.length - 1, length - 1);
          inputRefs.value[lastIndex]?.focus();

          // Check if completed
          const otpValue = values.join("");
          if (otpValue.length === length && onComplete$) {
            onComplete$(otpValue);
          }
        }
      };

      // Add paste event listener to each input
      inputRefs.value.forEach((input) => {
        if (input) {
          input.addEventListener("paste", handleNativePaste);
        }
      });

      // Cleanup function
      return () => {
        inputRefs.value.forEach((input) => {
          if (input) {
            input.removeEventListener("paste", handleNativePaste);
          }
        });
      };
    });

    return (
      <>
        <div class={containerClasses}>
          {inputKeys.map((key, index) => (
            <input
              key={key}
              ref={(el) => {
                if (el) {
                  if (!inputRefs.value) inputRefs.value = [];
                  inputRefs.value[index] = el;
                }
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={values[index]}
              onInput$={(e) => handleChange(index, (e.target as HTMLInputElement).value)}
              onKeyDown$={(e) => handleKeyDown(index, e)}
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
