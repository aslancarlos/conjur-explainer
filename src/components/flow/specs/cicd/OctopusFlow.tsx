import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Fingerprint, Rocket, ServerCog, Variable } from 'lucide-react'
import FlowPlayer from '../../FlowPlayer'
import { buildCiOidcSpec } from './ciOidcSpec'

/**
 * Octopus Deploy + "Retrieve Secrets (JWT)" step template: a Generic OIDC
 * account (aud = conjur) issues a JWT whose `sub` is space:project:environment;
 * authn-jwt maps it to a workload in data/octopus-apps and the step publishes
 * each secret as an output variable for the following steps.
 */
export default function OctopusFlow() {
  const { t } = useTranslation()
  const spec = useMemo(() => buildCiOidcSpec(t, {
    id: 'ci-octopus', ns: 'ci_octopus',
    IdpIcon: Fingerprint, JobIcon: ServerCog, OutIcon: Variable, TargetIcon: Rocket,
    smSub: 'authn-jwt/octopus', hostSub: 'data/octopus-apps/{sub}', claim: 'sub',
    labels: { idp: 'Generic OIDC · aud = conjur', jwks: '{company}.octopus.app/.well-known/jwks', authn: 'POST …/authn-jwt/octopus/conjur/authenticate' },
  }), [t])
  return <FlowPlayer spec={spec} />
}
