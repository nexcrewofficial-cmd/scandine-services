import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@scan-and-dine/ui-components', '@scan-and-dine/shared-types'],
};

export default nextConfig;
