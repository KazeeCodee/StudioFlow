import type { NextConfig } from "next";
import withRspack from "next-rspack";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

const useRspack = process.env.USE_NEXT_RSPACK === "true";

export default useRspack ? withRspack(nextConfig) : nextConfig;
