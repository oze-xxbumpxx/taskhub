import { projectSchema } from "./project";
import { taskSchema } from "./task";
import { userSchema } from "./user";
import { scalarSchema } from "./scalars";
import { baseSchema } from "./base";

export const typeDefs = [
  scalarSchema,
  baseSchema,
  userSchema,
  projectSchema,
  taskSchema,
].filter(Boolean);
