module.exports = {
    build: {
        entry: './dev/js/main.js',
        output: {
            filename: 'js/main.js'
        },
        module: {
            loaders: [
                { test: /\.json$/, loader: 'json-loader' }
            ]
        }
    }
}
