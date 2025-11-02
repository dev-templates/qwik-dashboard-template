import type { RequestHandler } from "@builder.io/qwik-city";
import { initializeDatabase } from "~/server/db-init";

/**
 * Qwik City Database Initialization Plugin
 *
 * This plugin automatically runs on server startup to ensure the database is initialized.
 * The @ symbol in the filename indicates this is a Qwik City plugin.
 *
 * Reference: https://qwik.dev/docs/guides/env-variables/#database-initialization
 */

// Ensure initialization only happens once
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export const onRequest: RequestHandler = async () => {
  // If already initialized, return immediately
  if (isInitialized) {
    return;
  }

  // If initialization is in progress, wait for it to complete
  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  // Start initialization
  initializationPromise = initializeDatabase()
    .then(() => {
      isInitialized = true;
      console.log("🎉 Database initialization completed, service is ready");
    })
    .catch((error) => {
      console.error("⚠️  Database initialization encountered issues, but service will continue:", error);
      // Mark as initialized even on failure to avoid retrying on every request
      isInitialized = true;
    });

  await initializationPromise;
};
