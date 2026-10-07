// Loads .env.local / .env the same way Next.js does. Import this first in every script.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
