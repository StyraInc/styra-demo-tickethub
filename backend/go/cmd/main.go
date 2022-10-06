package main

import (
	"log"

	"github.com/styrainc/styra-tickethub-go/server"
)

func main() {
	ws := server.NewWebServer()
	if err := ws.Listen(); err != nil {
		log.Fatal(err)
	}
}
