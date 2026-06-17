const fs = require('fs');
const path = require('path');

const cmakePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-vision-camera',
  'android',
  'CMakeLists.txt',
);

const marker = 'VIDORAHUB_NITRO_IMAGE_LINK_FIX';
const patch = `
# ${marker}: prefab can publish headers-only on release; link .so explicitly.
get_target_property(_vidorahub_nitro_image_type react-native-nitro-image::NitroImage TYPE)
if(_vidorahub_nitro_image_type STREQUAL "INTERFACE_LIBRARY")
    if(CMAKE_BUILD_TYPE MATCHES "Debug")
        set(_vidorahub_nitro_image_variant "debug")
    else()
        set(_vidorahub_nitro_image_variant "release")
    endif()
    set(_vidorahub_nitro_image_so
        "\${CMAKE_SOURCE_DIR}/../../react-native-nitro-image/android/build/intermediates/prefab_package/\${_vidorahub_nitro_image_variant}/prefab/modules/NitroImage/libs/android.\${ANDROID_ABI}/libNitroImage.so"
    )
    if(EXISTS "\${_vidorahub_nitro_image_so}")
        message(WARNING "[VisionCamera] Linking libNitroImage.so explicitly: \${_vidorahub_nitro_image_so}")
        target_link_libraries(\${PACKAGE_NAME} "\${_vidorahub_nitro_image_so}")
    endif()
endif()
`;

let cmake = fs.readFileSync(cmakePath, 'utf8');
if (cmake.includes(marker)) {
  process.exit(0);
}

const anchor = '        react-native-nitro-image::NitroImage\n)';
if (!cmake.includes(anchor)) {
  console.error('patch-vision-camera-android: CMakeLists anchor not found');
  process.exit(1);
}

cmake = cmake.replace(anchor, `${anchor}${patch}`);
fs.writeFileSync(cmakePath, cmake);
