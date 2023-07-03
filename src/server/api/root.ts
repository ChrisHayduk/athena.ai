import { chatRouter } from "~/server/api/routers/chat";
import { chromaRouter } from "~/server/api/routers/chroma";
import { exampleRouter } from "~/server/api/routers/example";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  chat: chatRouter,
  chroma: chromaRouter,
  example: exampleRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
