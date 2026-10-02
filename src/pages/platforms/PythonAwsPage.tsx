import PythonAwsFlow from '../../components/flow/specs/platforms/PythonAwsFlow'
import CloudAuthnPage from '../authn/CloudAuthnPage'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/python.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/python.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/aws-iam-python.htm',
  'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/aws-iam-python.htm',
  'https://github.com/cyberark/conjur-api-python',
  'https://github.com/cyberark/conjur-authn-iam-client-python',
]

/** Platforms: Python SDK and the AWS IAM client for Python. */
export default function PythonAwsPage() {
  return <CloudAuthnPage ns="pf_python" Flow={PythonAwsFlow} saas selfHosted docs={DOCS} />
}
