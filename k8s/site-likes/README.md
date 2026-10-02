# site-likes

The "Like" button in the top bar of demo.minha.cloud. Source in `site-likes/`.

- `GET /api/likes` returns `{"likes": N}`; `POST /api/likes` adds one.
- Only requests with `Origin: https://demo.minha.cloud` can like; one like per
  client IP every 12 h; at most 500 accepted likes per UTC day.
- The total is kept in ConfigMap `conjur/site-likes` (key `count`). The service
  account can only `get`/`patch` that one ConfigMap.

## Deploy (one time)

```bash
docker build --platform linux/amd64 -t aslancarlos/site-likes:1.0.0 site-likes/
docker push aslancarlos/site-likes:1.0.0

# create the counter ONCE (fails harmlessly if it already exists)
kubectl -n conjur create configmap site-likes --from-literal=count=0
kubectl apply -f k8s/site-likes/site-likes.yaml
kubectl -n conjur rollout status deployment/site-likes
curl -s https://demo.minha.cloud/api/likes
```

Re-applying `site-likes.yaml` is safe: the ConfigMap is not declared there, so
the count is never reset. To read or fix the count by hand:
`kubectl -n conjur get configmap site-likes -o jsonpath='{.data.count}'`.
