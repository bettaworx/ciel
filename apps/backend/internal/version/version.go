package version

// Version is the application's semantic version.
// Bump this manually when cutting a release.
const Version = "0.1.0"

// These variables are set at build time via -ldflags.
// When running with `go run .`, they remain empty and default to "dev".
var (
	Commit = ""
	Branch = ""
)

func CommitOrDev() string {
	if Commit == "" {
		return "dev"
	}
	return Commit
}

func BranchOrDev() string {
	if Branch == "" {
		return "dev"
	}
	return Branch
}
