package version

// These variables are set at build time via -ldflags. Version is the release
// tag the image was built for (e.g. 2026.1.4 or 2026.1.4-canary.1), and Commit
// and Branch report the exact source revision.
var (
	Version = ""
	Commit  = ""
	Branch  = ""
)

func VersionOrDev() string {
	if Version == "" {
		return "dev"
	}
	return Version
}

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
