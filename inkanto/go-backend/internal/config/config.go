package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port            int
	SecretKey       string
	DatabasePath    string
	SidecarURL      string
	FamilyCode      string // required at registration so only the family can sign up
	TokenExpireDays int
}

func Load() Config {
	return Config{
		Port:            envInt("PORT", 4800), // 4600 belongs to genproxy
		SecretKey:       envStr("SECRET_KEY", "dev-secret-change-me"),
		DatabasePath:    envStr("DATABASE_PATH", "./data/inkanto.sqlite3"),
		SidecarURL:      envStr("SIDECAR_URL", "http://localhost:4700"),
		FamilyCode:      envStr("FAMILY_CODE", "inkanto"),
		TokenExpireDays: envInt("TOKEN_EXPIRE_DAYS", 30),
	}
}

func envStr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
