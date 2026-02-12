package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"backend/internal/api"
	"backend/internal/auth"
	"backend/internal/cache"
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/logging"
	"backend/internal/middleware"
	"backend/internal/realtime"
	"backend/internal/repository"
	"backend/internal/service"
	"backend/internal/service/admin"
	"backend/internal/service/moderation"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	loadedEnv := []string{}
	if os.Getenv("DISABLE_DOTENV") == "" {
		loadedEnv = loadDotEnv()
	}
	logging.Init()
	if len(loadedEnv) > 0 {
		for _, p := range loadedEnv {
			slog.Info("loaded env file", "path", p)
		}
	} else {
		if os.Getenv("DISABLE_DOTENV") != "" {
			slog.Info("dotenv loading disabled")
		} else {
			slog.Info("no .env files found", "note", "ok in production")
		}
	}

	env := os.Getenv("ENV")
	isProduction := env == "production" || env == "prod"

	// Validate required secrets in all environments
	// All secrets are required even in development to ensure proper security practices
	requiredSecrets := map[string]struct {
		minLength int
		hint      string
		forbidden []string // Forbidden placeholder values
	}{
		"JWT_SECRET": {
			minLength: 32,
			hint:      "generate with: openssl rand -base64 32",
			forbidden: []string{"replace", "secret", "changeme", "jwt-secret"},
		},
		"INITIAL_SETUP_PASSWORD": {
			minLength: 1,
			hint:      "set a simple passphrase for initial server setup",
			forbidden: []string{},
		},
	}

	// In production, additional secrets are required
	if isProduction {
		requiredSecrets["REALTIME_SIGNING_SECRET"] = struct {
			minLength int
			hint      string
			forbidden []string
		}{
			minLength: 32,
			hint:      "generate with: openssl rand -base64 32",
			forbidden: []string{"replace", "changeme", "realtime-secret"},
		}
		requiredSecrets["DATABASE_URL"] = struct {
			minLength int
			hint      string
			forbidden []string
		}{
			minLength: 1,
			hint:      "set PostgreSQL connection string",
			forbidden: []string{},
		}
		requiredSecrets["PUBLIC_BASE_URL"] = struct {
			minLength int
			hint      string
			forbidden []string
		}{
			minLength: 1,
			hint:      "set public base URL (e.g., https://yourdomain.com)",
			forbidden: []string{},
		}
	}

	// Check all required secrets
	var errors []string
	for varName, config := range requiredSecrets {
		value := strings.TrimSpace(os.Getenv(varName))

		// Check if set
		if value == "" {
			errors = append(errors, fmt.Sprintf("%s not set (hint: %s)", varName, config.hint))
			continue
		}

		// Check minimum length
		if len(value) < config.minLength {
			errors = append(errors, fmt.Sprintf("%s too short (minimum %d characters, hint: %s)",
				varName, config.minLength, config.hint))
			continue
		}

		// Check forbidden placeholder values
		valueLower := strings.ToLower(value)
		for _, forbidden := range config.forbidden {
			if strings.Contains(valueLower, strings.ToLower(forbidden)) {
				errors = append(errors, fmt.Sprintf("%s contains placeholder value %q (hint: %s)",
					varName, forbidden, config.hint))
				break
			}
		}
	}

	if len(errors) > 0 {
		envType := "development"
		if isProduction {
			envType = "production"
		}
		slog.Error("required secrets validation failed", "environment", envType, "errors", errors)
		for _, err := range errors {
			slog.Error("  - " + err)
		}
		os.Exit(1)
	}

	// Validate required environment variables in production
	if isProduction {
		// Validate database password strength
		dbURL := os.Getenv("DATABASE_URL")
		postgresPassword := os.Getenv("POSTGRES_PASSWORD")
		if postgresPassword == "" || postgresPassword == "ciel" ||
			postgresPassword == "postgres" || postgresPassword == "password" ||
			len(postgresPassword) < 16 {
			slog.Error("weak or missing POSTGRES_PASSWORD in production",
				"hint", "generate strong password with: openssl rand -base64 32")
			os.Exit(1)
		}
		// Check if DATABASE_URL contains weak password
		if strings.Contains(dbURL, ":ciel@") || strings.Contains(dbURL, ":postgres@") ||
			strings.Contains(dbURL, ":password@") {
			slog.Error("DATABASE_URL contains weak password in production")
			os.Exit(1)
		}

		// Validate Redis password in production if Redis is used
		redisAddr := os.Getenv("REDIS_ADDR")
		redisPassword := os.Getenv("REDIS_PASSWORD")
		if redisAddr != "" {
			if redisPassword == "" || len(redisPassword) < 16 {
				slog.Error("Redis is configured without strong password in production",
					"hint", "set REDIS_PASSWORD (minimum 16 characters, generate with: openssl rand -base64 32)")
				os.Exit(1)
			}
		}

		slog.Info("production environment variables validated")
	}

	trustProxy := false
	if v := os.Getenv("TRUST_PROXY"); v != "" {
		switch v {
		case "1", "true", "TRUE", "True":
			trustProxy = true
		}
	}

	r := chi.NewRouter()
	r.Use(chimw.RequestID)

	// JWT_SECRET is now validated above - no fallback to ephemeral secret
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	tokenManager := auth.NewTokenManager(jwtSecret, 1*time.Hour)
	if v := os.Getenv("STEPUP_TOKEN_TTL_SECONDS"); v != "" {
		if secs, err := strconv.Atoi(v); err == nil && secs > 0 {
			tokenManager.SetStepupTTL(time.Duration(secs) * time.Second)
		} else {
			slog.Warn("invalid STEPUP_TOKEN_TTL_SECONDS", "value", v)
		}
	}
	r.Use(middleware.CORS())
	r.Use(middleware.OptionalAuth(tokenManager))
	r.Use(middleware.AccessLog(middleware.AccessLogOptions{TrustProxy: trustProxy}))

	var store *repository.Store
	var redisClient *redis.Client

	redisAddr := os.Getenv("REDIS_ADDR")
	redisOpts, redisWarn, redisErr := redisOptionsFromAddr(redisAddr)
	if redisErr != nil {
		slog.Warn("invalid REDIS_ADDR; redis disabled", "error", redisErr)
	} else {
		if redisWarn != "" {
			slog.Warn(redisWarn)
		}
		redisAddr = redisOpts.Addr
		redisClient = redis.NewClient(redisOpts)
	}
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		sqlDB, err := db.Open(databaseURL)
		if err != nil {
			slog.Error("failed to open database", "error", err)
		} else {
			store = repository.NewStore(sqlDB)
		}
	} else {
		slog.Warn("DATABASE_URL not set; database services will return 503")
	}

	// If Redis is not reachable, disable cache usage (DB-only fallback still works).
	if redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
		defer cancel()
		if err := redisClient.Ping(ctx).Err(); err != nil {
			slog.Warn("redis not reachable; timeline cache disabled", "addr", redisAddr, "error", err)
			redisClient = nil
		}
	}

	realtimeHub := realtime.NewHub(redisClient)
	go realtimeHub.Run(context.Background())

	// Set Redis on TokenManager for token revocation
	if redisClient != nil {
		tokenManager.SetRedis(redisClient)
		slog.Info("token revocation enabled via Redis")
	} else {
		slog.Warn("token revocation disabled; Redis not available")
	}

	// Initialize configuration manager
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "./config/config.yaml"
	}
	configMgr, err := config.NewManager(configPath)
	if err != nil {
		slog.Error("failed to load config", "error", err, "path", configPath)
		os.Exit(1)
	}
	slog.Info("loaded server config", "path", configPath)

	authzSvc := service.NewAuthzService(store)

	// Security middlewares (no-op if Redis is disabled/unreachable).
	r.Use(middleware.AccessControl(redisClient, middleware.AccessControlOptions{TrustProxy: trustProxy}))
	r.Use(middleware.RateLimit(redisClient, middleware.RateLimitOptions{TrustProxy: trustProxy}))

	// Initialize session stores (Redis if available, fallback to memory)
	var loginSessionStore auth.LoginSessionStore
	var stepupSessionStore auth.StepupSessionStore
	if redisClient != nil {
		loginSessionStore = auth.NewRedisLoginSessionStore(redisClient, 60*time.Second)
		stepupSessionStore = auth.NewRedisStepupSessionStore(redisClient, 5*time.Minute)
		slog.Info("using Redis-backed session stores")
	} else {
		loginSessionStore = auth.NewMemoryLoginSessionStore()
		stepupSessionStore = auth.NewMemoryStepupSessionStore()
		slog.Warn("Redis not available; using in-memory session stores (not suitable for multi-instance deployment)")
	}

	authSvc := service.NewAuthServiceWithOptions(store, tokenManager, service.AuthServiceOptions{
		LoginSessionStore:  loginSessionStore,
		StepupSessionStore: stepupSessionStore,
	})
	authSvc.SetConfigManager(configMgr)

	// Initialize admin services
	modLogsSvc := moderation.NewLogsService(store)
	adminInvitesSvc := admin.NewInvitesService(store)
	adminUsersSvc := admin.NewUsersService(store)
	adminProfileSvc := admin.NewProfileService(store, modLogsSvc)
	adminAgreementsSvc := admin.NewAgreementsService(store)

	// Initialize moderation services
	modMutesSvc := moderation.NewMutesService(store, modLogsSvc)
	modReportsSvc := moderation.NewReportsService(store, modLogsSvc)
	modBannedContentSvc := moderation.NewBannedContentService(store, modLogsSvc)
	modIPBansSvc := moderation.NewIPBansService(store, modLogsSvc)
	modPostsSvc := moderation.NewPostsServiceWithPublisher(store, modLogsSvc, realtimeHub)
	modMediaSvc := moderation.NewMediaService(store, modLogsSvc)

	// Update auth service to use admin invites service
	authSvc.SetInviteService(adminInvitesSvc)

	// Initialize agreements service
	agreementsSvc := service.NewAgreementsService(store)

	// Create cache abstraction
	var cacheImpl cache.Cache
	if redisClient != nil {
		cacheImpl = cache.NewRedisCache(redisClient)
	} else {
		cacheImpl = cache.NewNoOpCache()
	}

	setupTokenMgr := service.NewSetupTokenManager(cacheImpl)
	setupSvc := service.NewSetupService(store, authSvc, setupTokenMgr, configMgr)

	// Note: Setup middleware removed - invite-only mode controls registration instead

	r.Use(middleware.RequireAdminAccess(tokenManager, authzSvc))

	adminSvc := service.NewAdminService(store, cacheImpl, configMgr)
	usersSvc := service.NewUsersService(store)
	postsSvc := service.NewPostsService(store, cacheImpl, realtimeHub)
	timelineSvc := service.NewTimelineService(store, cacheImpl)
	reactionsSvc := service.NewReactionsService(store, cacheImpl, realtimeHub)

	mediaDir := os.Getenv("MEDIA_DIR")
	if mediaDir == "" {
		mediaDir = filepath.FromSlash("./data/media")
	}

	// Resolve to absolute path for clarity in logs
	absMediaDir, err := filepath.Abs(mediaDir)
	if err != nil {
		slog.Warn("failed to resolve MEDIA_DIR to absolute path; using as-is", "mediaDir", mediaDir, "error", err)
		absMediaDir = mediaDir
	}

	// Try to initialize media directory
	mediaInitErr := initMediaDir(absMediaDir)
	if mediaInitErr != nil {
		slog.Error("media directory initialization failed", "path", absMediaDir, "error", mediaInitErr)
		slog.Warn("media upload will return 503 until directory is created with proper permissions")
	} else {
		slog.Info("media directory initialized", "path", absMediaDir)
	}

	mediaSvc := service.NewMediaService(store, absMediaDir, configMgr.Get().Media, mediaInitErr)

	// Public media routes (authentication bypassed in OptionalAuth middleware)
	r.Get("/media/{mediaId}/image.png", mediaSvc.ServeImage)
	r.Get("/media/{mediaId}/image.webp", mediaSvc.ServeImage)
	r.Get("/media/{mediaId}/image_static.png", mediaSvc.ServeImage)
	r.Get("/media/{mediaId}/image_static.webp", mediaSvc.ServeImage)

	apiServer := handlers.API{
		Auth:       authSvc,
		Admin:      adminSvc,
		Authz:      authzSvc,
		Users:      usersSvc,
		Posts:      postsSvc,
		Timeline:   timelineSvc,
		Reactions:  reactionsSvc,
		Media:      mediaSvc,
		Setup:      setupSvc,
		Agreements: agreementsSvc,
		Tokens:     tokenManager,
		Redis:      redisClient,

		// Admin services
		AdminInvites:    adminInvitesSvc,
		AdminUsers:      adminUsersSvc,
		AdminProfile:    adminProfileSvc,
		AdminAgreements: adminAgreementsSvc,

		// Moderation services
		ModLogs:          modLogsSvc,
		ModMutes:         modMutesSvc,
		ModReports:       modReportsSvc,
		ModBannedContent: modBannedContentSvc,
		ModIPBans:        modIPBansSvc,
		ModPosts:         modPostsSvc,
		ModMedia:         modMediaSvc,
	}
	r.Get("/ws/timeline", handlers.NewTimelineWebSocketHandler(realtimeHub, tokenManager, handlers.WebSocketOptions{TrustProxy: trustProxy}))
	api.HandlerWithOptions(&apiServer, api.ChiServerOptions{
		BaseURL:    "/api/v1",
		BaseRouter: r,
		Middlewares: []api.MiddlewareFunc{
			handlers.RequireAgreementConsent(agreementsSvc, authzSvc),
		},
	})

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("welcome"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "6137"
	}

	// Configure HTTP server with security timeouts
	// SECURITY: Prevent slowloris and long-running request attacks
	server := &http.Server{
		Addr:    ":" + port,
		Handler: r,
		// ReadTimeout covers the time from connection accept to request body fully read
		// Set to 30s to allow large file uploads (12MB over slower connections)
		ReadTimeout: 30 * time.Second,
		// WriteTimeout covers the time from end of request read to end of response write
		// Set to 60s to allow image processing time (large images may take several seconds)
		WriteTimeout: 60 * time.Second,
		// IdleTimeout limits keep-alive connections
		IdleTimeout: 120 * time.Second,
		// ReadHeaderTimeout prevents slowloris attacks (slow header sends)
		ReadHeaderTimeout: 10 * time.Second,
	}

	slog.Info("starting http server", "addr", server.Addr,
		"readTimeout", server.ReadTimeout,
		"writeTimeout", server.WriteTimeout)

	if err := server.ListenAndServe(); err != nil {
		slog.Error("http server stopped", "error", err)
		os.Exit(1)
	}
}

// initMediaDir attempts to initialize the media directory with proper permissions.
// Returns an error if the directory cannot be created or is not writable.
func initMediaDir(path string) error {
	// Try to create directory with 0o755 permissions
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Verify directory is writable by creating and removing a test file
	testFile := filepath.Join(path, ".write_test")
	f, err := os.Create(testFile)
	if err != nil {
		return fmt.Errorf("directory exists but not writable: %w", err)
	}
	f.Close()

	if err := os.Remove(testFile); err != nil {
		// Non-fatal, but log it
		slog.Warn("created test file but failed to remove it", "path", testFile, "error", err)
	}

	return nil
}

func loadDotEnv() []string {
	// Go does not automatically load .env files.
	// Allow explicit path via DOTENV_PATH, otherwise search upward for .env files.
	if p := strings.TrimSpace(os.Getenv("DOTENV_PATH")); p != "" {
		if _, err := os.Stat(p); err == nil {
			if err := godotenv.Load(p); err == nil {
				return []string{p}
			}
		}
		return nil
	}

	candidates := []string{
		".env.local",
		".env",
	}

	var loaded []string
	wd, err := os.Getwd()
	if err != nil {
		wd = "."
	}
	for dir := wd; ; {
		for _, name := range candidates {
			p := filepath.Join(dir, name)
			if _, err := os.Stat(p); err != nil {
				continue
			}
			if err := godotenv.Load(p); err == nil {
				loaded = append(loaded, p)
			}
		}
		if len(loaded) > 0 {
			return loaded
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return loaded
}

func redisOptionsFromAddr(redisAddr string) (*redis.Options, string, error) {
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	// Try parsing as Redis URL (redis://[:password@]host:port[/db])
	if strings.Contains(redisAddr, "://") {
		if opts, err := redis.ParseURL(redisAddr); err == nil {
			// Validate password in production
			if env := os.Getenv("ENV"); (env == "production" || env == "prod") && opts.Password == "" {
				return opts, "WARNING: Redis has no password in production environment", nil
			}
			return opts, "", nil
		}
		parsed, err := url.Parse(redisAddr)
		if err != nil {
			return nil, "", fmt.Errorf("parse REDIS_ADDR: %w", err)
		}
		if parsed.Host == "" {
			return nil, "", fmt.Errorf("REDIS_ADDR missing host: %q", redisAddr)
		}
		warn := ""
		if parsed.Scheme != "" && parsed.Scheme != "redis" && parsed.Scheme != "rediss" {
			warn = fmt.Sprintf("REDIS_ADDR uses %q scheme; using host %q", parsed.Scheme, parsed.Host)
		}
		return &redis.Options{Addr: parsed.Host}, warn, nil
	}

	// Simple host:port format, check for separate password environment variable
	opts := &redis.Options{Addr: redisAddr}
	if redisPassword := os.Getenv("REDIS_PASSWORD"); redisPassword != "" {
		opts.Password = redisPassword
	}

	// Validate password in production
	if env := os.Getenv("ENV"); (env == "production" || env == "prod") && opts.Password == "" {
		return opts, "WARNING: Redis has no password in production environment", nil
	}

	return opts, "", nil
}
