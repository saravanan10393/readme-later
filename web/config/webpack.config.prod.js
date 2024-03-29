const autoprefixer = require("autoprefixer");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const eslintFormatter = require("react-dev-utils/eslintFormatter");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
var BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");
// Split the global css into appropriate js module chunks
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");

//preload the all async chunck for now, it needs to given to developer hand in the future
//via loadable or simple-cache-provider
// const PreloadWebpackPlugin = require('preload-webpack-plugin');
//inlines critical css
//const Critters = require('critters-webpack-plugin');
const paths = require("./paths");
const getClientEnvironment = require("./env");
const pagekageJson = require(paths.appPackageJson);
// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = paths.servedPath;
// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = publicPath === "./";
// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1);
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl);

// Assert this just to be safe.
// Development builds of React are slow and not intended for production.
if (env.stringified["process.env"].NODE_ENV !== '"production"') {
  throw new Error("Production builds must have NODE_ENV=production.");
}

// Note: defined here because it will be used more than once.
const cssFilename = "static/css/[name].[contenthash:8].css";

const profilePlugin = [];
if (process.env.PROFILE) {
  profilePlugin.push(new BundleAnalyzerPlugin());
}

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
const prdConfig = {
  mode: "production",
  // Don't attempt to continue if there are any errors.
  bail: true,
  // We generate sourcemaps in production. This is slow but gives good results.
  // You can exclude the *.map files from the build during deployment.
  devtool: shouldUseSourceMap ? "cheap-source-map" : false,
  // In production, we only want to load the polyfills and the app code.
  entry: {
    // polyfills: require.resolve('./polyfills'),
    app: paths.appIndexJs,
  },
  experiments: {
    outputModule: true,
  },
  externals: pagekageJson.externals.production,
  externalsType: "module",
  output: {
    module: true,
    // The build folder.
    path: paths.appBuild,
    // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: "static/js/[name].[contenthash:5].js",
    chunkFilename: "static/js/[name].[contenthash:5].chunk.js",
    // We inferred the "public path" (such as / or /my-project) from homepage.
    publicPath: publicPath,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: (info) =>
      path
        .relative(paths.appSrc, info.absoluteResourcePath)
        .replace(/\\/g, "/"),
  },
  resolve: {
    // This allows you to set a fallback for where Webpack should look for modules.
    // We placed these paths second because we want `node_modules` to "win"
    // if there are any conflicts. This matches Node resolution mechanism.
    // https://github.com/facebookincubator/create-react-app/issues/253
    modules: ["node_modules", paths.appNodeModules].concat(
      // It is guaranteed to exist because we tweak it in `env.js`
      process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
    ),
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    // `web` extension prefixes have been added for better support
    // for React Native Web.
    extensions: [".web.js", ".js", ".json", ".web.jsx", ".jsx"],
    alias: {
      // Support React Native Web
      // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
      "react-native": "react-native-web",
    },
    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
    ],
    symlinks: false,
  },
  module: {
    strictExportPresence: true,
    rules: [
      // TODO: Disable require.ensure as it's not a standard language feature.
      // We are waiting for https://github.com/facebookincubator/create-react-app/issues/2176.
      // { parser: { requireEnsure: false } },
      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.(js|jsx)$/,
        enforce: "pre",
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve("eslint"),
              configFile: ".eslintrc",
            },
            loader: require.resolve("eslint-loader"),
          },
        ],
        include: paths.appSrc,
      },
      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // "url" loader works just like "file" loader but it also embeds
          // assets smaller than specified size as data URLs to avoid requests.
          {
            test: [
              /\.bmp$/,
              /\.gif$/,
              /\.jpe?g$/,
              /\.png$/,
              /\.jp2$/,
              /\.webp$/,
            ],
            loader: require.resolve("url-loader"),
            options: {
              limit: 10000,
              name: "static/media/[name].[contenthash:8].[ext]",
            },
          },
          // Process JS with Babel.
          {
            test: /\.(js|jsx)$/,
            include: paths.appSrc,
            loader: require.resolve("babel-loader"),
            options: {
              plugins: [
                [
                  "@babel/plugin-transform-runtime",
                  { version: "7.6.2", useESModules: true },
                ],
              ],
              compact: true,
              cacheDirectory: true,
            },
          },
          // The notation here is somewhat confusing.
          // "postcss" loader applies autoprefixer to our CSS.
          // "css" loader resolves paths in CSS and adds assets as dependencies.
          // "style" loader normally turns CSS into JS modules injecting <style>,
          // but unlike in development configuration, we do something different.
          // `ExtractTextPlugin` first applies the "postcss" and "css" loaders
          // (second argument), then grabs the result CSS and puts it into a
          // separate file in our build process. This way we actually ship
          // a single CSS file in production instead of JS code injecting <style>
          // tags. If you use code splitting, however, any async bundles will still
          // use the "style" loader inside the async code so CSS from them won't be
          // in the main CSS file.
          {
            test: /\.css$/,
            include: function (modulePath) {
              return (
                /node_modules/.test(modulePath) ||
                /src\/styles/.test(modulePath) ||
                /\.override\./.test(modulePath)
              );
            },
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: require.resolve("css-loader"),
                options: {
                  sourceMap: shouldUseSourceMap,
                },
              },
            ],
          },
          {
            test: /\.css$/,
            exclude: function (modulePath) {
              return (
                /node_modules/.test(modulePath) ||
                /src\/styles/.test(modulePath) ||
                /\.override\./.test(modulePath)
              );
            },
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: require.resolve("css-loader"),
                options: {
                  importLoaders: 1,
                  sourceMap: shouldUseSourceMap,
                  modules: true,
                },
              },
              {
                loader: require.resolve("postcss-loader"),
                options: {
                  path: "./",
                  // Necessary for external CSS imports to work
                  // https://github.com/facebookincubator/create-react-app/issues/2677
                  ident: "postcss",
                  plugins: () => [require("postcss-flexbugs-fixes")],
                },
              },
            ],
          },
          // "file" loader makes sure assets end up in the `build` folder.
          // When you `import` an asset, you get its filename.
          // This loader don't uses a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            loader: require.resolve("file-loader"),
            // Exclude `js` files to keep "css" loader working as it injects
            // it's runtime that would otherwise processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.js$/, /\.html$/, /\.json$/, /\.ttf/, /\.woff/],
            options: {
              name: "static/media/[name].[contenthash:8].[ext]",
            },
          },
          {
            test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
              {
                loader: "file-loader",
                options: {
                  name: "[name].[ext]",
                  outputPath: "static/media/fonts/",
                },
              },
            ],
          },
          // ** STOP ** Are you adding a new loader?
          // Make sure to add the new loader(s) before the "file" loader.
        ],
      },
    ],
  },
  plugins: [
    //extract the css from js and put it in seperate css file
    new MiniCssExtractPlugin({
      filename: cssFilename,
    }),
    // Makes some environment variables available in index.html.
    // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // In production, it will be an empty string unless you specify "homepage"
    // in `package.json`, in which case it will be the pathname of that URL.
    //new InterpolateHtmlPlugin(env.raw),
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: true,
      templateContent: ({htmlWebpackPlugin}) => `
      <html>
        <head>
          ${Object.keys(htmlWebpackPlugin.files.css).map((key) => {
            return `<link rel="stylesheet" href="${htmlWebpackPlugin.files.css[key]}" />`;
          })}
          <link href="https://cdn.skypack.dev/@blueprintjs/core@v4.0.0-alpha.0/lib/css/blueprint.css" rel="stylesheet" />
          <link href="https://cdn.skypack.dev/@blueprintjs/icons@v4.0.0-alpha.0/lib/css/blueprint-icons.css" rel="stylesheet" />
        </head>
        <body>
          <noscript>You need to enable javascript</noscript>
          <div id="root"></div>
          ${Object.keys(htmlWebpackPlugin.files.js).map((key) => {
            return `<script type="module" src="${htmlWebpackPlugin.files.js[key]}"></script>`;
          })}
        </body>
      </html>
    `
    }),

    new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),

    new GenerateSW(),

    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
    // It is absolutely essential that NODE_ENV was set to production here.
    // Otherwise React will be compiled in the very slow development mode.
    new webpack.DefinePlugin(env.stringified),

    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    // new ManifestPlugin({
    //   fileName: 'asset-manifest.json',
    // }),

    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin({ resourceRegExp: /(^\.\/locale | moment)$/ }),

    // compress the bundles
    // new CompressionPlugin({
    //   test: [/\.js$/, /\.css$/, /\.svg/, /\.ttf/, /\.woff/],
    //   exclude: /\/node_modules/,
    //   minRatio: 10
    // }),

    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),

    // change the bundle hash only if the file is changed
    // new webpack.HashedModuleIdsPlugin(),
  ].concat(profilePlugin),
  optimization: {
    chunkIds: "named",
    moduleIds: "named",
    runtimeChunk: {
      name: "runtime",
    },
    removeAvailableModules: true,
    splitChunks: {
      // include all types of chunks
      chunks: "all",
      automaticNameDelimiter: "-",
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 7,
          warnings: false,
          mangle: true, // Note `mangle.properties` is `false` by default.
          module: true,
          output: {
            comments: false,
          },
          keep_classnames: true,
          keep_fnames: true,
        },
        extractComments: true,
        sourceMap: shouldUseSourceMap,
        parallel: true,
      }),
      new OptimizeCSSAssetsPlugin({
        normalizeWhitespace: true,
      }),
    ],
  },
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: false,
};

module.exports = prdConfig;
