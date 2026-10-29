import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// The Base44 preview proxy serves the dev server from a different origin
// (`https://3000-<suffix>`), which Next 16 blocks for dev assets/HMR unless it
// is listed. Only applied inside the sandbox preview; ordinary local dev and
// production builds keep the default allowlist.
const previewOrigin =
  process.env.BASE44_PREVIEW_MODE === "1" &&
  process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
    : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigin,
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
