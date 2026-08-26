import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

const QASE_API_BASE = 'https://api.qase.io/v1'

/**
 * Marks a Qase case's automation status as automated once its automation
 * has actually proven itself by passing — a case that fails still needs a
 * human to confirm the automation (not the app) is what's broken, so it's
 * left as manual until then.
 */
export default class QaseAutomationReporter implements Reporter {
  private passedCaseIds = new Set<string>()

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== 'passed') return

    for (const annotation of test.annotations) {
      if (annotation.type !== 'QaseID' || !annotation.description) continue
      for (const id of annotation.description.split(',').map((part) => part.trim())) {
        if (id) this.passedCaseIds.add(id)
      }
    }
  }

  async onEnd(): Promise<void> {
    if (this.passedCaseIds.size === 0) return

    const token = process.env.QASE_API_TOKEN
    const projectCode = process.env.QASE_PROJECT_CODE
    if (!token || !projectCode) return

    const outcomes = await Promise.allSettled(
      [...this.passedCaseIds].map(async (id) => {
        const response = await fetch(`${QASE_API_BASE}/case/${projectCode}/${id}`, {
          method: 'PATCH',
          headers: { Token: token, 'Content-Type': 'application/json' },
          // The API rejects a JSON boolean here ("Allowed values: 0, 1") —
          // isManual must be sent as an integer, 0 meaning "not manual".
          body: JSON.stringify({ isManual: 0 }),
        })
        if (!response.ok) {
          throw new Error(`case ${id}: ${response.status} ${await response.text()}`)
        }
      })
    )

    const failures = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected')
    if (failures.length > 0) {
      console.warn(
        `[qase-automation-reporter] Failed to mark ${failures.length} case(s) as automated:\n` +
          failures.map((f) => `  - ${f.reason}`).join('\n')
      )
    }
  }
}
