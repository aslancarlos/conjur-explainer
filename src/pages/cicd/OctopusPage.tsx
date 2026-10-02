import CiOidcPage from './CiOidcPage'
import OctopusFlow from '../../components/flow/specs/cicd/OctopusFlow'

/** /cicd/octopus: Octopus Deploy fetches secrets with the Retrieve Secrets (JWT) step template over OIDC (authn-jwt). */
export default function OctopusPage() {
  return (
    <CiOidcPage ns="ci_octopus" Flow={OctopusFlow} saas selfHosted docs={[
      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/octopus.htm',
      'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/octopus.htm',
      'https://github.com/cyberark/conjur-octopus-deploy',
      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm',
    ]} />
  )
}
