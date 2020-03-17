const path = require("path");
const webpack = require("webpack");

module.exports = {
  target: "web",
  mode: "development",
  entry: {
    main: "./main.tsx"
  },
  devtool: "source-map",
  output: {
    path: path.join(__dirname),
    filename: "[name].js",
    chunkFilename: "chunk.[id].js",
    publicPath: "/js/",
    library: ["[name]"],
    libraryTarget: "this"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: require.resolve("react-dom"),
        use: {
          loader: "expose-loader",
          query: "ReactDOM"
        }
      },
      // Required by React.NET
      {
        test: require.resolve("react-dom/server"),
        use: {
          loader: "expose-loader",
          query: "ReactDOMServer"
        }
      },
      // Required by React.NET
      {
        test: require.resolve("react"),
        use: {
          loader: "expose-loader",
          query: "React"
        }
      }
    ]
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".js", "jsx", ".tsx", ".ts"]
  }
};
