'use strict';

var url = require('url');
var color = require('colors');
var columnify = require('columnify');
var modified = require('modified');
var node_path = require('path');
var crypto = require('crypto');

var profile = require('cortex-profile')().init();

var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var request = modified({
    cacheMapper: function(options, callback) {
        var method = options.method.toLowerCase();
        var p = url.parse(options.url);
        var search = p.search;
        var path = p.pathname;
        if (path) {
            var filename = '';
            if (search || (method != 'get')) {
                var md5 = crypto.createHash('md5');
                md5.update(search);
                md5.update(method);
                filename = md5.digest('hex');
            }

            callback(
                null,
                node_path.join(homeDir, '.cache/cortex/search', path, filename) + '.cache'
            );
        } else {
            callback(null, null);
        }
    }
});

var search = require('cortex-search-utils')(profile.get('registry').replace(/\/$/, '') + ':' + profile.get('registry_port'), {
    request: request
});

module.exports = function(args, options, cb) {
    args = args || [];

    var width = getMaxWidth();
    var sort = options.sort || 'name';
    var searchRev = !! options.searchRev;
    var splitter = options.splitter || ' ';

    search.searchByWord(args, function(err, rows) {
        if (err) {
            return cb(err.message);
        }

        if (rows.length == 0) {
            return cb('No match found for "' + args.join(' ') + '"');
        }

        rows = rows.map(function(row) {
            row.keywords = row.keywords.join(' ');
            delete row.url;
            return row;
        });

        if (!rows.hasOwnProperty(sort))
            sort = 'name';

        rows.sort(function(a, b) {
            var aa = a[sort].toLowerCase(),
                bb = b[sort].toLowerCase()
                return aa === bb ? 0 : aa < bb ? -1 : 1
        })

        if (searchRev) rows.reverse();


        var out = columnify(rows, {
            include: ['name', 'description', 'authors', 'latest', 'keywords'],
            truncate: width != Infinity,
            columnSplitter: splitter,
            config: {
                name: {
                    maxWidth: 40,
                    truncate: false,
                    truncateMarker: ''
                },
                description: {
                    maxWidth: 60
                },
                author: {
                    maxWidth: 20
                },
                date: {
                    maxWidth: 11
                },
                version: {
                    maxWidth: 11
                },
                keywords: {
                    maxWidth: Infinity // last column
                }
            }
        });


        if (width != Infinity)
            out = out.split('\n').map(function(line) {
                if (line.wcwidth > width) {
                    line = line.slice(0, width - line.wcwidth);
                }

                return line.slice(0, width);
            }).join('\n');

        args.forEach(function(arg) {
            out = out.replace(new RegExp(arg, "gi"), function(bit) {
                return color.red(arg);
            });
        });

        cb(null, out);
    });
};


function getMaxWidth() {
    try {
        var tty = require("tty"),
            stdout = process.stdout,
            cols = !tty.isatty(stdout.fd) ? Infinity : process.stdout.columns;
        cols = (cols == 0) ? Infinity : cols;
    } catch (e) {
        cols = Infinity;
    }
    return cols
}