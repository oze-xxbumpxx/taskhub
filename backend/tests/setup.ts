import { vi } from "vitest";

// Sequelizeのモックインスタンスを作成
const mockSequelize = {
  transaction: vi.fn(() => ({
    commit: vi.fn(),
    rollback: vi.fn(),
  })),
  define: vi.fn((modelName, attributes, options) => {
    // Model.initが呼ばれたときにsequelize.defineを呼び出すため、
    // モック関数を返す
    return {
      init: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      findByPk: vi.fn(),
      destroy: vi.fn(),
      hasMany: vi.fn(),
      belongsTo: vi.fn(),
    };
  }),
  authenticate: vi.fn(),
  sync: vi.fn(),
};

// データベースのモック
vi.mock("../src/config/database", () => ({
  default: mockSequelize,
  testConnection: vi.fn(),
}));

// モデルのモック
vi.mock("../src/models", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
  Task: {
    destroy: vi.fn(),
    init: vi.fn(),
    belongsTo: vi.fn(),
  },
  Project: {
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
}));
