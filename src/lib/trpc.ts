import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/entrypoints/background";

export const trpc = createTRPCReact<AppRouter>();
