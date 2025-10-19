export const logger = {
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : "");
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : "");
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data ? JSON.stringify(data) : "");
  },
};
