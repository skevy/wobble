# Releasing #

To push a new build to NPM, follow these steps.  If the process changes, please update this doc. :smiley:

1.  Ensure that all local changes have been uploaded to GitHub.
2.  Verify that [continuous integration](https://circleci.com/gh/skevy/wobble) is passing.
3.  Update the version number and links in the badges at the top of the `README`.
4.  Update the `CHANGELOG`.
5.  `yarn run publish`
    - Use the same version number you used in the previous steps.
6.  Commit the `README`, `package.json`, and `CHANGELOG` changes as `vX.X.X`, where `X.X.X` is the version number.
7.  Look at the published packages on [npmjs.com](https://www.npmjs.com/package/wobble), and verify the versions and READMEs look correct.
8.  Update the `stable` branch:
    ```
    git checkout stable
    git merge develop --ff-only
    git push origin stable
    ```
