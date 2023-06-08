"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importToRequirePlugin = exports.defaultImportToRequireOption = exports.nodeBuiltinModules = void 0;
const typescript_1 = __importDefault(require("typescript"));
const module_1 = require("module");
exports.nodeBuiltinModules = new Set(module_1.builtinModules);
const nodePrefix = 'node:';
function isNodeBuiltinModule(moduleName) {
    if (moduleName.startsWith(nodePrefix))
        moduleName = moduleName.replace(nodePrefix, '');
    return exports.nodeBuiltinModules.has(moduleName);
}
function transformImportToRequire(code, options) {
    const ns = options.namespace ? options.namespace + '.' : '';
    const sourceFile = typescript_1.default.createSourceFile('temp.ts', code, typescript_1.default.ScriptTarget.ESNext, true);
    const printer = typescript_1.default.createPrinter();
    const transformer = (context) => {
        const visit = (node) => {
            if (typescript_1.default.isImportDeclaration(node) && typescript_1.default.isStringLiteral(node.moduleSpecifier)) {
                const moduleName = node.moduleSpecifier.text;
                if (options.transformAll || (isNodeBuiltinModule(moduleName) && node.importClause && node.importClause.namedBindings)) {
                    if (typescript_1.default.isNamedImports(node.importClause.namedBindings)) {
                        const requireStatement = `const { ${node.importClause.namedBindings.elements.map((e) => e.name.text).join(', ')} } = ${ns}require('${moduleName}')`;
                        return typescript_1.default.factory.createExpressionStatement(typescript_1.default.factory.createIdentifier(requireStatement));
                    }
                    else if (typescript_1.default.isNamespaceImport(node.importClause.namedBindings)) {
                        const importName = node.importClause.namedBindings.name.text;
                        const requireStatement = `const { ${importName} } = global.require('${moduleName}')`;
                        return typescript_1.default.factory.createExpressionStatement(typescript_1.default.factory.createIdentifier(requireStatement));
                    }
                }
            }
            return typescript_1.default.visitEachChild(node, visit, context);
        };
        return (node) => typescript_1.default.visitNode(node, visit);
    };
    const transformedSourceFile = typescript_1.default.transform(sourceFile, [transformer]).transformed[0];
    return printer.printFile(transformedSourceFile);
}
exports.defaultImportToRequireOption = {
    debug: false,
    namespace: 'global',
    transformAll: false
};
function importToRequirePlugin(options = exports.defaultImportToRequireOption) {
    const opts = Object.assign(exports.defaultImportToRequireOption, options);
    return {
        name: 'vite-plugin-node-builtins',
        transform(code, id) {
            if ((id.endsWith('.ts') || id.endsWith('.tsx')) && code.includes('import')) {
                if (opts.debug)
                    console.log(['-'.repeat(id.length), id, '-'.repeat(id.length)].join('\n'));
                const transformedCode = transformImportToRequire(code, opts);
                if (opts.debug)
                    console.log(transformedCode);
                return transformedCode;
            }
        },
    };
}
exports.importToRequirePlugin = importToRequirePlugin;
