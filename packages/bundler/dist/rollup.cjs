"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve3, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve3(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/rollup.ts
var rollup_exports = {};
__export(rollup_exports, {
  rollup: () => rollup
});
module.exports = __toCommonJS(rollup_exports);

// src/Bundle.ts
var MagicString2 = __toESM(require("magic-string"), 1);

// src/Graph.ts
var import_path2 = require("path");

// src/Module.ts
var import_magic_string = __toESM(require("magic-string"), 1);
var import_ast_parser3 = require("ast-parser");

// src/utils/obejct.ts
var keys = Object.keys;
var values = Object.values;

// src/ast/Declaration.ts
var Declaration = class {
  constructor(node, isParam, statement) {
    this.isFunctionDeclaration = false;
    this.name = null;
    this.isParam = false;
    this.isUsed = false;
    this.isReassigned = false;
    if (node) {
      if (node.type === "FunctionDeclaration") {
        this.isFunctionDeclaration = true;
        this.functionNode = node;
      } else if (node.type === "VariableDeclarator" && node.init && /FunctionExpression/.test(node.init.type)) {
        this.isFunctionDeclaration = true;
        this.functionNode = node.init;
      }
    }
    this.statement = statement;
    this.isParam = isParam;
  }
  addReference(reference) {
    reference.declaration = this;
    this.name = reference.name;
  }
  use() {
    this.isUsed = true;
    if (this.statement) {
      this.statement.mark();
    }
  }
  render() {
    return this.name;
  }
};
var SyntheticDefaultDeclaration = class extends Declaration {
  constructor(node, name, statement) {
    super(node, false, statement);
    this.original = null;
    this.exportName = "";
    this.name = name;
  }
  render() {
    var _a;
    return ((_a = this.original) == null ? void 0 : _a.render()) || this.name;
  }
  bind(declaration) {
    this.original = declaration;
  }
};
var SyntheticNamespaceDeclaration = class extends Declaration {
  constructor(module2) {
    super(null, false, null);
    this.originals = {};
    this.needsNamespaceBlock = false;
    this.module = module2;
    module2.getExports().forEach((name) => {
      const declaration = module2.traceExport(name);
      if (declaration) {
        this.originals[name] = declaration;
      }
    });
  }
  addReference(reference) {
    if (!this.needsNamespaceBlock) {
      this.needsNamespaceBlock = true;
    }
    if (reference.objectPaths.length) {
      const ref = reference.objectPaths.shift();
      reference.name = ref.name;
      reference.start = ref.start;
      reference.end = ref.end;
    }
    values(this.originals).forEach((declaration) => {
      declaration.addReference(reference);
    });
    super.addReference(reference);
  }
  renderBlock(intentString = "  ") {
    const members = keys(this.originals).map((name) => {
      const originDeclaration = this.originals[name];
      return `${intentString}${name}: ${originDeclaration.render()}`;
    }).join(",\n");
    return `const ${this.render()} = Object.freeze({
${members}
});`;
  }
  use() {
    for (const original of values(this.originals)) {
      original.use();
    }
  }
};

// src/ast/Scope.ts
var Scope = class {
  constructor(options) {
    // 变量/函数 声明节点，为 Scope 的核心数据
    this.declarations = {};
    const { parent, paramNodes, block, statement } = options;
    this.parent = parent;
    this.paramNodes = paramNodes || [];
    this.statement = statement;
    this.isBlockScope = !!block;
    this.paramNodes.forEach(
      (node) => this.declarations[node.name] = new Declaration(
        node,
        true,
        this.statement
      )
    );
  }
  addDeclaration(node, isBlockDeclaration) {
    if (this.isBlockScope && !isBlockDeclaration && this.parent) {
      this.parent.addDeclaration(node, isBlockDeclaration);
      return;
    }
    const key = node.id && node.id.name;
    this.declarations[key] = new Declaration(node, false, this.statement);
  }
  // 遍历声明节点(Declaration)
  eachDeclaration(fn) {
    keys(this.declarations).forEach((key) => {
      fn(key, this.declarations[key]);
    });
  }
  contains(name) {
    return this.findDeclaration(name);
  }
  findDeclaration(name) {
    return this.declarations[name] || this.parent && this.parent.findDeclaration(name);
  }
};

// src/utils/isFunctionDeclaration.ts
var import_ast_parser = require("ast-parser");
function isFunctionDeclaration(node) {
  if (!node) return false;
  return (
    // function foo() {}
    node.type === "FunctionDeclaration" || // const foo = function() {}
    node.type === import_ast_parser.NodeType.VariableDeclarator && node.init && node.init.type === import_ast_parser.NodeType.FunctionExpression || // export function ...
    // export default function
    (node.type === import_ast_parser.NodeType.ExportNamedDeclaration || node.type === import_ast_parser.NodeType.ExportDefaultDeclaration) && !!node.declaration && node.declaration.type === import_ast_parser.NodeType.FunctionDeclaration
  );
}
function isExportDeclaration(node) {
  return /^Export/.test(node.type);
}
function isImportDeclaration(node) {
  return node.type === "ImportDeclaration";
}

// src/utils/walk.ts
var shouldSkip;
var shouldAbort;
function walk(ast, { enter, leave }) {
  shouldAbort = false;
  visit(ast, null, enter, leave);
}
var context = {
  skip: () => shouldSkip = true,
  abort: () => shouldAbort = true
};
var childKeys = {};
var toString = Object.prototype.toString;
function isArray(thing) {
  return toString.call(thing) === "[object Array]";
}
function visit(node, parent, enter, leave, prop) {
  if (!node || shouldAbort) return;
  if (enter) {
    shouldSkip = false;
    enter.call(context, node, parent, prop);
    if (shouldSkip || shouldAbort) return;
  }
  let keys2 = childKeys[node.type] || (childKeys[node.type] = Object.keys(node).filter(
    (key2) => typeof node[key2] === "object"
  ));
  let key, value;
  for (let i = 0; i < keys2.length; i++) {
    key = keys2[i];
    value = node[key];
    if (isArray(value)) {
      for (let j = 0; j < value.length; j++) {
        visit(value[j], node, enter, leave, key);
      }
    } else if (value && value.type) {
      visit(value, node, enter, leave, key);
    }
  }
  if (leave && !shouldAbort) {
    leave(node, parent, prop);
  }
}

// src/utils/buildScope.ts
var import_ast_parser2 = require("ast-parser");
function buildScope(statement) {
  const { node, scope: initialScope } = statement;
  let scope = initialScope;
  walk(node, {
    enter(node2) {
      if (node2.type === import_ast_parser2.NodeType.FunctionDeclaration) {
        scope.addDeclaration(node2, false);
      }
      if (node2.type === import_ast_parser2.NodeType.VariableDeclaration) {
        const currentNode = node2;
        const isBlockDeclaration = currentNode.kind !== "var";
        currentNode.declarations.forEach((declarator) => {
          scope.addDeclaration(declarator, isBlockDeclaration);
        });
      }
      let newScope;
      if (node2.type === import_ast_parser2.NodeType.FunctionDeclaration) {
        const currentNode = node2;
        newScope = new Scope({
          parent: scope,
          block: false,
          paramNodes: currentNode.params,
          statement
        });
      }
      if (node2.type === import_ast_parser2.NodeType.BlockStatement) {
        newScope = new Scope({
          parent: scope,
          block: true,
          statement
        });
      }
      if (newScope) {
        Object.defineProperty(node2, "_scope", {
          value: newScope,
          configurable: true
        });
        scope = newScope;
      }
    },
    leave(node2) {
      if (node2._scope && scope.parent) {
        scope = scope.parent;
      }
    }
  });
}

// src/ast/Reference.ts
var Reference = class {
  constructor(node, scope, statement) {
    // declaration 信息在构建依赖图的部分补充
    this.declaration = null;
    this.objectPaths = [];
    this.node = node;
    this.scope = scope;
    this.statement = statement;
    this.start = node.start;
    this.end = node.end;
    let root = node;
    this.objectPaths = [];
    while (root.type === "MemberExpression") {
      this.objectPaths.unshift(root.property);
      root = root.object;
    }
    this.objectPaths.unshift(root);
    this.name = root.name;
  }
};

// src/utils/findReference.ts
function isReference(node, parent) {
  if (node.type === "MemberExpression" && parent.type !== "MemberExpression") {
    return true;
  }
  if (node.type === "Identifier") {
    if (parent.type === "ExportSpecifier" && node !== parent.local)
      return false;
    return true;
  }
  return false;
}
function findReference(statement) {
  const { references, scope: initialScope, node } = statement;
  let scope = initialScope;
  walk(node, {
    enter(node2, parent) {
      if (node2._scope) scope = node2._scope;
      if (isReference(node2, parent)) {
        const reference = new Reference(node2, scope, statement);
        references.push(reference);
      }
    },
    leave(node2) {
      if (node2._scope && scope.parent) {
        scope = scope.parent;
      }
    }
  });
}

// src/Statement.ts
var Statement = class {
  constructor(node, magicString, module2) {
    this.isIncluded = false;
    this.defines = /* @__PURE__ */ new Set();
    this.modifies = /* @__PURE__ */ new Set();
    this.dependsOn = /* @__PURE__ */ new Set();
    this.references = [];
    this.magicString = magicString;
    this.node = node;
    this.module = module2;
    this.scope = new Scope({
      statement: this
    });
    this.start = node.start;
    this.next = 0;
    this.isImportDeclaration = isImportDeclaration(node);
    this.isExportDeclaration = isExportDeclaration(node);
    this.isReexportDeclaration = this.isExportDeclaration && !!node.source;
    this.isFunctionDeclaration = isFunctionDeclaration(
      node
    );
  }
  analyse() {
    if (this.isImportDeclaration) return;
    buildScope(this);
    findReference(this);
  }
  mark() {
    if (this.isIncluded) {
      return;
    }
    this.isIncluded = true;
    this.references.forEach(
      (ref) => ref.declaration && ref.declaration.use()
    );
  }
};

// src/Module.ts
var Module = class {
  constructor({ path, bundle, code, loader, isEntry = false }) {
    this.isEntry = false;
    this.exportAllSources = [];
    this.exportAllModules = [];
    this.dependencies = [];
    this.dependencyModules = [];
    this.referencedModules = [];
    this.id = path;
    this.bundle = bundle;
    this.moduleLoader = loader;
    this.isEntry = isEntry;
    this.path = path;
    this.code = code;
    this.magicString = new import_magic_string.default(code);
    this.imports = {};
    this.exports = {};
    this.reexports = {};
    this.declarations = {};
    try {
      const ast = (0, import_ast_parser3.parse)(code);
      const nodes = ast.body;
      this.statements = nodes.map((node) => {
        const magicString = this.magicString.snip(node.start, node.end);
        return new Statement(node, magicString, this);
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
    this.analyseAST();
  }
  analyseAST() {
    this.statements.forEach((statement) => {
      statement.analyse();
      if (statement.isImportDeclaration) {
        this.addImports(statement);
      } else if (statement.isExportDeclaration) {
        this.addExports(statement);
      }
      if (!statement.scope.parent) {
        statement.scope.eachDeclaration((name, declaration) => {
          this.declarations[name] = declaration;
        });
      }
    });
    const statements = this.statements;
    let next = this.code.length;
    for (let i = statements.length - 1; i >= 0; i--) {
      statements[i].next = next;
      next = statements[i].start;
    }
  }
  addDependencies(source) {
    if (!this.dependencies.includes(source)) {
      this.dependencies.push(source);
    }
  }
  addImports(statement) {
    const node = statement.node;
    const source = node.source.value;
    node.specifiers.forEach((specifier) => {
      const isDefault = specifier.type === "ImportDefaultSpecifier";
      const isNamespace = specifier.type === "ImportNamespaceSpecifier";
      const localName = specifier.local.name;
      const name = isDefault ? "default" : isNamespace ? "*" : specifier.imported.name;
      this.imports[localName] = { source, name, localName };
    });
    this.addDependencies(source);
  }
  addExports(statement) {
    const node = statement.node;
    const source = node.source && node.source.value;
    if (node.type === "ExportNamedDeclaration") {
      if (node.specifiers.length) {
        node.specifiers.forEach((specifier) => {
          const localName = specifier.local.name;
          const exportedName = specifier.exported.name;
          this.exports[exportedName] = {
            localName,
            name: exportedName
          };
          if (source) {
            this.reexports[localName] = {
              statement,
              source,
              localName,
              name: localName,
              module: void 0
            };
            this.imports[localName] = {
              source,
              localName,
              name: localName
            };
            this.addDependencies(source);
          }
        });
      } else {
        const declaration = node.declaration;
        let name;
        if (declaration.type === "VariableDeclaration") {
          name = declaration.declarations[0].id.name;
        } else {
          name = declaration.id.name;
        }
        this.exports[name] = {
          statement,
          localName: name,
          name
        };
      }
    } else if (node.type === "ExportDefaultDeclaration") {
      const identifier = (
        // export default foo;
        node.declaration.id && node.declaration.id.name || // export defualt function foo(){}
        node.declaration.name
      );
      this.exports["default"] = {
        statement,
        localName: identifier,
        name: "default"
      };
      this.declarations["default"] = new SyntheticDefaultDeclaration(
        node,
        identifier,
        statement
      );
    } else if (node.type === "ExportAllDeclaration") {
      if (source) {
        this.exportAllSources.push(source);
        this.addDependencies(source);
      }
    }
  }
  bind() {
    this.bindImportSpecifiers();
    this.bindReferences();
  }
  bindImportSpecifiers() {
    [...Object.values(this.imports), ...Object.values(this.reexports)].forEach(
      (specifier) => {
        specifier.module = this._getModuleBySource(specifier.source);
      }
    );
    this.exportAllModules = this.exportAllSources.map(
      this._getModuleBySource.bind(this)
    );
    this.dependencyModules = this.dependencies.map(
      this._getModuleBySource.bind(this)
    );
    this.dependencyModules.forEach((module2) => {
      module2.referencedModules.push(this);
    });
  }
  bindReferences() {
    if (this.declarations["default"] && this.exports["default"].localName) {
      const declaration = this.trace(this.exports["default"].localName);
      if (declaration) {
        this.declarations["default"].bind(
          declaration
        );
      }
    }
    this.statements.forEach((statement) => {
      statement.references.forEach((reference) => {
        const declaration = reference.scope.findDeclaration(reference.name) || this.trace(reference.name);
        if (declaration) {
          declaration.addReference(reference);
        }
      });
    });
  }
  getOrCreateNamespace() {
    if (!this.declarations["*"]) {
      this.declarations["*"] = new SyntheticNamespaceDeclaration(this);
    }
    return this.declarations["*"];
  }
  trace(name) {
    if (this.declarations[name]) {
      return this.declarations[name];
    }
    if (this.imports[name]) {
      const importSpecifier = this.imports[name];
      const importModule = importSpecifier.module;
      if (importSpecifier.name === "*") {
        return importModule.getOrCreateNamespace();
      }
      const declaration = importModule.traceExport(importSpecifier.name);
      if (declaration) {
        return declaration;
      }
    }
    return null;
  }
  // 从导出名追溯到 Declaration 声明节点
  traceExport(name) {
    const reexportDeclaration = this.reexports[name];
    if (reexportDeclaration) {
      const declaration = reexportDeclaration.module.traceExport(
        reexportDeclaration.localName
      );
      if (!declaration) {
        throw new Error(
          `${reexportDeclaration.localName} is not exported by module ${reexportDeclaration.module.path}(imported by ${this.path})`
        );
      }
      return declaration;
    }
    const exportDeclaration = this.exports[name];
    if (exportDeclaration) {
      const declaration = this.trace(name);
      if (declaration) {
        return declaration;
      }
    }
    for (let exportAllModule of this.exportAllModules) {
      const declaration = exportAllModule.trace(name);
      if (declaration) {
        return declaration;
      }
    }
    return null;
  }
  render() {
    const source = this.magicString.clone().trim();
    this.statements.forEach((statement) => {
      if (!statement.isIncluded) {
        source.remove(statement.start, statement.next);
        return;
      }
      statement.references.forEach((reference) => {
        const { start, end } = reference;
        const declaration = reference.declaration;
        if (declaration) {
          const name = declaration.render();
          source.overwrite(start, end, name);
        }
      });
      if (statement.isExportDeclaration && !this.isEntry) {
        if (statement.node.type === "ExportNamedDeclaration" && statement.node.specifiers.length) {
          source.remove(statement.start, statement.next);
        } else if (statement.node.type === "ExportNamedDeclaration" && (statement.node.declaration.type === "VariableDeclaration" || statement.node.declaration.type === "FunctionDeclaration")) {
          source.remove(
            statement.node.start,
            statement.node.declaration.start
          );
        } else if (statement.node.type === "ExportAllDeclaration") {
          source.remove(statement.start, statement.next);
        } else if (statement.node.type === "ExportDefaultDeclaration") {
          const defaultDeclaration = this.declarations["default"];
          const defaultName = defaultDeclaration.render();
          if (statement.node.declaration.type === "FunctionDeclaration") {
            if (statement.node.declaration.id) {
              source.overwrite(
                statement.node.start,
                statement.node.declaration.start,
                `const ${defaultName} = `
              );
            } else {
              source.overwrite(
                statement.node.start,
                statement.node.declaration.start + 8,
                `function ${defaultName}`
              );
            }
          } else {
            source.overwrite(
              statement.node.start,
              statement.node.declaration.start,
              `const ${defaultName} = `
            );
          }
        }
      }
    });
    if (this.declarations["*"]) {
      const namespaceDeclaration = this.declarations["*"];
      if (namespaceDeclaration.needsNamespaceBlock) {
        source.append(`

${namespaceDeclaration.renderBlock()}
`);
      }
    }
    return source.trim();
  }
  getExports() {
    return [
      ...keys(this.exports),
      ...keys(this.reexports),
      ...this.exportAllModules.map(
        (module2) => module2.getExports().filter((name) => name !== "default")
      ).flat()
    ];
  }
  _getModuleBySource(source) {
    const id = this.moduleLoader.resolveId(source, this.path);
    return this.bundle.getModuleById(id);
  }
};

// src/utils/resolve.ts
var import_path = require("path");
function defaultResolver(id, importer) {
  if ((0, import_path.isAbsolute)(id)) return id;
  if (!id.startsWith(".")) return false;
  const resolvedPath = importer ? (0, import_path.resolve)((0, import_path.dirname)(importer), id) : (0, import_path.resolve)(id);
  return resolvedPath;
}

// src/ModuleLoader.ts
var import_promises = require("fs/promises");
var ModuleLoader = class {
  constructor(bundle) {
    this.resolveIdsMap = /* @__PURE__ */ new Map();
    this.bundle = bundle;
  }
  // 解析模块逻辑
  resolveId(id, importer) {
    const cacheKey = id + importer;
    if (this.resolveIdsMap.has(cacheKey)) {
      return this.resolveIdsMap.get(cacheKey);
    }
    const resolved = defaultResolver(id, importer);
    this.resolveIdsMap.set(cacheKey, resolved);
    return resolved;
  }
  // 加载模块并解析
  fetchModule(_0, _1) {
    return __async(this, arguments, function* (id, importer, isEntry = false, bundle = this.bundle, loader = this) {
      const path = this.resolveId(id, importer);
      if (path === false) {
        return null;
      }
      const existModule = this.bundle.getModuleById(path);
      if (existModule) {
        return existModule;
      }
      const code = yield (0, import_promises.readFile)(path, { encoding: "utf-8" });
      const module2 = new Module({
        path,
        code,
        bundle,
        loader,
        isEntry
      });
      this.bundle.addModule(module2);
      yield this.fetchAllDependencies(module2);
      return module2;
    });
  }
  fetchAllDependencies(module2) {
    return __async(this, null, function* () {
      yield Promise.all(
        module2.dependencies.map((dep) => {
          return this.fetchModule(dep, module2.path);
        })
      );
    });
  }
};

// src/Graph.ts
var Graph = class {
  constructor(options) {
    this.statements = [];
    this.modules = [];
    this.moduleById = {};
    this.resolveIds = {};
    this.orderedModules = [];
    const { entry, bundle } = options;
    this.entryPath = (0, import_path2.resolve)(entry);
    this.basedir = (0, import_path2.dirname)(this.entryPath);
    this.bundle = bundle;
    this.moduleLoader = new ModuleLoader(bundle);
  }
  build() {
    return __async(this, null, function* () {
      const entryModule = yield this.moduleLoader.fetchModule(
        this.entryPath,
        null,
        true
      );
      this.modules.forEach((module2) => module2.bind());
      this.orderedModules = this.sortModules(entryModule);
      entryModule.getExports().forEach((name) => {
        const declaration = entryModule.traceExport(name);
        declaration.use();
      });
      this.doconflict();
    });
  }
  doconflict() {
    const used = {};
    function getSafeName(name) {
      let safeName = name;
      let count = 1;
      while (used[safeName]) {
        safeName = `${name}$${count++}`;
      }
      used[safeName] = true;
      return safeName;
    }
    this.modules.forEach((module2) => {
      keys(module2.declarations).forEach((name) => {
        const declaration = module2.declarations[name];
        declaration.name = getSafeName(declaration.name);
      });
    });
  }
  getModuleById(id) {
    return this.moduleById[id];
  }
  addModule(module2) {
    if (!this.moduleById[module2.id]) {
      this.moduleById[module2.id] = module2;
      this.modules.push(module2);
    }
  }
  sortModules(entryModule) {
    const orderedModules = [];
    const analysedModule = {};
    const parent = {};
    const cyclePathList = [];
    function getCyclePath(id, parentId) {
      const paths = [id];
      let currrentId = parentId;
      while (currrentId !== id) {
        paths.push(currrentId);
        currrentId = parent[currrentId];
      }
      paths.push(paths[0]);
      return paths.reverse();
    }
    function analyseModule(module2) {
      if (analysedModule[module2.id]) {
        return;
      }
      for (const dependency of module2.dependencyModules) {
        if (parent[dependency.id]) {
          if (!analysedModule[dependency.id]) {
            cyclePathList.push(getCyclePath(dependency.id, module2.id));
          }
          continue;
        }
        parent[dependency.id] = module2.id;
        analyseModule(dependency);
      }
      analysedModule[module2.id] = true;
      orderedModules.push(module2);
    }
    analyseModule(entryModule);
    if (cyclePathList.length) {
      cyclePathList.forEach((paths) => {
        console.log(paths);
      });
      process.exit(1);
    }
    return orderedModules;
  }
};

// src/Bundle.ts
var Bundle2 = class {
  constructor(options) {
    this.graph = new Graph({
      entry: options.entry,
      bundle: this
    });
  }
  build() {
    return __async(this, null, function* () {
      yield this.graph.build();
    });
  }
  getModuleById(id) {
    return this.graph.getModuleById(id);
  }
  addModule(module2) {
    return this.graph.addModule(module2);
  }
  render() {
    let msBundle = new MagicString2.Bundle({ separator: "\n" });
    this.graph.orderedModules.forEach((module2) => {
      msBundle.addSource({
        content: module2.render()
      });
    });
    const map = msBundle.generateMap({
      includeContent: true
    });
    return {
      code: msBundle.toString(),
      map
    };
  }
};

// src/rollup.ts
var import_node_fs = __toESM(require("fs"), 1);
var import_node_path = require("path");
__reExport(rollup_exports, require("ast-parser"), module.exports);
var existsSync = (dirname4) => {
  return import_node_fs.default.existsSync(dirname4);
};
var createDir = (path) => {
  return new Promise((resolve3, reject) => {
    const lastPath = path.substring(0, path.lastIndexOf("/"));
    import_node_fs.default.mkdir(lastPath, { recursive: true }, (error) => {
      if (error) {
        reject({ success: false });
      } else {
        resolve3({ success: true });
      }
    });
  });
};
var writeFile = (path, content, format = "utf-8") => {
  return new Promise((resolve3, reject) => {
    import_node_fs.default.writeFile(
      path,
      content,
      {
        mode: 438,
        // 可读可写666，转化为十进制就是438
        flag: "w+",
        // r+并不会清空再写入，w+会清空再写入
        encoding: format
      },
      (err) => {
        if (err) {
          reject({ success: false, data: err });
        } else {
          resolve3({ success: true, data: { path, content } });
        }
      }
    );
  });
};
function rollup(options) {
  const { input = "./index.js", output = "./dist/index.js" } = options;
  const bundle = new Bundle2({
    entry: input
  });
  return bundle.build().then(() => {
    const generate = () => bundle.render();
    return {
      generate,
      write: () => __async(this, null, function* () {
        const { code, map } = generate();
        if (!existsSync((0, import_node_path.dirname)(output))) {
          yield createDir(output);
        }
        return Promise.all([
          writeFile(output, code),
          writeFile(output + ".map", map.toString())
        ]);
      })
    };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  rollup,
  ...require("ast-parser")
});
