# syntax=docker/dockerfile:1

FROM golang:1.25-alpine AS build
WORKDIR /src

RUN apk add --no-cache ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=0
RUN go build -trimpath -ldflags="-s -w" -o /out/backend .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/backend /app/backend
EXPOSE 6137
ENTRYPOINT ["/app/backend"]
