module.exports = {
  entry: {
    app: '/export/index.js',
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    liveReload: true,
    hot: true,
    open: false,
    static: ['./export/'],
  }
}
