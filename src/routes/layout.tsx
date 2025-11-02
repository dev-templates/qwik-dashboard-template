import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { ThemeScript } from "~/components/theme-script";
import { authMiddleware } from "~/server/middleware/auth";

export const onRequest: RequestHandler = authMiddleware;

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export default component$(() => {
  return (
    <>
      <ThemeScript />
      <Slot />
    </>
  );
});
