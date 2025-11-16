import Project from "./Project";
import Task, { TaskStatus, TaskPriority } from "./Task";
import User from "./User";

// UserとProjectの関係
User.hasMany(Project, {
  foreignKey: "userId",
  as: "projects",
  onDelete: "CASCADE",
});
Project.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});

// UserとTaskの関係
User.hasMany(Task, {
  foreignKey: "userId",
  as: "tasks",
});
Task.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
  onDelete: "CASCADE",
});

// ProjectとTaskの関係
Project.hasMany(Task, {
  foreignKey: "projectId",
  as: "tasks",
});
Task.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

export { User, Project, Task, TaskStatus, TaskPriority };
