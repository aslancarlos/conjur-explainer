import CertificateFlow from '../../components/flow/specs/sm/CertificateFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/conjur-cloud/venafi-cert-issuer.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/developer/conjur-api-cc-get-cert.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/developer/conjur_api_issuer-ephemerals.htm',
]

/** Secrets Manager capabilities: X.509 certificates through the Certificate Manager issuer (SaaS only). */
export default function CertificatesPage() {
  return <CloudAuthnPage ns="sm_certs" Flow={CertificateFlow} saas selfHosted={false} docs={DOCS} />
}
