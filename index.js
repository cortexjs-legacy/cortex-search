'use strict';

var search = require('cortex-search-utils')('http://couch.cortex.dp');
var color = require('bash-color');
var columnify = require('columnify');

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