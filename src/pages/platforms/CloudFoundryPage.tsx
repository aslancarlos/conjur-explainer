import CloudFoundryFlow from '../../components/flow/specs/platforms/CloudFoundryFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/cloud-foundry.html',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu-service-broker.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu-install-service-broker.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu-use-conjur-service-broker.htm',
  'https://github.com/cyberark/conjur-service-broker',
  'https://github.com/cyberark/cloudfoundry-conjur-buildpack',
]

/** Platforms: Cloud Foundry and VMware Tanzu (Service Broker + Buildpack). Self-Hosted only. */
export default function CloudFoundryPage() {
  return <CloudAuthnPage ns="pf_cf" Flow={CloudFoundryFlow} saas={false} selfHosted docs={DOCS} />
}
