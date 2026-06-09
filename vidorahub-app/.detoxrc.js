{
  "testRunner": "jest",
  "runnerConfig": "e2e/config.json",
  "configurations": {
    "ios.sim.debug": {
      "device": { "type": "iPhone 15" },
      "app": "ios.debug"
    },
    "android.emu.debug": {
      "device": { "avdName": "Pixel_6_API_34" },
      "app": "android.debug"
    }
  }
}
