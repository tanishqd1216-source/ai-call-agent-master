import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import {
  createEvalRunSchema,
  evalResultSchema,
  completeEvalRunSchema,
} from "../lib/schemas.js";

export const evalsRouter = Router();

// Unauthenticated, matching the existing precedent: /api/events and /api/calls*
// have no auth either — only /departments*, /integrations*, /auth/* do.

evalsRouter.post("/evals/runs", async (req, res) => {
  const parsed = createEvalRunSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, "rejected malformed eval run");
    return res.status(400).json({ error: "invalid eval run", issues: parsed.error.issues });
  }
  const { direction, label, promptHash, promptText, source, judgeModel, agentModel } = parsed.data;

  try {
    const promptVersion = await prisma.promptVersion.upsert({
      where: { direction_promptHash: { direction, promptHash } },
      update: {},
      create: { direction, label, promptHash, promptText, source },
    });
    const run = await prisma.evalRun.create({
      data: {
        direction,
        promptVersionId: promptVersion.id,
        judgeModel,
        agentModel,
      },
    });
    res.status(201).json({ runId: run.id, promptVersionId: promptVersion.id });
  } catch (err) {
    logger.error({ err }, "failed to create eval run");
    res.status(500).json({ error: "failed to create eval run" });
  }
});

evalsRouter.post("/evals/runs/:runId/results", async (req, res) => {
  const parsed = evalResultSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, "rejected malformed eval result");
    return res.status(400).json({ error: "invalid eval result", issues: parsed.error.issues });
  }
  try {
    const result = await prisma.evalResult.create({
      data: { runId: req.params.runId, ...parsed.data },
    });
    res.status(201).json({ id: result.id });
  } catch (err) {
    logger.error({ err, runId: req.params.runId }, "failed to persist eval result");
    res.status(500).json({ error: "failed to persist eval result" });
  }
});

evalsRouter.post("/evals/runs/:runId/complete", async (req, res) => {
  const parsed = completeEvalRunSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid payload", issues: parsed.error.issues });
  }
  try {
    const run = await prisma.evalRun.update({
      where: { id: req.params.runId },
      data: { status: parsed.data.status, completedAt: new Date() },
    });
    res.json({ ok: true, run });
  } catch (err) {
    logger.error({ err, runId: req.params.runId }, "failed to complete eval run");
    res.status(500).json({ error: "failed to complete eval run" });
  }
});

const listQuerySchema = z.object({
  direction: z.enum(["inbound", "outbound"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

evalsRouter.get("/evals/runs", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid query", issues: parsed.error.issues });
  }
  const { direction, limit, offset } = parsed.data;

  try {
    const [runs, total] = await Promise.all([
      prisma.evalRun.findMany({
        where: { direction },
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          promptVersion: true,
          _count: { select: { results: true } },
        },
      }),
      prisma.evalRun.count({ where: { direction } }),
    ]);

    // Server-computed pass rate per run, not left to the client to derive.
    const runsWithStats = await Promise.all(
      runs.map(async (run) => {
        const passCount = await prisma.evalResult.count({ where: { runId: run.id, verdict: "PASS" } });
        const totalResults = run._count.results;
        return {
          ...run,
          passCount,
          totalResults,
          passRate: totalResults > 0 ? passCount / totalResults : null,
        };
      }),
    );

    res.json({ runs: runsWithStats, total, limit, offset });
  } catch (err) {
    logger.error({ err }, "failed to list eval runs");
    res.status(500).json({ error: "failed to list eval runs" });
  }
});

evalsRouter.get("/evals/runs/:runId", async (req, res) => {
  try {
    const run = await prisma.evalRun.findUnique({
      where: { id: req.params.runId },
      include: {
        promptVersion: true,
        results: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!run) {
      return res.status(404).json({ error: "eval run not found" });
    }
    res.json(run);
  } catch (err) {
    logger.error({ err, runId: req.params.runId }, "failed to load eval run detail");
    res.status(500).json({ error: "failed to load eval run" });
  }
});
