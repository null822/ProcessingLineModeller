import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyPlugin from "copy-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
const projectRoot = import.meta.dirname;

let config = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(projectRoot, 'dist'),
    clean: true,
    publicPath: '/',
    library: 'Main',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      favicon: './src/assets/favicon.ico'
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/robots.txt", to: "robots.txt" },
        { from: "src/assets/favicon.ico", to: "favicon.ico" },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: 'asset/resource',
      }
    ],
  },
  mode: 'production'
}

export default config
