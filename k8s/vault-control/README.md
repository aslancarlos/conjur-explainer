# vault-control (Cofre Info backend)

Backs the **Cofre Info** page (`/vault`, Resources > Tools) at `/api/vault`.

## Identity: JWT only, no static secret

```
pod service account vault-control (projected token, audience conjur)
  -> Conjur authn-jwt/<service-id> (workload host for this service account, no API key)
  -> data/vault/<safe>/<api-account>/{username,password}   (synced from the Vault)
  -> Identity oauth2/platformtoken (client_credentials, OAuth confidential client)
  -> Privilege Cloud API, one Safe only
```

The Conjur host needs `read` + `execute` on the API account variables only, and
membership in the authenticator's consumers group.

## Configuration

Tenant, Safe and credential path come from the ConfigMap `vault-control-config`,
which is applied from outside Git (this repository is public). See
`vault-control-config.example.yaml` for the keys. The service refuses to start
when a key is missing.

## Endpoints

| Method | Path | What |
|---|---|---|
| GET | `/api/vault/chain` | Checks each hop of the chain (no secret in the answer) |
| GET | `/api/vault/accounts` | Accounts of the Safe, metadata only (15 s cache) |
| GET | `/api/vault/accounts/{id}` | One account + current, current-1, current-2 version metadata |
| POST | `/api/vault/accounts/{id}/rotate` | CPM change now. Exact `Origin` + `X-Cofre-Info: 1`; 1/min per IP, 40/day; the API account itself is refused |

No secret value of the Safe is ever retrieved: the history shows version metadata
and the page masks the value.

## Deploy

```bash
docker build --platform linux/amd64 -t aslancarlos/vault-control:<ver> vault-control/
docker push aslancarlos/vault-control:<ver>
kubectl apply -f <private path>/vault-control-config.yaml
kubectl apply -f k8s/vault-control/vault-control.yaml
```

Distroless runs as UID 65532: `runAsUser` must be numeric because of `runAsNonRoot`.
