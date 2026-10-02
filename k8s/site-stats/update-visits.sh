#!/usr/bin/env bash
# Publishes the demo.minha.cloud access counter shown in the top bar.
#
# Source: AWS CloudWatch, metric NewFlowCount of the ingress NLB (new client
# connections), summed since the NLB was created. About 99.8% of the NLB
# traffic is demo.minha.cloud (the rest is airs-idira / teste15), and the
# number counts connections, not unique people.
#
# Output: ConfigMap conjur/site-stats, key visits.json, mounted by the
# conjur-explainer Deployment at /usr/share/nginx/html/stats/ and served as
# https://demo.minha.cloud/stats/visits.json.
#
# Runs hourly from the jumpserver crontab (pods have no AWS credentials):
#   17 * * * * $HOME/site-stats/update-visits.sh >> $HOME/site-stats/update.log 2>&1
set -euo pipefail
export PATH="/usr/local/bin:/snap/bin:/usr/bin:/bin"

REGION=sa-east-1
LB="net/k8s-ingressn-nginxint-7ac4e44418/35e3037f669744c9"   # change if the NLB is recreated
SINCE="2026-05-20T00:00:00Z"                                 # NLB creation day
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

total="$(aws cloudwatch get-metric-statistics --region "$REGION" \
  --namespace AWS/NetworkELB --metric-name NewFlowCount \
  --dimensions "Name=LoadBalancer,Value=$LB" \
  --start-time "$SINCE" --end-time "$NOW" --period 86400 --statistics Sum \
  --query 'sum(Datapoints[].Sum)' --output text)"
total="${total%.*}"
[[ "$total" =~ ^[0-9]+$ ]] || { echo "$NOW bad total: $total" >&2; exit 1; }

json="{\"accesses\":$total,\"since\":\"${SINCE%%T*}\",\"updated\":\"$NOW\",\"source\":\"aws-nlb-newflowcount\"}"
kubectl -n conjur create configmap site-stats --from-literal=visits.json="$json" \
  --dry-run=client -o yaml | kubectl apply -f - >/dev/null
echo "$NOW accesses=$total"
