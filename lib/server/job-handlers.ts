import { registerFailureHook, registerJobHandler } from "./jobs";
import { markGenerationFailed, runGeneration } from "./generation";
import { markEvaluationFailed, runEvaluation } from "./evaluation";

// Wires job types to their handlers. Imported once at server start (instrumentation.ts).
registerJobHandler("GENERATE_ASSIGNMENT", async (p) => runGeneration(String(p.assignmentId)));
registerFailureHook("GENERATE_ASSIGNMENT", async (p, error) => markGenerationFailed(String(p.assignmentId), error));

registerJobHandler("EVALUATE_SUBMISSION", async (p) => runEvaluation(String(p.submissionId)));
registerFailureHook("EVALUATE_SUBMISSION", async (p, error) => markEvaluationFailed(String(p.submissionId), error));
