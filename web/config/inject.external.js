const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = class InjectExternals {
  apply (compiler) {
    compiler.hooks.compilation.tap('InjectExternals', (compilation) => {
      console.log('The compiler is starting a new compilation...')

      // Static Plugin interface |compilation |HOOK NAME | register listener 
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        'InjectExternals',
        (data, cb) => {
          let externals = data.plugin.options.externals;
          if(!externals) cb(null, data);

          let tags = externals.map(url => {
            return {
              tagName: 'script',
              voidTag: false,
              attributes: {
                src: url
              },
              innerHTML: ""
            };
          });

          data.headTags = [...data.headTags, ...tags];
          // Manipulate the content
          data.html += 'The Magic Footer'
          // Tell webpack to move on
          cb(null, data)
        }
      )
    })
  }
}
