import axe from "axe-core";

/**
 * Runs axe on a rendered container and returns one line per violated rule (`rule: help (n nodes)`),
 * so a failing test names the rule. Color contrast is off: jsdom computes no layout or colors, so
 * axe cannot judge it there. The contrast of the token pairs is checked by calculation and recorded
 * in .docs/DESIGN_SYSTEM.md.
 */
export async function accessibilityViolations(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`,
  );
}
