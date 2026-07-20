import { z } from 'zod'

export const createWorldSchema = z.object({
  name: z.string().min(1).max(64),
})

export const updateScreenshotSchema = z.object({
  title: z.string().max(256).optional().nullable(),
  description: z.string().max(2048).optional().nullable(),
  date: z.string().optional().nullable(),
  worldId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  panorama: z.boolean().optional(),
})

export const createScreenshotSchema = z.object({
  title: z.string().max(256).optional().nullable(),
  description: z.string().max(2048).optional().nullable(),
  date: z.string().optional().nullable(),
  worldId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  panorama: z.boolean().optional(),
})
