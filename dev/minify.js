const minify = require('@node-minify/core');
const uglifyjs = require('@node-minify/uglify-js');

/**
 * Generates a minified build of the source JavaScript and saves with the source map
 * to the lib/ directory.
 */
const myArgs = process.argv.slice(2);
if (myArgs.length == 1) {
    const input = `src/lob-address-elements.js`;
    const output = `lib/lob-address-elements-${myArgs[0]}.min.js`;
    const filename = `lib/lob-address-elements-${myArgs[0]}.min.js.map`;
    const url = `lob-address-elements-${myArgs[0]}.min.js.map`;
    minify({
        compressor: uglifyjs,
        input,
        output,
        options: {
            sourceMap: {
                filename,
                url
            }
        }
    }).then(function (min) {
        console.info('\x1b[34m', `Created lib/lob-address-elements-${myArgs[0]}.min.js [${min.length} bytes]`, '\x1b[0m');
    }, function (err) {
        console.error('\x1b[31m', 'ERROR Compressing file', '\x1b[0m');
        console.error(err);
    });
} else {
    console.error('\x1b[31m', 'You must provide the version number. For example, `npm run build 1.1.1`','\x1b[0m');
}

