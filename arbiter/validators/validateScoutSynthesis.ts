import Ajv from "ajv";
import schema from "../contracts/scout.v1.schema.json";

type ScoutContractViolationError = {
  type: "SCOUT_CONTRACT_VIOLATION";
  errors: Array<{ message: string; path?: string; keyword?: string }>;
};

const ajv = new Ajv({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

const toViolation = (
  errors: Array<{ message: string; path?: string; keyword?: string }>
): ScoutContractViolationError => ({
  type: "SCOUT_CONTRACT_VIOLATION",
  errors
});

export function validateScoutSynthesis(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if ("failureMode" in record && "recommendation" in record) {
      throw toViolation([
        {
          message: "failureMode and recommendation cannot both be present",
          path: "/",
          keyword: "conflict"
        }
      ]);
    }
  }

  const ok = validate(payload);
  if (!ok) {
    const errors = (validate.errors || []).map((error) => ({
      message: error.message || "schema validation failed",
      path: error.instancePath || undefined,
      keyword: error.keyword
    }));
    throw toViolation(errors);
  }

  const value = payload as {
    candidates?: Array<{ id?: string }>;
    recommendation?: { candidateId?: string };
    failureMode?: unknown;
  };

  if (!value.failureMode && value.candidates && value.candidates.length > 0) {
    const candidateId = value.recommendation?.candidateId;
    if (candidateId) {
      const matches = value.candidates.some((candidate) => candidate.id === candidateId);
      if (!matches) {
        throw toViolation([
          {
            message: "recommendation.candidateId must reference an existing candidate",
            path: "/recommendation/candidateId",
            keyword: "reference"
          }
        ]);
      }
    }
  }

  return payload;
}

export type { ScoutContractViolationError };
