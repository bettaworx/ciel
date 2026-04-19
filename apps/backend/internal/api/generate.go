package api

// The OpenAPI spec is authored as a split multi-file tree under
// packages/api/ (openapi.yml + paths/ + schemas/). oapi-codegen does not
// inline external $refs for parameter schemas, so we first bundle the split
// spec into packages/api/openapi.bundled.yml and feed that to oapi-codegen.

//go:generate go run ../../cmd/bundleopenapi/main.go ../../../../packages/api/openapi.yml ../../../../packages/api/openapi.bundled.yml
//go:generate go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen --config=../../oapi-codegen.yaml ../../../../packages/api/openapi.bundled.yml
