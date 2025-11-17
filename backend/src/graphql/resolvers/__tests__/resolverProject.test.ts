import { deflate } from "zlib";
import { Project } from "../../../models";
import { describe, vi } from "vitest";
import { testConnection } from "../../../config/database";
import { makeAuthContext } from "../../../../tests/helpers";

// Project.findAndCountAll の戻り値型
type ProjectFindAndCountAllReturn =
  | { rows: Project[]; count: number }
  | {
      rows: Project[];
      count: Array<{ count: number; [key: string]: unknown }>;
    };

type ProjectFindAndCountNumberResult = Extract<
  ProjectFindAndCountAllReturn,
  { count: number }
>;

// モックの設定
vi.mock("../../../config/database", () => ({
  default: {
    transaction: vi.fn(() => ({
      commit: vi.fn(),
      rollback: vi.fn(),
    })),
    define: vi.fn(),
    authenticate: vi.fn(),
    sync: vi.fn(),
  },
  testConnection: vi.fn(),
}));

vi.mock("../../../models", () => ({
  Project: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
    findAndCountAll: vi.fn(),
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
  Task: {
    init: vi.fn(),
    belongsTo: vi.fn(),
    hasMany: vi.fn(),
  },
  User: {
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
}));

vi.mock("../../../utils/auth", () => ({
  authMiddleware: vi.fn(),
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Project Resolver", () => {
  const userId = "user-123";
  const dummyCtx = makeAuthContext("test-token");
});

beforeEach(() => {
  vi.clearAllMocks();
});
