FROM golang:1.19-alpine

WORKDIR /usr/src/app

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY . .

RUN go build -o main

CMD ["./main"]
