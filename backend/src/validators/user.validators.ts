import { z } from "zod";
import { passwordSchema } from "./auth.validators.js";

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: passwordSchema,
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
