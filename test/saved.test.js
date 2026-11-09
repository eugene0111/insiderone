import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addSaved, removeSaved, loadSaved, writeSaved } from "../lib/saved.js";
import { createApp } from "../server.js";

test("addSaved keeps one copy of a job id", () => {
  assert.deepEqual(addSaved([], "j1"), ["j1"]);
  assert.deepEqual(addSaved(["j1"], "j1"), ["j1"]);
  assert.deepEqual(addSaved(["j1"], "j2"), ["j1", "j2"]);
});

test("removeSaved drops a job id", () => {
  assert.deepEqual(removeSaved(["j1", "j2"], "j1"), ["j2"]);
  assert.deepEqual(removeSaved(["j1"], "nope"), ["j1"]);
});

test("loadSaved returns an empty list when the file does not exist yet", async () => {
  const dir = await mkdtemp(join(tmpdir(), "saved-"));
  try {
    assert.deepEqual(await loadSaved(join(dir, "saved.json")), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("writeSaved persists ids that loadSaved reads back", async () => {
  const dir = await mkdtemp(join(tmpdir(), "saved-"));
  try {
    const path = join(dir, "saved.json");
    await writeSaved(["j1", "j2"], path);
    assert.deepEqual(await loadSaved(path), ["j1", "j2"]);
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), ["j1", "j2"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://localhost:${server.address().port}`;
  try {
    await run(base);
  } finally {
    server.close();
  }
}

test("POST then GET /api/saved saves a job", async () => {
  await withServer(async (base) => {
    const post = await fetch(`${base}/api/saved`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "j1" }),
    });
    assert.equal(post.status, 201);

    const list = await (await fetch(`${base}/api/saved`)).json();
    assert.ok(list.some((j) => j.id === "j1"));

    await fetch(`${base}/api/saved/j1`, { method: "DELETE" });
  });
});

test("saving the same job twice keeps one copy", async () => {
  await withServer(async (base) => {
    const save = () =>
      fetch(`${base}/api/saved`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: "j2" }),
      });
    await save();
    await save();

    const list = await (await fetch(`${base}/api/saved`)).json();
    assert.equal(list.filter((j) => j.id === "j2").length, 1);

    await fetch(`${base}/api/saved/j2`, { method: "DELETE" });
  });
});

test("saving an unknown job id returns a clear error", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/saved`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "does-not-exist" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });
});

test("DELETE removes a saved job", async () => {
  await withServer(async (base) => {
    await fetch(`${base}/api/saved`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "j3" }),
    });

    const del = await fetch(`${base}/api/saved/j3`, { method: "DELETE" });
    assert.equal(del.status, 200);

    const list = await (await fetch(`${base}/api/saved`)).json();
    assert.ok(!list.some((j) => j.id === "j3"));
  });
});
