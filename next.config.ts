import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Reuse prefetched/visited dynamic pages for 30s on client navigation.
  experimental: { staleTimes: { dynamic: 30 } },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
});
