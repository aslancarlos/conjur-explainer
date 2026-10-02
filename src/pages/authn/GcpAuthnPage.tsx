import GcpFlow from '../../components/flow/specs/authn/GcpFlow'
import CloudAuthnPage from './CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-lp.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-config.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-appid.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/developer/conjur_api_gcp_authenticator.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/cjr-gcp-authn.htm',
]

/** Authentication methods: GCP authenticator (authn-gcp). */
export default function GcpAuthnPage() {
  return <CloudAuthnPage ns="authn_gcp" Flow={GcpFlow} saas selfHosted docs={DOCS} />
}
