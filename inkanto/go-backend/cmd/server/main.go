package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"inkanto/go-backend/internal/api"
	"inkanto/go-backend/internal/config"
)

func main() {
	cfg := config.Load()
	logger := log.New(os.Stdout, "inkanto ", log.LstdFlags|log.LUTC)

	app, err := api.NewApp(cfg, logger)
	if err != nil {
		logger.Fatalf("startup error: %v", err)
	}
	defer func() {
		if err := app.Close(); err != nil {
			logger.Printf("db close error: %v", err)
		}
	}()

	server := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           app.Router(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Printf("inkanto api listening on :%d", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logger.Printf("shutdown error: %v", err)
	}
}
