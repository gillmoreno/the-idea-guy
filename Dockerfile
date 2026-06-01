# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM golang:1.22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/go.mod ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /the-idea-guy-api ./cmd/server

FROM nginx:1.27-alpine
RUN apk add --no-cache ca-certificates

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /app/frontend/out /usr/share/nginx/html
COPY --from=backend-build /the-idea-guy-api /usr/local/bin/the-idea-guy-api
COPY backend/data /app/data
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV API_ADDR=:8080
ENV CONTENT_DIR=/app/data
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
