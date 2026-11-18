import { VARIANT_PRIOR, variantFeatures } from "./generator";
import type {
  FeedbackEvent,
  SiteSpec,
  Variant,
  VariantFeatures,
} from "./types";

const FEATURE_KEYS: Array<keyof VariantFeatures> = [
  "heroLayout",
  "cardStyle",
  "headingFont",
  "paletteId",
  "mode",
];

/** Maximum adjustment feedback may add to a variant's prior score. */
const MAX_LEARNED_BONUS = 0.35;

function eventWeight(event: FeedbackEvent): number {
  switch (event.action) {
    case "select":
      return 1;
    case "export":
      return 1.5;
    case "rate":
      return ((event.rating ?? 3) - 3) / 2;
    default:
      return 0;
  }
}

export interface RankedVariant {
  variant: Variant;
  score: number;
}

/**
 * Baseline learner: scores each design feature value by the feedback it has
 * received for the same site type, then adds a bounded bonus to a fixed prior.
 * It keeps the same interface a trained model (e.g. gradient-boosted trees)
 * would use, so it can be swapped out once enough data exists.
 */
export function rankVariants(
  variants: Variant[],
  spec: Pick<SiteSpec, "type">,
  events: FeedbackEvent[],
): RankedVariant[] {
  const relevant = events.filter((e) => e.siteType === spec.type);

  const ranked = variants.map((variant) => {
    const features = variantFeatures(variant);
    let total = 0;
    for (const key of FEATURE_KEYS) {
      const evidence = relevant
        .filter((e) => e.features?.[key] === features[key])
        .reduce((sum, e) => sum + eventWeight(e), 0);
      total += Math.tanh(evidence / 3);
    }
    const bonus = (total / FEATURE_KEYS.length) * MAX_LEARNED_BONUS;
    return { variant, score: VARIANT_PRIOR[variant.id] + bonus };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
