import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Braces, Fingerprint, Rocket, Workflow } from 'lucide-react'
import FlowPlayer from '../../FlowPlayer'
import { buildCiOidcSpec } from './ciOidcSpec'

/**
 * CircleCI + conjur orb: the job's CircleCI OIDC token (aud = organization ID)
 * is traded at authn-jwt (oidc.circleci.com/project-id -> workload in
 * data/circleci-apps, annotated with the full `sub`), then retrieve_secret
 * exports each secret as an environment variable for the job.
 */
export default function CircleCiFlow() {
  const { t } = useTranslation()
  const spec = useMemo(() => buildCiOidcSpec(t, {
    id: 'ci-circleci', ns: 'ci_circleci',
    IdpIcon: Fingerprint, JobIcon: Workflow, OutIcon: Braces, TargetIcon: Rocket,
    smSub: 'authn-jwt/circle-ci', hostSub: 'data/circleci-apps/{project-id}', claim: 'sub',
    labels: { idp: 'oidc.circleci.com/org/{org-id}', jwks: 'jwks-pub.json · aud = org-id', authn: 'POST …/authn-jwt/circle-ci/conjur/authenticate' },
  }), [t])
  return <FlowPlayer spec={spec} />
}
