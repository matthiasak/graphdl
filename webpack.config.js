let config =
	require("@terse/webpack")
	.api()
    .entry({
    	index: "./src/index.js",
    	example: "./src/example.js"
    })
    .loader(
    	'babel-loader'
    	, '.js'
    	, {
        	exclude: /node_modules/
	        , query: {
	        	cacheDirectory: true
	        	, presets: ['stage-0']
	        	, env: {
	        		production: {
	        			presets: ["babili"]
	        		}
	        	}
	        }
	    })
    .plugin("webpack.NamedModulesPlugin")
    .plugin("optimize-js-plugin")
    .plugin("webpack.NoErrorsPlugin")
    .sourcemap("source-map")
    .externals(/^@?\w[a-z\-0-9\./]+$/)
    .output({
    	path:'./build'
    	, library: 'graphdl'
		, libraryTarget: 'commonjs2'
    })
    .target("async-node")
    .when("development", api =>
    	api
            .entry({
                index: [
                    "webpack/hot/poll?500"
                    , "./src/index.js"
                ],
                example: './src/example.js'
            })
            .plugin("webpack.HotModuleReplacementPlugin")
            .plugin('start-server-webpack-plugin', 'example.js'))
    .getConfig()

delete config.module.preLoaders

module.exports = config