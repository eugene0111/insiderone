# Job board starter

A small job board for an insiderOne work sample. It is made up: the jobs and
companies are not real.

## Run it

You need Node 20 or newer. There are no packages to install.

```
npm start      # then open http://localhost:3000
npm test       # runs the tests in test/
```

## What is here

- `server.js`: the web server. `GET /api/jobs?q=` lists jobs, `GET /` serves the page.
- `lib/jobs.js`: reading and searching the jobs. Pure functions.
- `jobs.json`: the jobs.
- `public/`: the page and its script.
- `test/`: tests, using Node's built-in test runner.

## Saved jobs

### What I built

- A **Save** button on each job in the list, and a **Saved jobs** section
  below it with a **Remove** button on each entry.
- `lib/saved.js`: pure functions (`addSaved`, `removeSaved`) plus a small
  JSON file read/write (`loadSaved`, `writeSaved`), mirroring the style of
  `lib/jobs.js`.
- Three routes in `server.js`:
  - `GET /api/saved` — the saved jobs, in the order they were saved.
  - `POST /api/saved` with `{ "jobId": "..." }` — saves a job. Unknown ids
    get a `400` with an error message instead of crashing. Saving the same
    id twice keeps one copy.
  - `DELETE /api/saved/:jobId` — removes a job from the list.
- Saved ids are stored in `saved.json` (created on first save), so they
  survive a restart. No database needed for this scale.

### Run it and test it

Same as above: `npm start` then open http://localhost:3000; `npm test` runs
everything, including `test/saved.test.js` (unit tests for the pure
functions and integration tests that hit the running HTTP routes).

### One decision

`saved.json` stores just an array of job ids, not full job copies. Saved
jobs are resolved against `jobs.json` on every read. This keeps the saved
list always in sync with the job catalog (a job's details can't drift out
of date) at the cost of a saved id pointing nowhere if a job is ever
removed from `jobs.json` — handled by filtering out unresolved ids rather
than erroring.

### What I'd do next

- Move from a flat JSON file to SQLite once concurrent writers are a
  concern (the current file write isn't safe under parallel requests).
- Per-user saved lists, once the app has any notion of a logged-in user.

### Tools

First I broke the brief into peices and then understood the working of
this repo and copy pasted the code which I thought could be reused.
Created new API Routes for the Saved list and deletion.

I used AI to generate test cases with the already existing cases and 
wrote the code around it and verified if the test cases pass. I used AI 
to document the code changes to the README file as well.