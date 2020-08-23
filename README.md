# TypeScript Compiler API Factory Code Generator Generator

Generates code that generates TypeScript Compiler API factory code from an AST.

This serves the purpose of generating code that generates compiler API factory code from an AST based on specific TypeScript compiler API version. The generated code is used on [ts-ast-viewer.com](https://ts-ast-viewer.com).

## Benefits

1. Automatic (minimal) maintenance of future factory code functionality (`typescript@next` support).
2. Support all compiler API versions.
3. Reuses the AST used by the rest of the ts-ast-viewer.com site. So improves performance and allows showing the factory code for the selected node. Couldn't do that before because I was pegged to a specific compiler API version and had to reparse the source file specifically for the factory code generation.

## Use

### Setup

First, save the TypeScript versions as aliases using yarn:

```
yarn add typescript-4.0.2@npm:typescript@4.0.2
```

### Get and save the generated code for each compiler API version

Then generate the code for each compiler api version and save it to a file:

```ts
import * as fs from "fs";
import { generateCode } from "ts-factory-code-generator-generator";

const code = generateCode("typescript");
fs.writeFile("./factoryCodeGenerator.ts", { encoding: "utf-8" }, code, ...etc...);

const codeFor4_0_2 = generateCode("typescript-4.0.2");
fs.writeFile("./factoryCodeGenerator-4.0.2.ts", { encoding: "utf-8" }, codeFor4_0_2, ...etc...);

// ...etc...
```

### Use the generated code to generate factory code

Finally, generate the factory code from an AST for the appropriate compiler API version:

```ts
import * as ts from "typescript-4.0.2";
import { generateFactoryCode } from "./factoryCodeGenerator-4.0.2";

// get ast
const sourceFile = ts.createSourceFile("/file.ts", "4n + 5n;", ts.ScriptTarget.Latest);

// get the generated factory code
const factoryCode = generateFactoryCode(ts, sourceFile); // or provide a different node here
console.log(factoryCode);
```

Outputs:

<!-- dprint-ignore -->

```ts
[
  factory.createExpressionStatement(ts.createBinary(
    factory.createBigIntLiteral("4n"),
    factory.createToken(ts.SyntaxKind.PlusToken),
    factory.createBigIntLiteral("5n")
  ))
];
```
