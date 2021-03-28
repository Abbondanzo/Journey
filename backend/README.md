# Journey Backend

The backend is designed to exist as an [Express.js](https://expressjs.com/) app hosted by Firebase's [Cloud Functions](https://firebase.google.com/docs/functions/). Instead of deploying each time and wasting compute resources, we can test these functions by hosting them locally.

## Setup

To install the Firebase CLI, you need to [sign up for a Firebase account](https://firebase.google.com/). Continue installing Firebase's CLI using your global package manager.

```bash
npm install -g firebase-tools
```

This will provide you with the globally accessible `firebase` command.

Next, we need to install the packages of this project. I highly recommend using [Yarn](https://yarnpkg.com/en/).

```bash
# Installs node dependencies
yarn
```

Finally, we can serve these functions as HTTP functions.

```bash
# Starts hot reloading server
yarn serve
```

To build and compress these functions into a deployable state, you can use the `build` command as such.

```bash
# Builds production-ready deployment
yarn build
```

## Troubleshooting

Did you know that Google Cloud Functions only supports Node.js v6.11.5? Even if you're running that version, serving these functions will still output this error.

Requiring your service credentials will _not_ work unless you use [NVM](https://github.com/creationix/nvm) and run this version:

```bash
nvm install 6.11.5
```

## License

MIT
