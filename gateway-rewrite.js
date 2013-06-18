'use strict';

var fs = require('fs'),
    URL = require('url'),
    path = require('path'),
    extname = path.extname,
    normalize = path.normalize,
    join = path.join,
    spawn = require('child_process').spawn,
    statusExp = /^Status:\s*(\d{3}) (.*)$/i


module.exports = function gateway_rewrite(docroot, options) {

    // docroot is required
    if (!docroot) {
        throw new Error('gateway_rewrite() requires docroot')
    }

    // default mappings
    options = options || {}
    options.rules = options.rules || [];

    return function (req, res, next) {
        var exit, statusCode, reason, body;

        function error(code, reason, headers) {
            res.writeHead(code || 500, reason, headers)
            res.end()
        }

        function done() {
            if (exit === undefined) {
                return
            }

            if (exit && !body) {
                error(500, handler + ' exited with code ' + exit)
            }
            else {
                res.end()
            }
        }

        var matches = 0;
        var url = URL.parse(req.url)

        req.pause()

        for (var j = 0; j < options.rules.length && !matches; j++) {
            var rule = options.rules[j].rule;
            var re = new RegExp(rule);

            if (url.pathname.match(re)) {
                matches ++;
                var handler = options.rules[j].cgi
                var file = options.rules[j].to
                var uri = url.pathname
                var path = normalize(join(docroot, file))

                // populate the environment
                var host = (req.headers.host || '').split(':')
                var env = {
                    SERVER_ROOT: docroot,
                    DOCUMENT_ROOT: docroot,
                    SERVER_NAME: host[0],
                    SERVER_PORT: host[1] || 80,
                    HTTPS: req.connection.encrypted ? 'On' : 'Off',
                    REDIRECT_STATUS: 200,

                    SCRIPT_NAME: file,
                    REQUEST_URI: uri,
                    SCRIPT_FILENAME: path,
                    PATH_TRANSLATED: path,
                    REQUEST_METHOD: req.method,
                    QUERY_STRING: url.query || '',
                    GATEWAY_INTERFACE: 'CGI/1.1',
                    SERVER_PROTOCOL: 'HTTP/1.1',
                    PATH: process.env.PATH,
                    __proto__: options.env || {},

                    REMOTE_ADDR: '127.0.0.1' // Fake
                }

                // expose request headers
                for (var header in req.headers) {
                    var name = 'HTTP_' + header.toUpperCase().replace(/-/g, '_')
                    env[name] = req.headers[header]
                }

                if ('content-length' in req.headers) {
                    env.CONTENT_LENGTH = req.headers['content-length']
                }

                if ('content-type' in req.headers) {
                    env.CONTENT_TYPE = req.headers['content-type']
                }


                var child = spawn(handler, [], {
                    'env': env
                }).on('exit', function (code) {
                    exit = code
                    done()
                })

                var line = []

                child.stdout.on('end', done).on('data', function (buf) {

                    if (body) {
                        return res.write(buf)
                    }

                    for (var i = 0; i < buf.length; i++) {

                        var c = buf[i]

                        if (c == 0xA) {
                            if (!line.length) {
                                body = true
                                res.writeHead(statusCode || 200, reason)
                                res.write(buf.slice(i + 1))
                                return
                            }

                            var s = line.join('')
                            line = []
                            if (!statusCode) {
                                var m = statusExp.exec(s)
                                if (m) {
                                    statusCode = m[1]
                                    reason = m[2]
                                    continue;
                                }
                            }

                            var idx = s.indexOf(':')
                            if ( !body ) {
                            }
                                res.setHeader(s.slice(0, idx), s.slice(idx + 1).trim())
                        } else if (c != 0xD) {
                            line.push(String.fromCharCode(c))
                        }
                    }

                })

                req.pipe(child.stdin)
            }
        }

        req.resume()

        if (options.stderr) {
            child.stderr.pipe(options.stderr)
        }

        if ( matches == 0 ) {
            return next();
        }

    }
}

