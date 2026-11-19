/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness compiles project modules in an isolated test process. */
// Integration checks run against a disposable database, never the project's data file.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "event-survey-test-"));
const databasePath = path.join(directory, "test.db");
process.env.SQLITE_PATH = databasePath;
process.env.NODE_ENV = "development";
process.env.MANAGER_DEMO_SESSION_SECRET = "test-only-manager-session-secret-1234567890";
delete process.env.MANAGER_DEMO_PASSWORD;

// Compile the project's TypeScript modules with its installed compiler in this test process.
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, parent, ...rest);
};

try {
  const { getPublicEvent, publishPublicEvent, submitSurvey, getSurveyResults } = require("../src/server/public-event.ts");
  const { registerAttendee } = require("../src/server/staff/service.ts");
  const { signInManager, isManagerSession, isSameOrigin } = require("../src/server/manager-session.ts");
  const { getDb } = require("../src/server/staff/db.ts");
  assert.equal(signInManager("manager@example.com", "wrong").status, 401);
  const signed = signInManager("manager@example.com", "1234");
  assert.equal(signed.status, 200);
  assert.equal(isManagerSession(signed.token), true);
  assert.equal(isManagerSession(signed.token + "x"), false);
  assert.equal(isManagerSession(undefined), false);
  assert.equal(isSameOrigin(new Request("http://localhost:3011/api/manager/sign-in", { headers: { host: "127.0.0.1:3011", origin: "http://127.0.0.1:3011" } })), true);
  assert.equal(isSameOrigin(new Request("http://localhost:3011/api/manager/sign-in", { headers: { host: "127.0.0.1:3011", origin: "http://other.invalid" } })), false);

  const config = getPublicEvent();
  assert.equal(config.registrationOpen, true);
  assert.equal(config.surveyFields.length, 3);
  assert.equal(submitSurvey({}).status, 400);
  assert.equal(submitSurvey({ requestKey: "1".repeat(32), revision: config.revision, answers: {} }).status, 400);
  assert.equal(submitSurvey({ requestKey: "1".repeat(32), revision: config.revision, answers: { satisfaction: "not-an-option" } }).status, 400);
  const payload = { requestKey: "1".repeat(32), revision: config.revision, answers: { satisfaction: "ดีมาก", activities: ["เวิร์กช็อปสร้างสรรค์"], comments: "ทดสอบบันทึกคำตอบและอ่านรายงาน" } };
  const accepted = submitSurvey(payload);
  assert.equal(accepted.status, 201);
  assert.equal(submitSurvey(payload).id, accepted.id);
  assert.equal(getSurveyResults().responses, 1);
  assert.equal(getSurveyResults().questions.find((question) => question.field.id === "satisfaction").choices["ดีมาก"], 1);

  assert.equal(publishPublicEvent({ ...config, surveyOpen: false, registrationOpen: false }).status, 200);
  assert.equal(getPublicEvent().revision, config.revision, "Changing availability must not invalidate an unchanged questionnaire");
  assert.equal(submitSurvey({ ...payload, requestKey: "2".repeat(32) }).code, "survey-closed");
  assert.equal(registerAttendee({ name: "ทดสอบ ปิดรับ", email: "closed@example.com", phone: "0891234567", faculty: "อื่น ๆ", studentId: "", requestKey: "3".repeat(32) }).code, "registration-closed");
  assert.equal(getSurveyResults().responses, 1);

  assert.equal(publishPublicEvent({ ...config, details: { ...config.details, name: "Published event" }, surveyFields: [...config.surveyFields, { id: "new-question", type: "text", label: "คำถามใหม่", help: "", required: true, options: "" }] }).status, 200);
  assert.equal(submitSurvey({ ...payload, requestKey: "4".repeat(32) }).code, "survey-updated");
  assert.equal(getDb().prepare("SELECT name FROM events WHERE id = ?").get("CC26").name, "Published event");
  assert.equal(publishPublicEvent({ ...config, surveyFields: [{ ...config.surveyFields[0], options: "ข้อเดียว" }] }).status, 400);
  assert.equal(publishPublicEvent({ ...config, details: { ...config.details, endDate: "2026-11-24" } }).status, 400);
  assert.equal(getSurveyResults().responses, 1);

  const revision = getPublicEvent().revision;
  globalThis.eventSurveyDb.close(); globalThis.eventSurveyDb = undefined;
  assert.equal(getPublicEvent().revision, revision);
  assert.equal(getSurveyResults().responses, 1);
  console.log("PASS: manager session, validation, durable survey response, idempotency, reports, closed registration/survey, schema revisions and publication.");
} finally {
  globalThis.eventSurveyDb?.close(); globalThis.eventSurveyDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) { const filename = databasePath + suffix; if (fs.existsSync(filename)) fs.unlinkSync(filename); }
  fs.rmdirSync(directory);
}
