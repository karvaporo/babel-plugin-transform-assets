import { transformFileSync } from '@babel/core';
import { expect } from 'chai';
import path from 'path';
import fs from 'fs';
import Vinyl from 'vinyl';
import gulpBabel from 'gulp-babel';

describe('transforms assets', () => {
  const transform = (filename, config = {}) => transformFileSync(
    path.resolve(__dirname, filename),
    {
      babelrc: false,
      presets: ['@babel/env'],
      plugins: [
        ['./src/index.js', config],
      ],
    },
  );

  it('replaces require statements with filename', () => {
    expect(transform('fixtures/require-txt.js', {
      extensions: ['txt'],
    }).code).to.be.equal(`"use strict";

var file = "file.txt?vmiIOMq";`);
  });

  it('replaces import statements with filename', () => {
    expect(transform('fixtures/import-txt.js', {
      extensions: ['txt'],
    }).code).to.be.equal(`"use strict";

var _file = _interopRequireDefault("file.txt?vmiIOMq");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }`);
  });

  it('replaces import statements with filename and then exports', () => {
    expect(transform('fixtures/import-export-txt.js', {
      extensions: ['txt'],
    }).code).to.be.equal(`"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "file", {
  enumerable: true,
  get: function get() {
    return _file["default"];
  }
});
var _file = _interopRequireDefault("file.txt?vmiIOMq");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }`);
  });

  it('replaces import statement with filename via gulp', (cb) => {
    const stream = gulpBabel({
      babelrc: false,
      presets: ['@babel/env'],
      plugins: [
        ['./src/index.js', { extensions: ['txt'] }],
      ],
    });

    stream.on('data', (file) => {
      expect(file.contents.toString()).to.be.equal(`"use strict";

var _file = _interopRequireDefault("file.txt?vmiIOMq");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }`);
    });

    stream.on('end', cb);

    stream.write(new Vinyl({
      cwd: __dirname,
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, 'fixtures/import-txt.js'),
      contents: fs.readFileSync(path.join(__dirname, 'fixtures/import-txt.js')),
    }));

    stream.end();
  });

  it('removes global requires', () => {
    expect(transform('fixtures/empty-require.js', {
      extensions: ['txt'],
    }).code).to.be.equal('"use strict";');
  });

  it('fixtures/empty-import.js', () => {
    expect(transform('fixtures/empty-import.js', {
      extensions: ['txt'],
    }).code).to.be.equal('"use strict";');
  });

  it('fixtures/png-import.js with [contenthash] in name', () => {
    expect(transform('fixtures/png-import.js', {
      extensions: ['png'],
      name: '/images/[contenthash].[ext]',
    }).code).to.be.equal(`"use strict";

var _logo = _interopRequireDefault("/images/b096687fd2b2c782.png");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }`);
  });
});
