import AwsIamFlow from '../../components/flow/specs/authn/AwsIamFlow'
import CloudAuthnPage from './CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-overview.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-config.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-appid.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/aws_iam_authenticator.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authn-lp.htm',
]

/** Authentication methods: AWS IAM authenticator (authn-iam). */
export default function AwsIamAuthnPage() {
  return <CloudAuthnPage ns="authn_aws" Flow={AwsIamFlow} saas selfHosted docs={DOCS} />
}
