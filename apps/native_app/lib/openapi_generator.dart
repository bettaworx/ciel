// Openapi Generator last run: : 2026-05-12T12:52:28.021024
import 'package:openapi_generator_annotations/openapi_generator_annotations.dart';

@Openapi(
  additionalProperties: DioProperties(
    pubName: 'ciel_api',
    pubAuthor: 'Ciel',
    pubVersion: '1.0.0',
  ),
  inputSpec: InputSpec(path: '../../packages/api/openapi.bundled.yml'),
  generatorName: Generator.dio,
  outputDirectory: 'lib/api',
  runSourceGenOnOutput: true,
)
class CielOpenApiGeneratorConfig {}