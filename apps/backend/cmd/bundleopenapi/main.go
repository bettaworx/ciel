//go:build ignore

// bundle-openapi resolves all external $refs in the multi-file OpenAPI spec
// and writes a single-file spec that oapi-codegen can consume.
//
// External path-item $refs  (./paths/*.yml#/~1path~1item)  are inlined.
// External schema $refs  (../schemas/*.yml#/components/schemas/Name) are
// collected from every schema file under schemas/ and placed in
// #/components/schemas; all $ref strings are rewritten to their local form.
//
// Only gopkg.in/yaml.v3 is used — no kin-openapi dependency.
//
// Usage:
//
//	go run ./cmd/bundleopenapi/main.go <input.yml> <output.yml>
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintf(os.Stderr, "usage: bundle-openapi <input.yml> <output.yml>\n")
		os.Exit(1)
	}
	src, dst := os.Args[1], os.Args[2]
	baseDir := filepath.Dir(src)

	doc, err := loadYAML(src)
	if err != nil {
		fatalf("load %s: %v", src, err)
	}

	// Collect every schema defined across all schema files.
	schemasDir := filepath.Join(baseDir, "schemas")
	allSchemas, err := collectSchemas(schemasDir)
	if err != nil {
		fatalf("collect schemas: %v", err)
	}

	// Inline external path-item $refs from the paths: section.
	if err := inlinePaths(doc, baseDir); err != nil {
		fatalf("inline paths: %v", err)
	}

	// Rewrite every external schema $ref to a local #/components/schemas/… ref.
	localizeRefs(doc)
	localizeRefs(allSchemas)

	// Merge all collected schemas into components.schemas.
	mergeSchemas(doc, allSchemas)

	// Emit the bundled spec.
	f, err := os.Create(dst)
	if err != nil {
		fatalf("create %s: %v", dst, err)
	}
	defer f.Close()

	enc := yaml.NewEncoder(f)
	enc.SetIndent(2)
	if err := enc.Encode(doc); err != nil {
		fatalf("encode: %v", err)
	}

	fmt.Printf("bundled %s -> %s\n", src, dst)
}

// ── helpers ───────────────────────────────────────────────────────────────────

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "bundle-openapi: "+format+"\n", args...)
	os.Exit(1)
}

// loadYAML reads a YAML file and returns its root content node.
func loadYAML(path string) (*yaml.Node, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var doc yaml.Node
	if err := yaml.Unmarshal(data, &doc); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	if doc.Kind == yaml.DocumentNode && len(doc.Content) > 0 {
		return doc.Content[0], nil
	}
	return &doc, nil
}

// mapGet returns the value node for key k inside a YAML mapping, or nil.
func mapGet(m *yaml.Node, k string) *yaml.Node {
	for i := 0; i+1 < len(m.Content); i += 2 {
		if m.Content[i].Value == k {
			return m.Content[i+1]
		}
	}
	return nil
}

// mapSet inserts or replaces the value for key k inside a YAML mapping.
func mapSet(m *yaml.Node, k string, v *yaml.Node) {
	for i := 0; i+1 < len(m.Content); i += 2 {
		if m.Content[i].Value == k {
			m.Content[i+1] = v
			return
		}
	}
	kn := &yaml.Node{Kind: yaml.ScalarNode, Tag: "!!str", Value: k}
	m.Content = append(m.Content, kn, v)
}

// jsonPointerGet navigates node using an RFC 6901 JSON Pointer.
// Tokens are decoded: ~1 → /, ~0 → ~.
func jsonPointerGet(node *yaml.Node, pointer string) (*yaml.Node, error) {
	pointer = strings.TrimPrefix(pointer, "/")
	if pointer == "" {
		return node, nil
	}
	cur := node
	for _, tok := range strings.Split(pointer, "/") {
		tok = strings.ReplaceAll(strings.ReplaceAll(tok, "~1", "/"), "~0", "~")
		if cur.Kind != yaml.MappingNode {
			return nil, fmt.Errorf("expected mapping at token %q", tok)
		}
		cur = mapGet(cur, tok)
		if cur == nil {
			return nil, fmt.Errorf("key %q not found", tok)
		}
	}
	return cur, nil
}

// loadRef resolves an external $ref string (file or file#/pointer) relative
// to baseDir and returns the referenced YAML node.
func loadRef(ref, baseDir string) (*yaml.Node, error) {
	file, pointer, _ := strings.Cut(ref, "#")
	if file == "" {
		return nil, fmt.Errorf("ref has no file part: %q", ref)
	}
	abs := filepath.Join(baseDir, filepath.FromSlash(file))
	node, err := loadYAML(abs)
	if err != nil {
		return nil, err
	}
	if pointer == "" {
		return node, nil
	}
	return jsonPointerGet(node, pointer)
}

// isSingleRef reports whether n is a mapping node whose only key is "$ref".
func isSingleRef(n *yaml.Node) bool {
	return n.Kind == yaml.MappingNode &&
		len(n.Content) == 2 &&
		n.Content[0].Value == "$ref"
}

// ── main stages ───────────────────────────────────────────────────────────────

// inlinePaths replaces {$ref: ./paths/foo.yml#/…} entries in paths: with the
// referenced path-item node.
func inlinePaths(doc *yaml.Node, baseDir string) error {
	paths := mapGet(doc, "paths")
	if paths == nil || paths.Kind != yaml.MappingNode {
		return nil
	}
	for i := 0; i+1 < len(paths.Content); i += 2 {
		val := paths.Content[i+1]
		if !isSingleRef(val) {
			continue
		}
		ref := val.Content[1].Value
		if strings.HasPrefix(ref, "#") {
			continue // already local
		}
		resolved, err := loadRef(ref, baseDir)
		if err != nil {
			return fmt.Errorf("path %q: %w", paths.Content[i].Value, err)
		}
		paths.Content[i+1] = resolved
	}
	return nil
}

// collectSchemas walks all .yml files under dir and collects every
// components.schemas entry into a single flat mapping node.
func collectSchemas(dir string) (*yaml.Node, error) {
	out := &yaml.Node{Kind: yaml.MappingNode, Tag: "!!map"}
	err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(path, ".yml") {
			return err
		}
		node, err := loadYAML(path)
		if err != nil {
			return err
		}
		comp := mapGet(node, "components")
		if comp == nil {
			return nil
		}
		sc := mapGet(comp, "schemas")
		if sc == nil || sc.Kind != yaml.MappingNode {
			return nil
		}
		for i := 0; i+1 < len(sc.Content); i += 2 {
			mapSet(out, sc.Content[i].Value, sc.Content[i+1])
		}
		return nil
	})
	return out, err
}

// localizeRefs walks the YAML tree and rewrites any $ref that contains
// "#/components/schemas/" to keep only the local fragment
// (e.g. "../schemas/auth.yml#/components/schemas/Foo" → "#/components/schemas/Foo").
func localizeRefs(n *yaml.Node) {
	if n == nil {
		return
	}
	switch n.Kind {
	case yaml.MappingNode:
		for i := 0; i+1 < len(n.Content); i += 2 {
			k, v := n.Content[i], n.Content[i+1]
			if k.Value == "$ref" && v.Kind == yaml.ScalarNode {
				if idx := strings.Index(v.Value, "#/components/schemas/"); idx >= 0 {
					v.Value = v.Value[idx:]
				}
			} else {
				localizeRefs(v)
			}
		}
	case yaml.SequenceNode, yaml.DocumentNode:
		for _, c := range n.Content {
			localizeRefs(c)
		}
	}
}

// mergeSchemas replaces doc.components.schemas with allSchemas.
func mergeSchemas(doc, allSchemas *yaml.Node) {
	comp := mapGet(doc, "components")
	if comp == nil {
		comp = &yaml.Node{Kind: yaml.MappingNode, Tag: "!!map"}
		mapSet(doc, "components", comp)
	}
	mapSet(comp, "schemas", allSchemas)
}
