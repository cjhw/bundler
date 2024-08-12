import { Module } from "Module";
import { dirname, resolve } from "path";
import { Statement } from "Statement";
import { ModuleLoader } from "ModuleLoader";
import { Bundle } from "Bundle";
import { keys } from "utils/obejct";

interface GraphOptions {
  entry: string;
  bundle: Bundle;
}

export class Graph {
  entryPath: string;
  basedir: string;
  statements: Statement[] = [];
  moduleLoader: ModuleLoader;
  modules: Module[] = [];
  moduleById: Record<string, Module> = {};
  resolveIds: Record<string, string> = {};
  orderedModules: Module[] = [];
  bundle: Bundle;
  constructor(options: GraphOptions) {
    const { entry, bundle } = options;
    this.entryPath = resolve(entry);
    this.basedir = dirname(this.entryPath);
    this.bundle = bundle;
    // 初始化模块加载器对象
    this.moduleLoader = new ModuleLoader(bundle);
  }

  async build() {
    // 1. 获取并解析模块信息
    const entryModule = await this.moduleLoader.fetchModule(
      this.entryPath,
      null,
      true
    );
    // 2. 构建依赖关系图
    this.modules.forEach((module) => module.bind());
    // 3. 模块拓扑排序
    this.orderedModules = this.sortModules(entryModule!);
    // 4. 标记需要包含的语句
    entryModule!.getExports().forEach((name) => {
      const declaration = entryModule!.traceExport(name);
      declaration!.use();
    });
    // 5. 处理命名冲突
    this.doconflict();
  }

  doconflict() {
    const used: Record<string, true> = {};

    function getSafeName(name: string) {
      let safeName = name;
      let count = 1;
      while (used[safeName]) {
        safeName = `${name}$${count++}`;
      }
      used[safeName] = true;
      return safeName;
    }

    this.modules.forEach((module) => {
      keys(module.declarations).forEach((name) => {
        const declaration = module.declarations[name];
        declaration.name = getSafeName(declaration.name!);
      });
    });
  }

  getModuleById(id: string) {
    return this.moduleById[id];
  }

  addModule(module: Module) {
    if (!this.moduleById[module.id]) {
      this.moduleById[module.id] = module;
      this.modules.push(module);
    }
  }

  sortModules(entryModule: Module) {
    // 拓扑排序模块数组
    const orderedModules: Module[] = [];
    // 记录已经分析过的模块表
    const analysedModule: Record<string, boolean> = {};
    // 记录模块的父模块 id
    const parent: Record<string, string> = {};
    // 记录循环依赖
    const cyclePathList: string[][] = [];

    // 用来回溯，用来定位循环依赖
    function getCyclePath(id: string, parentId: string): string[] {
      const paths = [id];
      let currrentId = parentId;
      while (currrentId !== id) {
        paths.push(currrentId);
        // 向前回溯
        currrentId = parent[currrentId];
      }
      paths.push(paths[0]);
      return paths.reverse();
    }

    // 拓扑排序核心逻辑，基于依赖图的后序遍历完成
    function analyseModule(module: Module) {
      if (analysedModule[module.id]) {
        return;
      }
      for (const dependency of module.dependencyModules) {
        // 检测到循环依赖
        if (parent[dependency.id]) {
          if (!analysedModule[dependency.id]) {
            cyclePathList.push(getCyclePath(dependency.id, module.id));
          }
          continue;
        }
        parent[dependency.id] = module.id;
        analyseModule(dependency);
      }
      analysedModule[module.id] = true;
      orderedModules.push(module);
    }

    // 从入口模块开始分析
    analyseModule(entryModule);
    // 如果有循环依赖，则打印循环依赖信息
    if (cyclePathList.length) {
      cyclePathList.forEach((paths) => {
        console.log(paths);
      });
      process.exit(1);
    }
    return orderedModules;
  }
}
