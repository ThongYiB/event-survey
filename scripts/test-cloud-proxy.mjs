import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function load(relative, mocks) {
  const filename = path.join(testDirectory, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = createRequire(filename);
  new Function("require", "module", "exports", compiled)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name), compiledModule, compiledModule.exports,
  );
  return compiledModule.exports;
}

const activeAdmin = { id: "admin-id", email: "admin@example.test", role: "system_admin", suspended: false, must_change_password: false, deleted_at: null };
let profile = { ...activeAdmin };
let claims = { sub: activeAdmin.id };
let claimsError = null;
let user = { id: activeAdmin.id };
let clients = 0, profileReads = 0, userChecks = 0;
const client = {
  auth: {
    getClaims: async () => ({ data: claims ? { claims } : null, error: claimsError }),
    getUser: async () => { userChecks++; return { data: { user }, error: null }; },
  },
  from: () => {
    profileReads++;
    return { select: () => ({ eq: (_key, id) => {
      assert.equal(id, activeAdmin.id);
      return { single: async () => ({ data: profile, error: null }) };
    } }) };
  },
};
const { supabaseProxy } = load("src/lib/supabase/proxy.ts", {
  "@supabase/ssr": { createServerClient: () => { clients++; return client; } },
  "./config": { supabasePublicConfig: () => ({ url: "https://project.example", key: "public-key" }) },
});
const auth = load("src/server/cloud/auth.ts", {
  "server-only": {},
  "@/lib/supabase/server": { createSupabaseServerClient: async () => client },
});
const adminApi = load("src/app/api/admin/workspace/route.ts", {
  "@/server/cloud/auth": auth,
  "@/lib/supabase/admin": { createSupabaseAdminClient: () => { throw new Error("Unexpected privileged client"); } },
  "@/server/manager-session": { isSameOrigin: () => false },
});
const request = (pathname) => new NextRequest(`https://event-survey.example${pathname}`);

(async () => {
  for (const pathname of ["/api/admin/workspace", "/api/manager/events", "/api/manager/active-event", "/api/staff/cloud-events"]) {
    const response = await supabaseProxy(request(pathname));
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  assert.equal(clients, 0, "Cloud APIs must not run duplicate proxy database queries");

  user = null;
  const denied = await adminApi.GET();
  assert.equal(denied.status, 401, "Direct API requests must still authenticate without the proxy");
  assert.equal(profileReads, 0);
  user = { id: activeAdmin.id };
  profile = { ...activeAdmin, role: "event_manager" };
  assert.equal((await adminApi.GET()).status, 403, "Manager cannot use the Admin API");

  for (const restricted of [{ suspended: true }, { deleted_at: "2026-11-19" }, { must_change_password: true }]) {
    profile = { ...activeAdmin, ...restricted };
    assert.equal((await adminApi.GET()).status, restricted.must_change_password ? 428 : 403);
  }
  profile = { ...activeAdmin, must_change_password: true };
  assert.equal((await auth.requireCloudProfile(undefined, true)).profile.must_change_password, true);
  assert.ok(userChecks >= 6, "API authorization must retain live Auth user validation");

  profile = { ...activeAdmin };
  profileReads = 0;
  for (const invalid of [null, { sub: activeAdmin.id }]) {
    claims = invalid;
    claimsError = invalid ? new Error("Invalid or expired JWT signature") : null;
    const response = await supabaseProxy(request("/admin/accounts"));
    assert.equal(response.headers.get("location"), "https://event-survey.example/login");
  }
  assert.equal(profileReads, 0, "Unverified claims must not reach the profile query");
  claims = { sub: activeAdmin.id };
  claimsError = null;
  assert.equal((await supabaseProxy(request("/admin/accounts"))).headers.get("x-middleware-next"), "1");
  for (const restricted of [{ suspended: true }, { deleted_at: "2026-11-19" }]) {
    profile = { ...activeAdmin, ...restricted };
    assert.equal((await supabaseProxy(request("/admin/accounts"))).headers.get("location"), "https://event-survey.example/login");
  }
  profile = { ...activeAdmin, must_change_password: true };
  assert.equal((await supabaseProxy(request("/admin/accounts"))).headers.get("location"), "https://event-survey.example/set-password");
  profile = { ...activeAdmin, role: "staff" };
  assert.equal((await supabaseProxy(request("/admin/accounts"))).headers.get("location"), "https://event-survey.example/staff");
  assert.equal((await supabaseProxy(request("/api/public/event"))).status, 503);
  console.log("PASS: faster proxy retains API authentication, role restrictions, account status and JWT checks");
})().catch((error) => { console.error(error); process.exitCode = 1; });
