import { router } from '../trpc';
import { workflowRouter } from './routers/workflow';

export const appRouter = router({
  workflow: workflowRouter,
});

export type AppRouter = typeof appRouter;
