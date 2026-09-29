FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/pcloud-proxy .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/pcloud-proxy /pcloud-proxy
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/pcloud-proxy"]
