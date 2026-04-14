import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["echarts", "zrender"],
  output: "standalone",
};

export default nextConfig;
