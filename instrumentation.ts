export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runAutomatedCelebrationCheck } = await import(
      "@/lib/celebration-service"
    );

    // Initial check on server start (in case scheduled time was reached while server was starting)
    setTimeout(async () => {
      try {
        await runAutomatedCelebrationCheck();
      } catch (err) {
        console.error("[Celebration Scheduler Initial Run Error]:", err);
      }
    }, 5000);

    // Periodic scheduler: Runs every 60 seconds to check celebration dates and scheduled times
    setInterval(async () => {
      try {
        console.log(
          "[Celebration Scheduler] Periodic 60s check at IST:",
          new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const res = await runAutomatedCelebrationCheck();
        if (res && "sent" in res && res.sent > 0) {
          console.log("[Celebration Scheduler] Dispatched emails:", res);
        }
      } catch (err) {
        console.error("[Celebration Scheduler Interval Error]:", err);
      }
    }, 60000);
  }
}
