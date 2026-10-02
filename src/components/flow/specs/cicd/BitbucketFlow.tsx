import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileLock, Fingerprint, GitBranch, Rocket } from 'lucide-react'
import FlowPlayer from '../../FlowPlayer'
import { buildCiOidcSpec } from './ciOidcSpec'

/**
 * Bitbucket Pipelines + conjur-bitbucket-pipe: a step with `oidc: true` gets
 * a Bitbucket OIDC token, the pipe trades it at authn-jwt (repositoryUuid ->
 * workload in data/bitbucket-pipes), fetches the listed secrets and writes
 * .secrets/secrets.env; load_secrets.sh exports them and deletes the file.
 */
export default function BitbucketFlow() {
  const { t } = useTranslation()
  const spec = useMemo(() => buildCiOidcSpec(t, {
    id: 'ci-bitbucket', ns: 'ci_bitbucket',
    IdpIcon: Fingerprint, JobIcon: GitBranch, OutIcon: FileLock, TargetIcon: Rocket,
    smSub: 'authn-jwt/bitbucket', hostSub: 'data/bitbucket-pipes/{repositoryUuid}', claim: 'repositoryUuid',
    labels: { idp: 'oidc: true', jwks: 'api.bitbucket.org · keys.json', authn: 'POST …/authn-jwt/bitbucket/conjur/authenticate' },
  }), [t])
  return <FlowPlayer spec={spec} />
}
