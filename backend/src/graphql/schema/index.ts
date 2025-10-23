import baseSchema from "./base";
import projectSchema from "./project";
import taskSchema from "./task";
import userSchema from "./user";

export const typeDefs = [baseSchema, userSchema, projectSchema, taskSchema]
  .filter(Boolean)
  .join("\n");
