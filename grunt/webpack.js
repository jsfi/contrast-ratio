module.exports = {
    build: {
        entry: './dev/js/main.js',
        output: {
            filename: 'build/js/main.js'
        },
        module: {
            loaders: [
                { test: /\.json$/, loader: 'json-loader' }
            ]
        }
    }
}
