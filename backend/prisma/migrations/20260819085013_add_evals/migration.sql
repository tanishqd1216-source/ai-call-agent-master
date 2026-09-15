-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'baseline',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "promptVersionId" TEXT NOT NULL,
    "judgeModel" TEXT NOT NULL,
    "agentModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "caseLabel" TEXT,
    "caseType" TEXT,
    "verdict" TEXT NOT NULL,
    "violatedRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "judgeReasoning" TEXT,
    "transcript" TEXT NOT NULL,
    "turnCount" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptVersion_direction_idx" ON "PromptVersion"("direction");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_direction_promptHash_key" ON "PromptVersion"("direction", "promptHash");

-- CreateIndex
CREATE INDEX "EvalRun_direction_idx" ON "EvalRun"("direction");

-- CreateIndex
CREATE INDEX "EvalRun_promptVersionId_idx" ON "EvalRun"("promptVersionId");

-- CreateIndex
CREATE INDEX "EvalResult_runId_idx" ON "EvalResult"("runId");

-- CreateIndex
CREATE INDEX "EvalResult_verdict_idx" ON "EvalResult"("verdict");

-- AddForeignKey
ALTER TABLE "EvalRun" ADD CONSTRAINT "EvalRun_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "PromptVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvalResult" ADD CONSTRAINT "EvalResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EvalRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
