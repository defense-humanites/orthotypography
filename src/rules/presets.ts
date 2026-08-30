import { NUMERIC_PROTECTION_RULE } from "../classify/runtime.ts";
import type { RuntimeRule } from "../model.ts";
import {
  EURO_SPACING_RULE,
  PERCENTAGE_SPACING_RULE,
  UNIT_SPACING_RULE,
} from "./numeric.ts";
import {
  HIGH_PUNCTUATION_RULES,
  SAFE_PUNCTUATION_RULES,
} from "./punctuation.ts";
import { FRENCH_GUILLEMETS_SPACING_RULE } from "./quotes.ts";

/** Current executable subset of the Imprimerie nationale preset. */
export const IMPRIMERIE_NATIONALE_RULES: readonly RuntimeRule[] = [
  NUMERIC_PROTECTION_RULE,
  FRENCH_GUILLEMETS_SPACING_RULE,
  ...SAFE_PUNCTUATION_RULES,
  ...HIGH_PUNCTUATION_RULES,
  PERCENTAGE_SPACING_RULE,
  UNIT_SPACING_RULE,
  EURO_SPACING_RULE,
] as const;
