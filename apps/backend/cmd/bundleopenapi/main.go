//go:build ignore

// bundle-openapi bundles the multi-file OpenAPI spec (openapi.yml + paths/ +
// schemas/) into a single flat file.
//
// Usage:
//
//	go run ./cmd/bundleopenapi/main.go <input.yml> <output.yml>
//
// oapi-codegen does not inline external $refs for parameter schemas, so we
// pre-bundle the split spec before running codegen. This tool uses the
// kin-openapi loader (already a dependency) to resolve all external refs, then
// serializes back to YAML.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
	"gopkg.in/yaml.v3"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintf(os.Stderr, "usage: bundle-openapi <input.yml> <output.yml>\n")
		os.Exit(1)
	}
	src, out := os.Args[1], os.Args[2]

	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = true

	doc, err := loader.LoadFromFile(src)
	if err != nil {
		fmt.Fprintf(os.Stderr, "load error: %v\n", err)
		os.Exit(1)
	}

	// InternalizeRefs rewrites all external $refs into #/components/... refs
	// and populates the components section with the resolved schemas.
	// Custom resolver: return only the final name segment (e.g. "AdminMedia"
	// from "../schemas/admin.yml#/components/schemas/AdminMedia") to preserve
	// the same type names that oapi-codegen would generate from the original
	// monolithic spec.
	doc.InternalizeRefs(context.Background(), func(_ *openapi3.T, ref openapi3.ComponentRef) string {
		refStr := ref.RefString()
		if idx := strings.LastIndex(refStr, "/"); idx >= 0 {
			return refStr[idx+1:]
		}
		return refStr
	})

	// Marshal to JSON (openapi3.T uses json struct tags) then convert to YAML
	// for a human-readable output.
	jsonBytes, err := json.Marshal(doc)
	if err != nil {
		fmt.Fprintf(os.Stderr, "json marshal error: %v\n", err)
		os.Exit(1)
	}

	var tree any
	if err := json.Unmarshal(jsonBytes, &tree); err != nil {
		fmt.Fprintf(os.Stderr, "json unmarshal error: %v\n", err)
		os.Exit(1)
	}

	f, err := os.Create(out)
	if err != nil {
		fmt.Fprintf(os.Stderr, "create output error: %v\n", err)
		os.Exit(1)
	}
	defer f.Close()

	enc := yaml.NewEncoder(f)
	enc.SetIndent(2)
	if err := enc.Encode(tree); err != nil {
		fmt.Fprintf(os.Stderr, "yaml encode error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("bundled %s -> %s\n", src, out)
}
