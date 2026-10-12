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
| GET | `/api/vault/accounts/{id}` | One account + version history (`validFrom`/`validUntil`, ISO 8601 UTC). Dual Account: also `pair` (Active and Inactive member, `since` when known) and `pairTimeline` (both members merged, `inUse` on the version the application gets) |
| POST | `/api/vault/accounts/{id}/rotate` | Exact `Origin` + `X-Cofre-Info: 1`; 1/min per IP, 40/day; the API account itself is refused. Simple account: Central Policy Manager change now. Dual Account: 202 with `rotationId`; the pair rotates in the background (see below) |
| POST | `/api/vault/presence` | Heartbeat `{"id":"<uuid of the browser tab>"}` (exact `Origin` + `X-Cofre-Info: 1`). Answers `online` (tabs seen in the last 60 s), `rotation` (running, or ended in the last 2 minutes) and `now`. Only the id and its last-seen time are kept (max 5000); one counted beat per id per 10 s; per IP at most 30 new ids and 120 beats a minute (the IP lives only in that one-minute counter) |
| GET | `/api/vault/presence` | Same answer, read only (used every 4 s while a rotation runs) |
| GET | `/api/vault/rotations/{rotationId}` | Step of a pair rotation: `solicitada`, `trocando_senha`, `promovendo`, `concluida` or `falhou` (`errorCode`, `reason`), with the time of each step, `deadline` and `serverTime` |

### Dual Account rotation

The demo pair uses the plain MySQL platform, so the Central Policy Manager
changes passwords but never flips `DualAccountStatus`. The service rotates the
pair itself, whichever member was asked:

1. `POST /Accounts/{inactive}/Change/`;
2. read `GET /Accounts/{inactive}/` until `secretManagement.lastModifiedTime`
   moves and `status` is `success` (`CPM_TIMEOUT`, default 5 minutes; a
   `failure` or the timeout stops here and the statuses are left alone);
3. `PATCH` `DualAccountStatus`: the rotated member to `Active`, then the other
   to `Inactive` (undone if the second call fails).

Step 3 needs the Safe permission **Update account properties** for the API
account; without it the rotation ends as `promote_forbidden`. A pair must have
exactly one `Active` and one `Inactive` member, otherwise the request gets 409
(`dual_status_ambiguous`, `dual_pair_size`). Rotations are kept in memory (last 50).

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
