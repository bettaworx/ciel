cmake_minimum_required(VERSION 3.14)
set(EPHEMERAL_DIR "${CMAKE_CURRENT_SOURCE_DIR}/ephemeral")

include(${EPHEMERAL_DIR}/generated_config.cmake)

if(FLUTTER_TARGET_PLATFORM STREQUAL "windows-x64")
  set(FLUTTER_LIBRARY "${EPHEMERAL_DIR}/flutter_windows.dll")
  set(FLUTTER_ICU_DATA_FILE "${EPHEMERAL_DIR}/icudtl.dat")
  set(PROJECT_BUILD_DIR "${PROJECT_DIR}/build/windows/x64")
  set(AOT_LIBRARY "${PROJECT_DIR}/build/windows/x64/app.so")
endif()

list(APPEND FLUTTER_LIBRARY_HEADERS
  "flutter_export.h"
  "flutter_windows.h"
  "flutter_messenger.h"
  "flutter_plugin_registrar.h"
  "flutter_texture_registrar.h"
)
list(TRANSFORM FLUTTER_LIBRARY_HEADERS PREPEND
  "${EPHEMERAL_DIR}/flutter_windows/")
add_library(flutter INTERFACE)
target_include_directories(flutter INTERFACE
  "${EPHEMERAL_DIR}"
)
target_link_libraries(flutter INTERFACE "${FLUTTER_LIBRARY}.lib")
add_dependencies(flutter flutter_assemble)

add_custom_command(
  OUTPUT ${FLUTTER_LIBRARY} ${FLUTTER_LIBRARY_HEADERS}
  COMMAND ${CMAKE_COMMAND} -E copy
    "${FLUTTER_ROOT}/bin/cache/artifacts/engine/windows-x64/flutter_windows.dll"
    "${FLUTTER_LIBRARY}"
  COMMAND ${CMAKE_COMMAND} -E copy_directory
    "${FLUTTER_ROOT}/bin/cache/artifacts/engine/windows-x64/flutter_windows.dll.lib"
    "${EPHEMERAL_DIR}"
)

add_custom_target(flutter_assemble
  COMMAND "${FLUTTER_ROOT}/packages/flutter_tools/bin/tool_backend.bat"
    windows-x64 $<CONFIG>
  VERBATIM
)
