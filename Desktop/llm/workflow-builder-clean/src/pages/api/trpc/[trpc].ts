import * as trpcNext from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/api/root';
import { trpcContext } from '../../../server/trpc';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => trpcContext,
});
