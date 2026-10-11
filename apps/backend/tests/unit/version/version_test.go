package version_test

import (
	"testing"

	"backend/internal/version"
)

func TestRuntimeBuildMetadataDefaultsToDev(t *testing.T) {
	originalCommit := version.Commit
	originalBranch := version.Branch
	t.Cleanup(func() {
		version.Commit = originalCommit
		version.Branch = originalBranch
	})

	version.Commit = ""
	version.Branch = ""

	if got := version.CommitOrDev(); got != "dev" {
		t.Fatalf("CommitOrDev() = %q, want dev", got)
	}
	if got := version.BranchOrDev(); got != "dev" {
		t.Fatalf("BranchOrDev() = %q, want dev", got)
	}
}

func TestBuildMetadataFromLdflags(t *testing.T) {
	originalCommit := version.Commit
	originalBranch := version.Branch
	t.Cleanup(func() {
		version.Commit = originalCommit
		version.Branch = originalBranch
	})

	version.Commit = "abc1234"
	version.Branch = "main"

	if got := version.CommitOrDev(); got != "abc1234" {
		t.Fatalf("CommitOrDev() = %q, want abc1234", got)
	}
	if got := version.BranchOrDev(); got != "main" {
		t.Fatalf("BranchOrDev() = %q, want main", got)
	}
}
