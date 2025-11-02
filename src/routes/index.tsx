import type { RequestHandler } from "@builder.io/qwik-city";
import { SHARED_MAP_KEYS } from "~/constants/shared-map-keys";

export const onRequest: RequestHandler = async ({ redirect, sharedMap }) => {
  const authUser = sharedMap.get(SHARED_MAP_KEYS.AUTH_USER);

  if (authUser) {
    throw redirect(302, "/dashboard");
  } else {
    throw redirect(302, "/auth/login");
  }
};
