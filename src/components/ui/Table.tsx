import { $, component$, Slot } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { cn } from "~/utils/cn";

interface TableProps {
  class?: string;
  fillHeight?: boolean;
  showColumnDividers?: boolean; // Show vertical dividers between columns
}

export const Table = component$<TableProps>(({ class: className, fillHeight = true, showColumnDividers = false }) => {
  const tableContent = (
    <table
      class={cn(
        "w-full min-w-max divide-y divide-gray-200 dark:divide-gray-700",
        fillHeight && "fill-height-table",
        showColumnDividers && "show-column-dividers",
      )}
    >
      <Slot />
    </table>
  );

  if (fillHeight) {
    // Auto-height table - needs special structure to support sticky positioning
    return (
      <div class="flex-1 min-h-0 flex flex-col">
        <div
          class={cn("h-full bg-white dark:bg-gray-800 shadow sm:rounded-md overflow-hidden flex flex-col", className)}
        >
          <div class="flex-1 overflow-auto fill-height-table-container">{tableContent}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      class={cn(
        "bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md",
        // Add default button styles for all buttons inside table
        "[&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50",
        // Ensure consistent button sizing in action columns (last column)
        "[&_td:last-child_button]:min-w-[4.5rem] [&_td:last-child_button]:inline-block [&_td:last-child_button]:text-center",
        className,
      )}
    >
      <div class="overflow-auto">{tableContent}</div>
    </div>
  );
});

interface TableHeadProps {
  class?: string;
}

export const TableHead = component$<TableHeadProps>(({ class: className }) => {
  return (
    <thead class={cn("bg-gray-50 dark:bg-gray-700", className)}>
      <Slot />
    </thead>
  );
});

interface TableBodyProps {
  class?: string;
}

export const TableBody = component$<TableBodyProps>(({ class: className }) => {
  return (
    <tbody class={cn("bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700", className)}>
      <Slot />
    </tbody>
  );
});

interface TableRowProps {
  hoverable?: boolean;
  class?: string;
  key?: string | number;
}

export const TableRow = component$<TableRowProps>(({ hoverable = false, class: className }) => {
  return (
    <tr class={cn(hoverable && "hover:bg-gray-50 dark:hover:bg-gray-700", className)}>
      <Slot />
    </tr>
  );
});

interface TableHeaderProps {
  align?: "left" | "center" | "right";
  class?: string;
}

export const TableHeader = component$<TableHeaderProps>(({ align = "left", class: className }) => {
  return (
    <th
      scope="col"
      class={cn(
        // For fill-height-table, styles are defined in global.css
        // For normal tables, keep original styles
        "px-6 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap",
        {
          "text-left": align === "left",
          "text-center": align === "center",
          "text-right": align === "right",
        },
        className,
      )}
    >
      <Slot />
    </th>
  );
});

interface TableCellProps {
  align?: "left" | "center" | "right";
  nowrap?: boolean;
  class?: string;
  colSpan?: number;
}

export const TableCell = component$<TableCellProps>(({ align = "left", nowrap = true, class: className, colSpan }) => {
  return (
    <td
      class={cn(
        "px-6 py-4",
        {
          "text-left": align === "left",
          "text-center": align === "center",
          "text-right": align === "right",
          "whitespace-nowrap": nowrap,
        },
        className,
      )}
      colSpan={colSpan}
    >
      <Slot />
    </td>
  );
});

interface TableFootProps {
  class?: string;
  // Required pagination data from parent/loader
  totalItems: number;
  // Optional customization
  pageSizeOptions?: number[];
}

export const TableFoot = component$<TableFootProps>(
  ({ class: className, totalItems, pageSizeOptions = [10, 20, 30, 50, 100] }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Get pagination params from URL
    const currentPage = Number(location.url.searchParams.get("page")) || 1;
    const pageSize = Number(location.url.searchParams.get("pageSize")) || pageSizeOptions[0];

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // Internal navigation handlers
    const handlePageChange = $((page: number) => {
      const params = new URLSearchParams(location.url.searchParams);
      console.log(params);
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      navigate(`${location.url.pathname}?${params.toString()}`);
    });

    const handlePageSizeChange = $((size: number) => {
      const params = new URLSearchParams(location.url.searchParams);
      if (size === pageSizeOptions[0]) {
        params.delete("pageSize");
      } else {
        params.set("pageSize", String(size));
      }
      params.delete("page"); // Reset to first page
      navigate(`${location.url.pathname}?${params.toString()}`);
    });

    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    return (
      <div
        class={cn(
          "bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 rounded-b-md px-6 py-2",
          className,
        )}
      >
        <div class="tfoot-content">
          <div class="tfoot-left text-sm text-gray-700 dark:text-gray-300">
            {totalItems === 0 ? (
              "No results"
            ) : (
              <>
                Showing {startIndex} to {endIndex} of {totalItems} results
              </>
            )}
          </div>
          <div class="tfoot-center">
            <div class="flex items-center gap-1">
              <button
                type="button"
                onClick$={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                class="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick$={() => handlePageChange(pageNum)}
                    class={`px-2 py-1 text-xs font-medium rounded ${
                      currentPage === pageNum
                        ? "bg-indigo-500 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick$={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                class="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
          <div class="tfoot-right">
            <div class="flex items-center gap-2">
              <label for="items-per-page" class="text-xs text-gray-600 dark:text-gray-400">
                Per page:
              </label>
              <select
                id="items-per-page"
                value={pageSize}
                onChange$={(_, el) => {
                  handlePageSizeChange(Number(el.value));
                }}
                class="px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={String(size)}>
                    {String(size)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

// Actions header for the last column
export const TableActionsHeader = component$(() => {
  return (
    <th scope="col" class="relative px-6 py-3">
      <span class="sr-only">Actions</span>
    </th>
  );
});
