# gha-runner

Small Go proxy that lets the conjur-explainer UI dispatch the
`aslancarlos/workshop-action` workflow and poll its status. The
backing source is in `../../gha-runner/`.

## Endpoints

| Method | Path                    | Purpose                                          |
|--------|-------------------------|--------------------------------------------------|
| GET    | `/api/gha/healthz`      | liveness/readiness                               |
| POST   | `/api/gha/run`          | dispatch the workflow, returns `{run_id, …}`     |
| GET    | `/api/gha/runs/:id`     | returns `{run, jobs[{steps[…]}]}`                |

## Rate limits

- Per IP: 1 trigger per 10 minutes (in-memory, reset on restart).
- Global: 20 runs per UTC day.

## Required secret

The Deployment expects a Secret called `gha-runner-token` with a single
key `token` containing a **fine-grained PAT** with these permissions on
`aslancarlos/workshop-action`:

- **Actions: Read and write**
- **Metadata: Read-only** (added automatically)

Create it with:

```bash
kubectl create secret generic gha-runner-token \
  -n conjur \
  --from-literal=token=ghp_xxx
```

## Apply

```bash
kubectl apply -f k8s/gha-runner/deployment.yaml
kubectl apply -f k8s/gha-runner/service.yaml
kubectl apply -f k8s/gha-runner/ingress.yaml
```

The Ingress puts the service at `https://demo.minha.cloud/api/gha/*`.
Path `/api/gha` is more specific than `/` so the existing
`conjur-explainer` ingress still serves everything else.
