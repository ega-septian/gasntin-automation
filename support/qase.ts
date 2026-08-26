interface QaseAnnotationOption {
  annotation: { type: string; description: string }
}

/**
 * Links a test to its Qase case ID via Playwright's native annotation,
 * which playwright-qase-reporter reads to sync results back to Qase —
 * without polluting the test title with a "[GASNTIN-N]" prefix.
 */
export function qaseId(id: number | string): QaseAnnotationOption {
  return { annotation: { type: 'QaseID', description: String(id) } }
}
