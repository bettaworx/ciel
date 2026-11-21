package version_test

import (
	"testing"

	"backend/internal/version"
)

func TestRuntimeBuildMetadataDefaultsToDev(t *testing.T) {
	originalVersion := version.Version
	originalCommit := version.Commit
	originalBranch := version.Branch
	t.Cleanup(func() {
		version.Version = originalVersion
		version.Commit = originalCommit
		version.Branch = originalBranch
	})

	version.Version = ""
	version.Commit = ""
	version.Branch = ""

	if got := version.VersionOrDev(); got != "dev" {
		t.Fatalf("VersionOrDev() = %q, want dev", got)
	}
	if got := version.CommitOrDev(); got != "dev" {
		t.Fatalf("CommitOrDev() = %q, want dev", got)
	}
	if got := version.BranchOrDev(); got != "dev" {
		t.Fatalf("BranchOrDev() = %q, want dev", got)
	}
}

func TestBuildMetadataFromLdflags(t *testing.T) {
	originalVersion := version.Version
	originalCommit := version.Commit
	originalBranch := version.Branch
	t.Cleanup(func() {
		version.Version = originalVersion
		version.Commit = originalCommit
		version.Branch = originalBranch
	})

	version.Version = "2026.1.4-canary.1"
	version.Commit = "abc1234"
	version.Branch = "main"

	if got := version.VersionOrDev(); got != "2026.1.4-canary.1" {
		t.Fatalf("VersionOrDev() = %q, want 2026.1.4-canary.1", got)
	}
	if got := version.CommitOrDev(); got != "abc1234" {
		t.Fatalf("CommitOrDev() = %q, want abc1234", got)
	}
	if got := version.BranchOrDev(); got != "main" {
		t.Fatalf("BranchOrDev() = %q, want main", got)
	}
}
