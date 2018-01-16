# CHANGELOG

### v1.3.0

- Add README (4656acf)
- Deploy demos to wobble-demos.now.sh (4172c9c)
- Set _currentValue + _currentVelocity in constructor (6112980)
- Add "chat heads" demo (5189aea)
- Use `Date.now()` instead of `performance.now()` for React Native compatibility (34d9a0f)
- Make `this._currentTime` always equal to "now", remove "first step" calculation (4589723)
- Make all APIs chainable (b89559f)
- Set default `toValue` to 1. (c0fb41a)
- Move @flow annotations + fix comments (058c75d)
- Remove "browser" field from package.json (261cca3)

### v1.2.0

- Consistently use the term "listener" in tests ([1328f38](https://github.com/skevy/wobble/commit/1328f3878b7eea60611f4d722fa13d32e854826f))
- Ensure listeners are only notified once per frame ([cf92f76](https://github.com/skevy/wobble/commit/cf92f7670aae10dc776af1a624a5d2509d0f1b70))
- Made _evaluateSpring take an absolute timestamp ([0696712](https://github.com/skevy/wobble/commit/0696712d1352263d6dc09bc61e03be06be4f98ed))

### v1.1.0

- Made onStart synchronous ([aaf21a9](https://github.com/skevy/wobble/commit/aaf21a97435864b93122ed6480765a654713f888))
- Update _currentValue and _currentVelocity before updating fromValue ([9abf13f](https://github.com/skevy/wobble/commit/9abf13f8e1a107619a31c304750cd0363ad976ed))

### v1.0.0

🎉🎉🎉🎉🎉🎉 Initial Release! 🎉🎉🎉🎉🎉🎉