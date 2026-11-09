import { readFile, writeFile } from "node:fs/promises";

const DEFAULT_PATH = new URL("../saved.json", import.meta.url);

export async function loadSaved(path = DEFAULT_PATH) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function writeSaved(ids, path = DEFAULT_PATH) {
  await writeFile(path, JSON.stringify(ids, null, 2));
}

export function addSaved(ids, jobId) {
  return ids.includes(jobId) ? ids : [...ids, jobId];
}

export function removeSaved(ids, jobId) {
  return ids.filter((id) => id !== jobId);
}
