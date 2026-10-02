import AzureFlow from '../../components/flow/specs/authn/AzureFlow'
import CloudAuthnPage from './CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-overview.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-config.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-appid.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/developer/conjur_api_azure_authenticator.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/azure_authn.htm',
]

/** Authentication methods: Azure authenticator (authn-azure). */
export default function AzureAuthnPage() {
  return <CloudAuthnPage ns="authn_azure" Flow={AzureFlow} saas selfHosted docs={DOCS} />
}
