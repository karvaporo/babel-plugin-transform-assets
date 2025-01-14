import fs from 'fs';
import { dirname, isAbsolute, resolve } from 'path';

import { interpolateName } from 'loader-utils';

const defaultOptions = {
  name: '[name].[ext]?[sha512:hash:base64:7]',
};

export default function transformAssets({ types: t }) {
  function resolveModulePath(filename) {
    const dir = dirname(filename);

    if (isAbsolute(dir)) {
      return dir;
    }

    if (process.env.PWD) {
      return resolve(process.env.PWD, dir);
    }

    return resolve(dir);
  }

  return {
    visitor: {
      CallExpression(path, { file, opts }) {
        const currentConfig = {
          ...defaultOptions,
          ...opts,
        };

        if (typeof currentConfig.name !== 'string') {
          return;
        }

        currentConfig.extensions = currentConfig.extensions || [];

        const {
          callee: {
            name: calleeName,
          },
          arguments: args,
        } = path.node;

        if (calleeName !== 'require' || !args.length || !t.isStringLiteral(args[0])) {
          return;
        }

        if (currentConfig.extensions.find(
          (ext) => args[0].value.endsWith(ext),
        )) {
          const [{ value: filePath }] = args;

          if (!t.isExpressionStatement(path.parent)) {
            const from = resolveModulePath(file.opts.filename);

            const resourcePath = resolve(from, filePath);

            const p = interpolateName({
              resourcePath: resolve(from, filePath),
            }, currentConfig.name, {
              context: from,
              content: fs.readFileSync(resourcePath),
            });

            path.replaceWith(t.StringLiteral(p));
            /* eslint-enable */
          } else {
            path.remove();
          }
        }
      },
    },
  };
}
