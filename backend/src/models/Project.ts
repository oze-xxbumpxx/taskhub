import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface ProjectAttributes {
  id: string;
  name: string;
  description: string | null;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "id" | "createdAt" | "updatedAt"> {
  name: string;
  description: string | null;
  color: string;
  userId: string;
}

class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: string;
  public name!: string;
  public description!: string | null;
  public color!: string;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#3B82F6",
      validate: {
        is: /^#[0-9A-F]{6}$/i, // 16進数カラーコードの形式チェック
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Project",
    tableName: "projects",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    indexes: [{ fields: ["userId"] }],
  }
);

export default Project;
