FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/site-likes .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/site-likes /site-likes
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/site-likes"]
