// Starts the background job worker once per server process.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/server/job-handlers");
    const { startWorker } = await import("./lib/server/jobs");
    startWorker();
  }
}
