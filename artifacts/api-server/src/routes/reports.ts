import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetReportResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/:id", async (req, res): Promise<void> => {
  // Reports contain full scan findings for the target — they are private to
  // the user who ran the scan. Require authentication and ownership.
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const [report] = await db
      .select()
      .from(reportsTable)
      .where(eq(reportsTable.id, id));

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    if (report.userId !== req.user.id) {
      // 404 instead of 403: don't confirm the existence of someone else's report.
      res.status(404).json({ error: "Report not found" });
      return;
    }

    res.json(
      GetReportResponse.parse({
        id: report.id,
        scanId: report.scanId,
        userId: report.userId,
        targetUrl: report.targetUrl,
        tier: report.tier,
        scannedAt: report.scannedAt,
        duration: report.duration ?? null,
        createdAt: report.createdAt,
        data: report.data,
      }),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch report");
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

export default router;
