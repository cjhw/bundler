declare enum NodeType {
    Program = "Program",
    VariableDeclaration = "VariableDeclaration",
    FunctionDeclaration = "FunctionDeclaration",
    Identifier = "Identifier",
    BlockStatement = "BlockStatement",
    ExpressionStatement = "ExpressionStatement",
    ReturnStatement = "ReturnStatement",
    CallExpression = "CallExpression",
    BinaryExpression = "BinaryExpression",
    MemberExpression = "MemberExpression",
    FunctionExpression = "FunctionExpression",
    Literal = "Literal",
    ImportDeclaration = "ImportDeclaration",
    ImportSpecifier = "ImportSpecifier",
    ImportDefaultSpecifier = "ImportDefaultSpecifier",
    ImportNamespaceSpecifier = "ImportNamespaceSpecifier",
    ExportDeclaration = "ExportDeclaration",
    ExportSpecifier = "ExportSpecifier",
    ExportDefaultDeclaration = "ExportDefaultDeclaration",
    ExportNamedDeclaration = "ExportNamedDeclaration",
    ExportAllDeclaration = "ExportAllDeclaration",
    VariableDeclarator = "VariableDeclarator"
}
declare enum FunctionType {
    FunctionDeclaration = 0,
    CallExpression = 1
}
interface Node {
    type: string;
    start: number;
    end: number;
}
interface Program extends Node {
    type: NodeType.Program;
    body: Statement[];
}
interface Literal extends Node {
    type: NodeType.Literal;
    value: string;
    raw: string;
}
interface Identifier extends Node {
    type: NodeType.Identifier;
    name: string;
}
interface CallExpression extends Node {
    type: NodeType.CallExpression;
    callee: Expression;
    arguments: Expression[];
}
interface MemberExpression extends Node {
    type: NodeType.MemberExpression;
    object: Identifier | MemberExpression;
    property: Identifier;
    computed: boolean;
}
interface BlockStatement extends Node {
    type: NodeType.BlockStatement;
    body: Statement[];
}
interface ExpressionStatement extends Node {
    type: NodeType.ExpressionStatement;
    expression: Expression;
}
interface FunctionExpression extends FunctionNode {
    type: NodeType.FunctionExpression;
}
interface FunctionDeclaration extends FunctionNode {
    type: NodeType.FunctionDeclaration;
    id: Identifier | null;
}
type VariableKind = "var" | "let" | "const";
interface VariableDeclarator extends Node {
    type: NodeType.VariableDeclarator;
    id: Identifier;
    init: Expression | Literal | null;
}
interface VariableDeclaration extends Node {
    type: NodeType.VariableDeclaration;
    kind: "var" | "let" | "const";
    declarations: VariableDeclarator[];
}
interface ImportSpecifier extends Node {
    type: NodeType.ImportSpecifier;
    imported: Identifier;
    local: Identifier;
}
interface ImportDefaultSpecifier extends Node {
    type: NodeType.ImportDefaultSpecifier;
    local: Identifier;
}
interface ImportNamespaceSpecifier extends Node {
    type: NodeType.ImportNamespaceSpecifier;
    local: Identifier;
}
type ImportSpecifiers = (ImportSpecifier | ImportDefaultSpecifier)[] | ImportNamespaceSpecifier[];
interface ImportDeclaration extends Node {
    type: NodeType.ImportDeclaration;
    specifiers: ImportSpecifiers;
    source: Literal;
}
type Declaration = FunctionDeclaration | VariableDeclaration | ImportDeclaration | ExportDeclaration | VariableDeclarator;
interface ExportSpecifier extends Node {
    type: NodeType.ExportSpecifier;
    exported: Identifier;
    local: Identifier;
}
interface ExportNamedDeclaration extends Node {
    type: NodeType.ExportNamedDeclaration;
    declaration: Declaration | null;
    specifiers: ExportSpecifier[];
    source: Literal | null;
}
interface ExportDefaultDeclaration extends Node {
    type: NodeType.ExportDefaultDeclaration;
    declaration: Declaration | Expression;
}
interface ExportAllDeclaration extends Node {
    type: NodeType.ExportAllDeclaration;
    source: Literal;
    exported: Identifier | null;
}
type ExportDeclaration = ExportNamedDeclaration | ExportDefaultDeclaration | ExportAllDeclaration;
interface BinaryExpression extends Node {
    type: NodeType.BinaryExpression;
    left: Expression;
    right: Expression;
    operator: string;
}
interface FunctionNode extends Node {
    id: Identifier | null;
    params: Expression[] | Identifier[];
    body: BlockStatement;
}
interface ReturnStatement extends Node {
    type: NodeType.ReturnStatement;
    argument: Expression;
}
type Statement = ImportDeclaration | ExportDeclaration | VariableDeclaration | FunctionDeclaration | ExpressionStatement | BlockStatement | ReturnStatement;
type Expression = CallExpression | MemberExpression | Identifier | Literal | BinaryExpression | FunctionExpression;

declare enum TokenType {
    Let = "Let",
    Const = "Const",
    Var = "Var",
    Assign = "Assign",
    Function = "Function",
    Number = "Number",
    Operator = "Operator",
    Identifier = "Identifier",
    LeftParen = "LeftParen",
    RightParen = "RightParen",
    LeftCurly = "LeftCurly",
    RightCurly = "RightCurly",
    Comma = "Comma",
    Dot = "Dot",
    Semicolon = "Semicolon",
    StringLiteral = "StringLiteral",
    Return = "Return",
    Import = "Import",
    Export = "Export",
    Default = "Default",
    From = "From",
    As = "As",
    Asterisk = "Asterisk"
}
declare enum ScanMode {
    Normal = 0,
    Identifier = 1,
    StringLiteral = 2,
    Number = 3
}
type Token = {
    type: TokenType;
    value?: string;
    start: number;
    end: number;
    raw?: string;
};
declare class Tokenizer {
    private _tokens;
    private _currentIndex;
    private _source;
    private _scanMode;
    constructor(input: string);
    scanIndentifier(): void;
    scanStringLiteral(): void;
    _scanNumber(): void;
    tokenize(): Token[];
    private _getCurrentChar;
    private _getNextChar;
    private _resetCurrentIndex;
    private _getTokens;
    private _getPreviousToken;
    private _setScanMode;
    private _resetScanMode;
}

declare function parse(code: string): Program;

export { type BinaryExpression, type BlockStatement, type CallExpression, type Declaration, type ExportAllDeclaration, type ExportDeclaration, type ExportDefaultDeclaration, type ExportNamedDeclaration, type ExportSpecifier, type Expression, type ExpressionStatement, type FunctionDeclaration, type FunctionExpression, type FunctionNode, FunctionType, type Identifier, type ImportDeclaration, type ImportDefaultSpecifier, type ImportNamespaceSpecifier, type ImportSpecifier, type ImportSpecifiers, type Literal, type MemberExpression, type Node, NodeType, type Program, type ReturnStatement, ScanMode, type Statement, type Token, TokenType, Tokenizer, type VariableDeclaration, type VariableDeclarator, type VariableKind, parse };
