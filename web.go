package web

import (
	"embed"
	"io/fs"
	"net/http"
	"path/filepath"
)

//go:embed static/*
var files embed.FS

func Handler() http.Handler {
	fsys, err := fs.Sub(files, "static")
	if err != nil {
		panic(err)
	}

	fileServer := http.FileServer(http.FS(fsys))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if ext := filepath.Ext(path); ext != "" {
			fileServer.ServeHTTP(w, r)
			return
		}

		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})
}
