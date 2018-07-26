const path = require('path');
const { createConfig, babel, postcss } = require('webpack-blocks');

module.exports = {
	styleguideComponents: {
		Wrapper: path.join(__dirname, './StyleguidistWrapper'),
	},
	webpackConfig:                createConfig([babel(), postcss()]),
	styleguideDir:                'build',
	exampleMode:                  'expand',
	usageMode:                    'expand',
	pagePerSection:               true,
	skipComponentsWithoutExample: true,
};
