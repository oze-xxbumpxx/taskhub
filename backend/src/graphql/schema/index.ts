import projectSchema from "./project";
import taskSchema from "./task";
import userSchema from "./user";

export const typeDefs = [userSchema, projectSchema, taskSchema].filter(Boolean);
