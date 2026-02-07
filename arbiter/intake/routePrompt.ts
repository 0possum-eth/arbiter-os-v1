import {
  AMBIGUOUS_START_PROMPT,
  EXPLICIT_ROUTE_BYPASS_TEMPLATE,
  ONE_SENTENCE_PROMPT
} from "./promptCopy";

type BuildRoutePromptInput = {
  shouldPrompt: boolean;
  hasOneSentenceGoal: boolean;
  explicitRouteBypass?: string;
  promptedInRun: boolean;
  routeFailed?: boolean;
  prerequisitesChanged?: boolean;
};

const shouldSuppressReprompt = (input: BuildRoutePromptInput) =>
  input.promptedInRun && !input.routeFailed && !input.prerequisitesChanged;

export const buildRoutePrompt = (input: BuildRoutePromptInput): string | null => {
  if (input.explicitRouteBypass) {
    return EXPLICIT_ROUTE_BYPASS_TEMPLATE.replace("<selected-route>", input.explicitRouteBypass);
  }

  if (!input.shouldPrompt) {
    return null;
  }

  if (shouldSuppressReprompt(input)) {
    return null;
  }

  return input.hasOneSentenceGoal ? ONE_SENTENCE_PROMPT : AMBIGUOUS_START_PROMPT;
};

export type { BuildRoutePromptInput };
