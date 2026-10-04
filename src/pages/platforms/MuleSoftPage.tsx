import MuleSoftFlow from '../../components/flow/specs/platforms/MuleSoftFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/mulesoft.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/mulesoft.htm',
  'https://github.com/cyberark/conjur-mulesoft-connector',
  'https://mvnrepository.com/artifact/com.cyberark/conjur-mule-connector',
]

/** Platforms: MuleSoft Connector (API key). */
export default function MuleSoftPage() {
  return <CloudAuthnPage ns="pf_mulesoft" Flow={MuleSoftFlow} saas selfHosted docs={DOCS} />
}
