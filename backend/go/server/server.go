package server

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

var (
	//go:embed public/*
	files embed.FS

	// Route mappings for static files.
	mapping = map[string]string{
		"/":                      "public/tickets.html",
		"/tickets":               "public/tickets.html",
		"/ticket/new":            "public/new_ticket.html",
		"/ticket/{id}":           "public/ticket.html",
		"/admin":                 "public/admin.html",
		"/stylesheets/style.css": "public/stylesheets/style.css",
		"/scripts/login.js":      "public/scripts/login.js",
		"/scripts/users.js":      "public/scripts/users.js",
		"/scripts/styra_run.js":  "public/scripts/styra_run.js",
	}

	credentialsError = errors.New("could not extract credentials")

	getUrlVar = func(r *http.Request, key string) string {
		return mux.Vars(r)[key]
	}
)

type UserKey struct{}

type User struct {
	Tenant  string
	Subject string
}

type WebServer interface {
	Listen() error
}

type webServer struct {
	controller TicketController
}

func NewWebServer() WebServer {
	return &webServer{
		controller: NewTicketController(
			&TicketControllerSettings{
				Defaults: DefaultTicketMap,
			},
		),
	}
}

func (s *webServer) Listen() error {
	router := mux.NewRouter()

	// Setup route handlers for static files.
	for k, v := range mapping {
		k, v := k, v // ick

		router.HandleFunc(k, func(w http.ResponseWriter, r *http.Request) {
			if bytes, err := fs.ReadFile(files, v); err == nil {
				contentType := mime.TypeByExtension(
					filepath.Ext(v),
				)

				w.Header().Set("Content-Type", contentType)
				w.Write(bytes)
			} else {
				http.Error(w, "file not found", http.StatusNotFound)
			}
		}).Methods("GET")
	}

	// Setup api routes.
	router.HandleFunc("/api/tickets", s.list).Methods("GET")
	router.HandleFunc("/api/tickets", s.post).Methods("POST")
	router.HandleFunc("/api/tickets/{id}", s.get).Methods("GET")
	router.HandleFunc("/api/tickets/{id}/resolve", s.resolve).Methods("POST")

	// Middleware to add tenant to the request
	// context. If not found, emits an error.
	addUser := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := s.extractCredentials(r)
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			ctx := context.WithValue(r.Context(), UserKey{}, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}

	router.Use(addUser)

	return http.ListenAndServe(":3000", router)
}

func (s *webServer) user(r *http.Request) *User {
	return r.Context().Value(UserKey{}).(*User)
}

func (s *webServer) read(r *http.Request, request interface{}) error {
	return json.NewDecoder(r.Body).Decode(request)
}

func (s *webServer) write(w http.ResponseWriter, response interface{}) {
	if bytes, err := json.Marshal(response); err != nil {
		http.Error(w, "internal server error", http.StatusInternalServerError)
	} else {
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)
	}
}

func (s *webServer) getId(r *http.Request) (int, error) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		return -1, err
	}

	return id, nil
}

func (s *webServer) list(w http.ResponseWriter, r *http.Request) {
	user := s.user(r)

	tickets := s.controller.List(user.Tenant)

	s.write(
		w,
		map[string]interface{}{
			"tickets": tickets,
		},
	)
}

func (s *webServer) post(w http.ResponseWriter, r *http.Request) {
	user := s.user(r)

	request := &struct {
		Customer    string `json:"customer"`
		Description string `json:"description"`
	}{}

	if err := s.read(r, request); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	ticket := &Ticket{
		Customer:    request.Customer,
		Description: request.Description,
	}

	s.controller.Create(user.Tenant, ticket)
	s.write(w, ticket)
}

func (s *webServer) get(w http.ResponseWriter, r *http.Request) {
	user := s.user(r)

	id, err := s.getId(r)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	ticket, err := s.controller.Get(user.Tenant, id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	s.write(w, ticket)
}

func (s *webServer) resolve(w http.ResponseWriter, r *http.Request) {
	user := s.user(r)

	id, err := s.getId(r)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	request := &struct {
		Resolved bool `json:"resolved"`
	}{}

	if err := s.read(r, request); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	ticket, err := s.controller.Get(user.Tenant, id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	ticket.Resolved = request.Resolved

	s.write(w, ticket)
}

func (s *webServer) extractCredentials(r *http.Request) (*User, error) {
	cookie, err := r.Cookie("user")
	if err != nil {
		return nil, credentialsError
	}

	values := strings.Split(cookie.Value, "/")
	if len(values) != 2 {
		return nil, credentialsError
	}

	tenant := strings.TrimSpace(values[0])
	if tenant == "" {
		return nil, credentialsError
	}

	subject := strings.TrimSpace(values[1])
	if subject == "" {
		return nil, credentialsError
	}

	return &User{
		Tenant:  tenant,
		Subject: subject,
	}, nil
}
