# CHANGELOG

### v1.3.1

- Fix types for chainable methods ([bd7b496](https://github.com/skevy/wobble/commit/bd7b49622805b9bc218c87017ea92d3cb35d623f))
- Use lolex in tests to properly fake timers ([3cb1e92](https://github.com/skevy/wobble/commit/3cb1e92729eb7948776f4548f9e86a4bad4c3077))

### v1.3.0

- Update TypeScript definition with chainable API ([0c9bb96](https://github.com/skevy/wobble/commit/0c9bb96eb66c716d4d3b057bb366d593ea9bc79e))
- Add README ([4656acf](https://github.com/skevy/wobble/commit/4656acf67f1a892ac81a1684d6516384eb900cd3
))
- Deploy demos to wobble-demos.now.sh ([4172c9c](https://github.com/skevy/wobble/commit/4172c9c13aa6877a7f3951c201ca33a4e3e37856
))
- Set _currentValue + _currentVelocity in constructor ([6112980](https://github.com/skevy/wobble/commit/61129802df8b2536264ceff46823e5e3911e9eef))
- Add "chat heads" demo ([5189aea](https://github.com/skevy/wobble/commit/5189aea291131816fd80dc834fac2885a72e58b1))
- Use `Date.now()` instead of `performance.now()` for React Native compatibility ([34d9a0f](https://github.com/skevy/wobble/commit/34d9a0fe6ef3ac24630c8524a0ac1229ed09fc08))
- Make `this._currentTime` always equal to "now", remove "first step" calculation ([4589723](https://github.com/skevy/wobble/commit/45897231dd8683f4e820d2030956fe34cb4866ee))
- Make all APIs chainable ([b89559f](https://github.com/skevy/wobble/commit/b89559fb6e83314098a673461d2225369f170d81))
- Set default `toValue` to 1. ([c0fb41a](https://github.com/skevy/wobble/commit/c0fb41a3d17f30fb1c5298cc3c2aa20af7fe55a8))
- Move @flow annotations + fix comments ([058c75d](https://github.com/skevy/wobble/commit/058c75d934a36c0e2a8f5dd5f34d5854ce664124))
- Remove "browser" field from package.json ([261cca3](https://github.com/skevy/wobble/commit/261cca3237837cf2650a9441fe1406bc41a37b73))

### v1.2.0

- Consistently use the term "listener" in tests ([1328f38](https://github.com/skevy/wobble/commit/1328f3878b7eea60611f4d722fa13d32e854826f))
- Ensure listeners are only notified once per frame ([cf92f76](https://github.com/skevy/wobble/commit/cf92f7670aae10dc776af1a624a5d2509d0f1b70))
- Made _evaluateSpring take an absolute timestamp ([0696712](https://github.com/skevy/wobble/commit/0696712d1352263d6dc09bc61e03be06be4f98ed))

### v1.1.0

- Made onStart synchronous ([aaf21a9](https://github.com/skevy/wobble/commit/aaf21a97435864b93122ed6480765a654713f888))
- Update _currentValue and _currentVelocity before updating fromValue ([9abf13f](https://github.com/skevy/wobble/commit/9abf13f8e1a107619a31c304750cd0363ad976ed))

### v1.0.0

🎉🎉🎉🎉🎉🎉 Initial Release! 🎉🎉🎉🎉🎉🎉