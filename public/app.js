const list = document.getElementById("jobs");
const savedList = document.getElementById("saved");
const search = document.getElementById("search");

function describe(job) {
  return `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month.`;
}

async function getSaved() {
  const res = await fetch("/api/saved");
  return res.json();
}

async function show(query = "") {
  const [jobs, saved] = await Promise.all([
    fetch(`/api/jobs?q=${encodeURIComponent(query)}`).then((r) => r.json()),
    getSaved(),
  ]);
  const savedIds = new Set(saved.map((j) => j.id));

  list.innerHTML = "";
  for (const job of jobs) {
    const li = document.createElement("li");
    li.append(describe(job));
    const btn = document.createElement("button");
    const isSaved = savedIds.has(job.id);
    btn.textContent = isSaved ? "Saved" : "Save";
    btn.disabled = isSaved;
    btn.addEventListener("click", async () => {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      show(search.value);
    });
    li.append(btn);
    list.append(li);
  }

  savedList.innerHTML = "";
  for (const job of saved) {
    const li = document.createElement("li");
    li.append(describe(job));
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", async () => {
      await fetch(`/api/saved/${job.id}`, { method: "DELETE" });
      show(search.value);
    });
    li.append(btn);
    savedList.append(li);
  }
}

search.addEventListener("input", () => show(search.value));
show();
