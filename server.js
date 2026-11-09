// A small job board: a JSON API and one page. Run with `npm start`.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadJobs, searchJobs, findJob } from "./lib/jobs.js";
import { loadSaved, writeSaved, addSaved, removeSaved } from "./lib/saved.js";

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method === "GET" && url.pathname === "/api/jobs") {
        const jobs = await loadJobs();
        return sendJson(res, 200, searchJobs(jobs, url.searchParams.get("q")));
      }
      if (req.method === "GET" && url.pathname === "/api/saved") {
        const [jobs, savedIds] = await Promise.all([loadJobs(), loadSaved()]);
        return sendJson(res, 200, savedIds.map((id) => findJob(jobs, id)).filter(Boolean));
      }
      if (req.method === "POST" && url.pathname === "/api/saved") {
        let jobId;
        try {
          jobId = JSON.parse((await readBody(req)) || "{}").jobId;
        } catch {
          return sendJson(res, 400, { error: "Invalid JSON body" });
        }
        const jobs = await loadJobs();
        if (!findJob(jobs, jobId)) return sendJson(res, 400, { error: "Unknown job id" });
        await writeSaved(addSaved(await loadSaved(), jobId));
        return sendJson(res, 201, { ok: true });
      }
      if (req.method === "DELETE" && url.pathname.startsWith("/api/saved/")) {
        const jobId = decodeURIComponent(url.pathname.slice("/api/saved/".length));
        await writeSaved(removeSaved(await loadSaved(), jobId));
        return sendJson(res, 200, { ok: true });
      }
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js")) {
        const file = url.pathname === "/" ? "index.html" : "app.js";
        const type = file.endsWith(".html") ? "text/html" : "text/javascript";
        const body = await readFile(new URL(`./public/${file}`, import.meta.url));
        res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
        return res.end(body);
      }
      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      console.error(err);
      sendJson(res, 500, { error: "Something went wrong" });
    }
  });
}

// Started directly (npm start), not imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(PORT, () => console.log(`Job board on http://localhost:${PORT}`));
}
