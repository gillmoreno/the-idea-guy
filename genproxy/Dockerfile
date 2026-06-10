FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY *.go prompt.txt ./
RUN CGO_ENABLED=0 go build -o /genproxy .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=build /genproxy /usr/local/bin/genproxy
EXPOSE 4600
ENTRYPOINT ["genproxy"]
