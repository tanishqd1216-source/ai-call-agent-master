-- DropForeignKey
ALTER TABLE "EvalResult" DROP CONSTRAINT "EvalResult_runId_fkey";

-- DropForeignKey
ALTER TABLE "EvalRun" DROP CONSTRAINT "EvalRun_promptVersionId_fkey";

-- DropTable
DROP TABLE "EvalResult";

-- DropTable
DROP TABLE "EvalRun";

-- DropTable
DROP TABLE "PromptVersion";

