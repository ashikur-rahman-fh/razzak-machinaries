import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { securityHeaders } from '@razzak-machinaries/shared/security/headers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, '../..');

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: basePath ? basePath : undefined,
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@razzak-machinaries/shared'],
  headers: securityHeaders,
};

export default nextConfig;
