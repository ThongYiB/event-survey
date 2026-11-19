/* eslint-disable @typescript-eslint/no-require-imports -- Isolated CommonJS harness uses the installed TypeScript compiler. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);

// Browser storage is replaced with an in-memory fixture; no user storage is read or changed.
const saved = new Map();
let unavailable = false, full = false;
const localStorage = {
  getItem(key) { if (unavailable) throw new Error("blocked"); return saved.get(key) ?? null; },
  setItem(key, value) { if (full) throw new Error("quota"); saved.set(key, value); },
};
global.window = { localStorage, dispatchEvent() {} };
const modulePath = require.resolve("../src/app/admin/store.ts");
let { updateAdminSnapshot } = require(modulePath);
const fixtureEmail = "persistence-test@example.com";
updateAdminSnapshot((current) => ({ ...current,
  accounts: [...current.accounts, { name: "ทดสอบบันทึก", email: fixtureEmail, role: "Event Manager", status: "รอเปลี่ยนรหัสผ่าน", event: "ยังไม่มีอีเวนต์", password: "never-persist-this" }],
  audit: [{ action: "สร้างบัญชี Event Manager", target: fixtureEmail, time: new Date().toISOString() }, ...current.audit],
}));
const key = [...saved.keys()][0];
const load = () => JSON.parse(saved.get(key));
assert.equal(load().accounts.find((item) => item.email === fixtureEmail).password, undefined);
assert.equal(load().audit.length, 1);

// Simulate a fresh module instance, as on a reload: existing accounts and audit must survive.
delete require.cache[modulePath];
({ updateAdminSnapshot } = require(modulePath));
updateAdminSnapshot((current) => ({ ...current,
  accounts: current.accounts.map((item) => item.email === fixtureEmail ? { ...item, suspended: true } : item),
  events: current.events.map((item, index) => index === 0 ? { ...item, suspended: true } : item),
  audit: [{ action: "ระงับบัญชี", target: fixtureEmail, time: new Date().toISOString() }, ...current.audit],
}));
assert.equal(load().accounts.find((item) => item.email === fixtureEmail).suspended, true);
assert.equal(load().events[0].suspended, true);
assert.equal(load().audit.length, 2);
const beforeFailure = saved.get(key);
full = true;
assert.throws(() => updateAdminSnapshot((current) => ({ ...current, accounts: [] })), /บันทึกไม่ได้/);
assert.equal(saved.get(key), beforeFailure);
full = false;
saved.set(key, "invalid JSON that must be preserved");
assert.throws(() => updateAdminSnapshot((current) => current), /อ่านข้อมูล Admin/);
assert.equal(saved.get(key), "invalid JSON that must be preserved");
unavailable = true;
assert.throws(() => updateAdminSnapshot((current) => current), /ไม่อนุญาต/);
console.log("PASS: account creation, reload persistence, account/event status, atomic audit history, password exclusion, quota failure and corrupted/blocked storage protection.");
