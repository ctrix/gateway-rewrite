gateway-rewrite
===============

Node.js middleware to execute CGI scripts with URL rewriting

/(Modified from gateway by Felix Gnass and added url rewriting capabilities)/

Purpose of this module is to allow development tools like
[Yeoman](http://yeoman.io) or [Livestyle](https://github.com/One-com/livestyle)
to serve PHP files (and possibly other scripting languages) directly, simulating apache url rewriting.
This is particularly useful when using PHP and Slim library in company with grunt-server


To make this work you need the `php-cgi` binaray in your PATH.

## Usage

```javascript
var http = require('http');
var gateway_rw = require('gateway-rewrite');

var rwGateway = function (dir){
    return gateway_rw(require('path').resolve(dir), {
       rules: [
          {
            rule: '^(/api/.+)',
            cgi:  '/usr/bin/php-cgi',
            to:   '/api/index.php'
          }
        ]},
        grunt
    );
  };


  grunt.initConfig({

   (more here)

    connect: {
        options: {
          hostname: 'localhost',
          port: 9000
        },
        livereload: {
          options: {
            middleware: function (connect, options) {
                return [
                    /* Let's see if the rule matches something to rewrite */
                    rwGateway(sysConfig.build_dir),
                    /* Otherwise it's a static file */
                    mountFolder(connect, sysConfig.build_dir)
                ];
            }
          }
        }
    },
  });


```

## Installing php-cgi

My preferred way is to use APT and install the php5-cgi package.

Alternatively, the `php-cgi` binary can be installed via Homebrew by tapping the
[homebrew-php](https://github.com/josegonzalez/homebrew-php) repository:

    brew tap homebrew/dupes
    brew tap josegonzalez/homebrew-php
    brew install php54


## Directories

if the request URI matches the regular expression *rule*, then the *cgi* binary is used
rewriting to the PHP file in the *to* option.

The *rules* option is an array so you can add as many rewrite rules you need.

## License

(The MIT License)

Copyright (c) 2013 Massimo Cetra

Thanks to Felix Gnass for the inspiration.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
