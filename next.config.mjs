import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin de workspace-root op deze map (er staat een losse lockfile in ~).
  outputFileTracingRoot: __dirname,
  // Zorg dat de (server-side) dataset wordt meegenomen in de Vercel-trace
  // van de API-routes, zodat fs.readFile bij deployment werkt.
  outputFileTracingIncludes: {
    "/api/**": ["./data/**"],
  },
};

export default nextConfig;
