FROM node:22-alpine AS web-builder
WORKDIR /web

RUN corepack enable

COPY web/package.json web/pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm build


FROM golang:1.26-alpine AS builder
WORKDIR /src

RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

COPY --from=web-builder /static ./static

ARG VERSION=0.0.1
ARG TARGETOS=linux
ARG TARGETARCH=amd64
ARG TARGETVARIANT

RUN export GOARM="" && \
    if [ -n "${TARGETVARIANT}" ]; then GOARM="${TARGETVARIANT#v}"; fi && \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} GOARM=${GOARM} \
    go build -trimpath \
    -ldflags="-s -w -X main.version=${VERSION}" \
    -o /out/mediaplay-${VERSION}-${TARGETOS}-${TARGETARCH}${TARGETVARIANT:+-${TARGETVARIANT}} ./cmd



FROM scratch AS export
COPY --from=builder /out/ /