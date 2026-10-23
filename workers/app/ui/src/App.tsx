// One page: pick an organisation, then build queries on its bookings.
// Switching organisation should change every number: tenants are kept apart by the cube.
import { useState } from 'react'
import { AnalysisBuilder, CubeProvider } from 'drizzle-cube/client'

const ORGS = ['remy', 'org-a', 'org-b']
// enableAI needs /api/ai routes this Worker doesn't serve.
const features = { useAnalysisBuilder: true, enableAI: false }

export function App() {
  const [org, setOrg] = useState(ORGS[0])
  return (
    <>
      <header className="bar">
        <strong>basin-cube</strong>
        <span className="muted">drizzle-cube on D1</span>
        <nav className="orgs" aria-label="Organisation">
          {ORGS.map((o) => (
            <button key={o} aria-pressed={o === org} onClick={() => setOrg(o)}>{o}</button>
          ))}
        </nav>
      </header>
      {/* key: a new provider per organisation, so no cached results leak across tenants */}
      <CubeProvider key={org} apiOptions={{ apiUrl: '/cubejs-api/v1', headers: { 'x-organisation-id': org } }} features={features}>
        <main>
          <AnalysisBuilder maxHeight="calc(100vh - 72px)" />
        </main>
      </CubeProvider>
    </>
  )
}
