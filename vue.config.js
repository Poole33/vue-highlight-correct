const path = require('path');
function resolve(dir) {
    return path.join(__dirname, dir);
}

module.exports = {
    // 修改 src 为 examples
    pages: {
        index: {
            entry: 'examples/main.js',
            template: 'public/index.html',
            filename: 'index.html'
        }
    },
    productionSourceMap: false,
    chainWebpack: config => {
        config.resolve.alias.set('@', resolve('components'));

        /**
       * 无需使用@import在每个scss文件中引入变量或者mixin，也可以避免大量@import导致build变慢
       * sass-resources-loader 文档链接：https://github.com/shakacode/sass-resources-loader
       */
        const oneOfsMap = config.module.rule('scss').oneOfs.store;
        const sassResources = ['include/base.scss', 'include/mixin.scss']; // scss资源文件，可以在里面定义变量，mixin,全局混入样式等
        oneOfsMap.forEach(item => {
            item
                .use('sass-resources-loader')
                .loader('sass-resources-loader')
                .options({
                    resources: sassResources.map(file => path.resolve(__dirname, 'assets/style/' + file))
                })
                .end();
        });
    },
    devServer: {
        overlay: {
            error: false
        }
    }
};
