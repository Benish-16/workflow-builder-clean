import { router, publicProcedure } from '../../trpc'; // Add an extra ../
import { z } from 'zod';

export const workflowRouter = router({
  // 1. Fetch a single workflow with its nodes AND edges
  getWorkflowById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workflow.findUnique({
        where: { id: input.id },
        include: { 
          nodes: true,
          // Make sure your Prisma schema has an Edge model!
          edges: true 
        },
      });
    }),

  // 2. The "Sync" Mutation
  // This saves the entire current state of your canvas
  saveWorkflowLayout: publicProcedure
    .input(
      z.object({
        workflowId: z.number(),
        nodes: z.array(z.object({
          id: z.string(), // React Flow IDs are usually strings
          type: z.string(),
          data: z.any(),
          x: z.number(),
          y: z.number(),
        })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Clear existing nodes for this workflow and replace with new layout
      // This is the simplest way to keep the DB in sync with the UI
      await ctx.prisma.node.deleteMany({
        where: { workflowId: input.workflowId }
      });

      return ctx.prisma.node.createMany({
        data: input.nodes.map(node => ({
          ...node,
          workflowId: input.workflowId,
        })),
      });
    }),
});
