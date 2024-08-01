import * as MagicString from "magic-string";
import { Module } from "Module";
import { Graph } from "Graph";

interface BundleOptions {
  entry: string;
}

export class Bundle {
  graph: Graph;
  constructor(options: BundleOptions) {
    // 初始化模块依赖图对象
    this.graph = new Graph({
      entry: options.entry,
      bundle: this,
    });
  }

  async build() {
    // 模块打包逻辑，完成所有的 AST 相关操作
    await this.graph.build();
  }

  getModuleById(id: string) {
    return this.graph.getModuleById(id);
  }

  addModule(module: Module) {
    return this.graph.addModule(module);
  }

  render(): { code: string; map: MagicString.SourceMap } {
    // 代码生成逻辑，拼接模块 AST 节点，产出代码
    let msBundle = new MagicString.Bundle({ separator: "\n" });

    this.graph.orderedModules.forEach((module) => {
      msBundle.addSource({
        content: module.render(),
      });
    });

    const map = msBundle.generateMap({
      includeContent: true,
    }) as MagicString.SourceMap;
    return {
      code: msBundle.toString(),
      map,
    };
  }
}
