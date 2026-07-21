# pcloud-proxy

Stateless proxy in front of the CyberArk Privilege Cloud REST API for the
`/pcloud` vault-admin tool on demo.minha.cloud.

- The browser only talks to the same-origin `/api/pcloud` path (this ingress).
- The proxy resolves the tenant's real URLs at runtime from the public
  [platform discovery service](https://platform-discovery.cyberark.cloud) given
  only the tenant subdomain — no hostnames are baked into the image or git.
- It stores nothing: the user's platform token is passed per-request via the
  `X-Pcloud-Token` header and forwarded as a Bearer token.
- Only the safes in `ALLOWED_SAFES` may be read or written.

## Required Secret (created out-of-band — not in git)

The tenant subdomain is infrastructure-specific, so it lives in a Secret rather
than in the committed Deployment:

```bash
kubectl create secret generic pcloud-proxy-config -n conjur \
  --from-literal=subdomain=<your-tenant-subdomain> \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Deploy

```bash
docker build --platform linux/amd64 -t aslancarlos/pcloud-proxy:latest pcloud-proxy/
docker push aslancarlos/pcloud-proxy:latest
kubectl apply -f k8s/pcloud-proxy/
kubectl rollout restart deployment/pcloud-proxy -n conjur
kubectl rollout status  deployment/pcloud-proxy -n conjur
```

## Endpoints (all under `/api/pcloud`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/logon` | Exchange user/password for a platform token |
| GET  | `/accounts?safe=` | List accounts in an allowed safe |
| POST | `/accounts` | Create an account |
| GET  | `/accounts/{id}` | Account details |
| POST | `/accounts/{id}/rotate` | Trigger immediate CPM change |
| POST | `/accounts/{id}/reveal` | Retrieve the secret value |
| GET  | `/platforms` | List active platforms |
| GET  | `/config` | Allowed safes |
