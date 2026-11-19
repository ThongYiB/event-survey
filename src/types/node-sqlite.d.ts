// Type ขั้นต่ำของ node:sqlite (มีใน Node 22.5+ / ใช้ได้โดยไม่ต้องใส่ flag ใน Node 23.4+)
// โปรเจกต์ใช้ @types/node v20 ซึ่งยังไม่มี type ของโมดูลนี้
// ถ้าอัปเกรดเป็น @types/node v24 ขึ้นไป ให้ลบไฟล์นี้ทิ้งได้เลย

declare module "node:sqlite" {
  type SQLValue = null | number | bigint | string | Uint8Array;

  interface RunResult {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: SQLValue[]): RunResult;
    get(...params: SQLValue[]): Record<string, SQLValue> | undefined;
    all(...params: SQLValue[]): Record<string, SQLValue>[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
