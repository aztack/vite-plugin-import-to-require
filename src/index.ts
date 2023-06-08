import type { Plugin } from 'vite';
import ts from 'typescript';
import { builtinModules } from 'module';

export const nodeBuiltinModules = new Set(builtinModules);
const nodePrefix = 'node:';

function isNodeBuiltinModule(moduleName: string): boolean {
  if (moduleName.startsWith(nodePrefix)) moduleName = moduleName.replace(nodePrefix, '');
  return nodeBuiltinModules.has(moduleName);
}

function transformImportToRequire(code: string, options: ImportToRequireOption): string {
  const ns = options.namespace ? options.namespace + '.' : '';
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true);
  const printer = ts.createPrinter();
  const transformer = (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        if (options.transformAll || (isNodeBuiltinModule(moduleName) && node.importClause && node.importClause.namedBindings)) {
          if (ts.isNamedImports(node.importClause!.namedBindings!)) {
            const requireStatement = `const { ${node.importClause!.namedBindings.elements.map((e) => e.name.text).join(', ')} } = ${ns}require('${moduleName}')`;
            return ts.factory.createExpressionStatement(ts.factory.createIdentifier(requireStatement));
          } else if (ts.isNamespaceImport(node.importClause!.namedBindings!)) {
            const importName = node.importClause!.namedBindings.name.text;
            const requireStatement = `const { ${importName} } = global.require('${moduleName}')`;
            return ts.factory.createExpressionStatement(ts.factory.createIdentifier(requireStatement));
          }
        }
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (node: any) => ts.visitNode(node, visit);
  };

  const transformedSourceFile = ts.transform(sourceFile, [transformer]).transformed[0];
  return printer.printFile(transformedSourceFile);
}


export interface ImportToRequireOption {
  debug: boolean;
  namespace: string;
  transformAll: boolean;
}

export const defaultImportToRequireOption = {
  debug: false,
  namespace: 'global',
  transformAll: false
}

export function importToRequirePlugin(options: ImportToRequireOption = defaultImportToRequireOption): Plugin {
  const opts: ImportToRequireOption = Object.assign(defaultImportToRequireOption, options);
  return {
    name: 'vite-plugin-node-builtins',
    transform(code, id) {
      if ((id.endsWith('.ts') || id.endsWith('.tsx')) && code.includes('import')) {
        if (opts.debug) console.log(['-'.repeat(id.length), id, '-'.repeat(id.length)].join('\n'));
        const transformedCode = transformImportToRequire(code, opts);
        if (opts.debug) console.log(transformedCode);
        return transformedCode;
      }
    },
  };
}