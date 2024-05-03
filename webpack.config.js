const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    main: "./src/main.ts",
    playground: "./src/index.tsx",
  },
  output: {
    path: path.join(__dirname, "dist"),
    libraryTarget: "umd",
    library: "GandiPlugins",
    filename: "static/js/[name].js",
    chunkFilename: "[name].[hash:5].js",
    clean: true, // Clean the output directory before emit.
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [
          "style-loader",
          {
            loader: "@teamsupercell/typings-for-css-modules-loader",
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              modules: {
                localIdentName: "addons_[local]_[hash:base64:5]",
                exportLocalsConvention: "camelCaseOnly",
              },
            },
          },
          {
            loader: "postcss-loader",
          },
          {
            loader: "less-loader",
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.svg$/i,
        type: "asset",
        resourceQuery: /url/, // *.svg?url
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
        use: ["@svgr/webpack"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      src: path.resolve(__dirname, "./src"),
      plugins: path.resolve(__dirname, "./src/plugins"),
      assets: path.resolve(__dirname, "./src/assets"),
      lib: path.resolve(__dirname, "./src/lib"),
      utils: path.resolve(__dirname, "./src/utils"),
      components: path.resolve(__dirname, "./src/components"),
      hooks: path.resolve(__dirname, "./src/hooks"),
      types: path.resolve(__dirname, "./src/types"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["playground"],
      template: "./index.html",
      title: "Gandi Plugins",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./favicon.ico",
          to: "./",
        },
      ],
    }),
  ],
  optimization: {
    minimize: true,
  },
  target: ["web", "es6"],
};
