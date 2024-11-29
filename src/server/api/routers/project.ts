import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from './../trpc';
import { PrismaClient } from '@prisma/client';
import {create} from "domain"
export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async({ctx, input}) => {
        const project = await ctx.db.project.create({
            data: {
                name: input.name,
                githubUrl: input.githubUrl,
                userToProjects: {
                    create: {
                        userId: ctx.user.userId!,
                    }
                }
            }
        })
        return project
})
});
