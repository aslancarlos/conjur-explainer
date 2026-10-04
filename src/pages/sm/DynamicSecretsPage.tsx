import DynamicSecretFlow from '../../components/flow/specs/sm/DynamicSecretFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/dynamic-secrets-aws.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/dynamic-secrets-gcp.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-dynamic-secrets.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-issuers.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/dynamic-secrets-aws.htm',
]

/** Secrets Manager capabilities: dynamic (just-in-time) secrets. */
export default function DynamicSecretsPage() {
  return <CloudAuthnPage ns="sm_dynamic" Flow={DynamicSecretFlow} saas selfHosted docs={DOCS} />
}
