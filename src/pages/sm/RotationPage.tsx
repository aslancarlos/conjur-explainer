import RotationFlow from '../../components/flow/specs/sm/RotationFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_addaccount.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-static-secrets.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cc_dual-accounts-link.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/rotate-secrets.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/rotation-secrets.html',
]

/** Secrets Manager capabilities: secret rotation (PAM CPM + sync; local rotators on Self-Hosted). */
export default function RotationPage() {
  return <CloudAuthnPage ns="sm_rotation" Flow={RotationFlow} saas selfHosted docs={DOCS} />
}
