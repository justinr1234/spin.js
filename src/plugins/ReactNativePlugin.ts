import * as path from 'path';

import Spin from "../Spin";
import { ConfigPlugin } from "../ConfigPlugin";
import { Builder } from "../Builder";
import requireModule from '../requireModule';
import findJSRule from './shared/JSRuleFinder';

let babelRegisterDone = false;

const registerBabel = () => {
    if (!babelRegisterDone) {
        requireModule('babel-register')({
            presets: [
                requireModule.resolve('babel-preset-es2015'),
                requireModule.resolve('babel-preset-flow')
            ],
            ignore: /node_modules(?!\/(haul|react-native))/,
            retainLines: true,
            sourceMaps: 'inline',
        });
        requireModule('babel-polyfill');

        babelRegisterDone = true;
    }
};

export default class ReactNativePlugin implements ConfigPlugin {
    configure(builder: Builder, spin: Spin) {
        const stack = builder.stack;

        if (stack.hasAll(['react-native', 'webpack'])) {
            registerBabel();

            const webpack = requireModule('webpack');

            const mobileAssetTest = /\.(bmp|gif|jpg|jpeg|png|psd|svg|webp|m4v|aac|aiff|caf|m4a|mp3|wav|html|pdf|ttf)$/;

            const AssetResolver = requireModule('haul/src/resolvers/AssetResolver');
            const HasteResolver = requireModule('haul/src/resolvers/HasteResolver');

            const reactNativeRule = {
                loader: requireModule.resolve('babel-loader'),
                options: {
                    cacheDirectory: spin.dev,
                    presets: [requireModule.resolve('babel-preset-react-native')],
                    plugins: [
                        requireModule.resolve('haul/src/utils/fixRequireIssues'),
                    ],
                },
            };

            const jsRule = findJSRule(builder);
            jsRule.exclude = /node_modules\/(?!react-native|@expo|expo|lottie-react-native|haul|pretty-format|react-navigation)$/;
            const origUse = jsRule.use;
            jsRule.use = function (req) {
                let result;
                if (req.resource.indexOf('node_modules') >= 0) {
                    result = reactNativeRule;
                } else {
                    result = origUse;
                }
                return result;
            };

            builder.config = spin.merge(builder.config, {
                module: {
                    rules: [{
                        test: mobileAssetTest,
                        use: {
                            loader: require.resolve('./react-native/assetLoader'),
                            query: {
                                platform: stack.platform,
                                root: path.resolve('.'),
                                bundle: false
                            },
                        },
                    }],
                },
                resolve: {
                    plugins: [
                        new HasteResolver({
                            directories: [path.resolve('node_modules/react-native')],
                        }),
                        new AssetResolver({
                            platform: stack.platform,
                            test: mobileAssetTest
                        }),
                    ],
                    mainFields: ['react-native', 'browser', 'main']
                },
            });

            if (stack.hasAny('dll')) {
                builder.config = spin.merge(builder.config, {
                    entry: {
                        vendor: [
                            require.resolve('./react-native/react-native-polyfill.js'),
                        ],
                    },
                });
            } else {
                const idx = builder.config.entry.index.indexOf('babel-polyfill');
                if (idx >= 0) {
                    builder.config.entry.index.splice(idx, 1);
                }
                builder.config = spin.merge({
                    plugins: [
                        new webpack.SourceMapDevToolPlugin({
                            test: /\.(js|jsx|css|bundle)($|\?)/i,
                            filename: '[file].map',
                        }),
                    ],
                    entry: {
                        index: [
                            require.resolve('./react-native/react-native-polyfill.js')
                        ],
                    },
                }, builder.config);
            }
        }
    }
}