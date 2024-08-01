import { Statement } from "Statement";
import { Declaration } from "ast/Declaration";
import { keys } from "utils/obejct";

interface ScopeOptions {
  parent?: Scope;
  paramNodes?: any[];
  block?: boolean;
  statement: Statement;
  isTopLevel?: boolean;
}

export class Scope {
  // 父作用域
  parent?: Scope;
  // 如果是函数作用域，则需要参数节点
  paramNodes: any[];
  // 是否为块级作用域
  isBlockScope?: boolean;
  // 作用域对应的语句节点
  statement: Statement;
  // 变量/函数 声明节点，为 Scope 的核心数据
  declarations: Record<string, Declaration> = {};
  constructor(options: ScopeOptions) {
    const { parent, paramNodes, block, statement } = options;
    this.parent = parent;
    this.paramNodes = paramNodes || [];
    this.statement = statement;
    this.isBlockScope = !!block;
    this.paramNodes.forEach(
      (node) =>
        (this.declarations[node.name] = new Declaration(
          node,
          true,
          this.statement
        ))
    );
  }

  addDeclaration(node: any, isBlockDeclaration: boolean) {
    // block scope & var, 向上追溯，直到顶层作用域
    if (this.isBlockScope && !isBlockDeclaration && this.parent) {
      this.parent.addDeclaration(node, isBlockDeclaration);
      return;
    }
    // 变量声明 函数声明
    // if (
    //   node.type === 'VariableDeclaration' ||
    //   node.type === 'FunctionDeclaration'
    // ) {
    const key = node.id && node.id.name;
    this.declarations[key] = new Declaration(node, false, this.statement);
    // }
  }

  // 遍历声明节点(Declaration)
  eachDeclaration(fn: (name: string, dec: Declaration) => void) {
    keys(this.declarations).forEach((key) => {
      fn(key, this.declarations[key]);
    });
  }

  contains(name: string): Declaration {
    return this.findDeclaration(name);
  }

  findDeclaration(name: string): Declaration {
    return (
      this.declarations[name] ||
      (this.parent && this.parent.findDeclaration(name))
    );
  }
}
