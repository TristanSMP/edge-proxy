package main

import (
	"log"
	"net"
	"os"

	"github.com/google/uuid"
)

var CONN_PORT = "8081"
var DEST_HOST = "localhost"
var DEST_PORT = "25565"
var CLIENTS = make(map[uuid.UUID]net.Conn)

func main() {
	l, err := net.Listen("tcp", "0.0.0.0"+":"+CONN_PORT)

	if err != nil {
		panic(err)
	}

	log.Print("> edge-proxy started")
	log.Printf("? listening on %s", CONN_PORT)
	log.Printf("? forwarding to %s:%s", DEST_HOST, DEST_PORT)

	defer l.Close()

	for {
		conn, err := l.Accept()
		if err != nil {
			panic(err)
		}

		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	uuid := uuid.New()

	CLIENTS[uuid] = conn
	log.Printf("[%s] connected (%s), %d clients connected", uuid, conn.RemoteAddr(), len(CLIENTS))

	defer func() {
		conn.Close()
		delete(CLIENTS, uuid)
		log.Printf("[%s] disconnected (%s), %d clients connected", uuid, conn.RemoteAddr(), len(CLIENTS))
	}()

	destConn, err := net.Dial("tcp", DEST_HOST+":"+DEST_PORT)

	if err != nil {
		conn.Close()
		return
	}

	go func() {

		defer func() {
			conn.Close()
			delete(CLIENTS, uuid)
			destConn.Close()
		}()

		buf := make([]byte, 1024)

		for {
			n, err := conn.Read(buf)

			if err != nil {
				return
			}

			destConn.Write(buf[:n])
		}
	}()

	buf := make([]byte, 1024)

	for {
		n, err := destConn.Read(buf)

		if err != nil {
			return
		}

		conn.Write(buf[:n])
	}

}

func init() {
	port := os.Getenv("PORT")

	if port != "" {
		CONN_PORT = port
	}

	dest := os.Getenv("MC_SERVER_HOST")

	if dest != "" {
		DEST_HOST = dest
	}

	dest = os.Getenv("MC_SERVER_PORT")

	if dest != "" {
		DEST_PORT = dest
	}
}
