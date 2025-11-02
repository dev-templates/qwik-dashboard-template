import { component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">View and manage your reports here.</p>

      <div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Available Reports</h2>
        <p class="text-gray-600 dark:text-gray-400">No reports available at this time.</p>
      </div>
    </>
  );
});
