import 'package:openapi_generator_annotations/openapi_generator_annotations.dart';

@Openapi(
  additionalProperties: DioProperties(
    pubName: 'ciel_api',
    pubAuthor: 'Ciel',
    pubVersion: '1.0.0',
  ),
  inputSpec: LocalSpec(path: '../../packages/api/openapi.yml'),
  generatorName: Generator.dio,
  outputDirectory: 'lib/api',
  runSourceGenOnOutput: true,
)
class CielOpenApiGeneratorConfig {}
