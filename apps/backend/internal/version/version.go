package version

// Version is the application's semantic version.
// Bump this manually when cutting a release.
const Version = "2026.1.3"

// These variables are set at build time via -ldflags so a running backend can
// report the exact source revision used to build its image.
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
