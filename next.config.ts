import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ['mysql2', 'bcryptjs', 'ssh2'],
};

export default nextConfig;
