import { Project, Symbol, Type, TypeGuards, FunctionDeclarationStructure,
    CodeBlockWriter, StructureKind, ts } from "ts-morph";
import { Factory, FactoryFunction, Parameter, Node, NodeProperty } from "./compilerApi";

export function generateCode(typeScriptModuleName = "typescript") {
    const factory = new Factory();
    const project = new Project({ compilerOptions: { strictNullChecks: true } });
    const newSourceFile = project.createSourceFile("____temp___.ts");
    const tsSourceFile = project.addExistingSourceFile(`node_modules/${typeScriptModuleName}/lib/typescript.d.ts`);
    const tsSymbol = tsSourceFile.getNamespaceOrThrow("ts").getSymbolOrThrow();

    const factoryFunctions = Array.from(getFactoryFunctions());

    newSourceFile.addStatements([{
        kind: StructureKind.ImportDeclaration,
        defaultImport: "CodeBlockWriter",
        moduleSpecifier: "code-block-writer"
    }, {
        kind: StructureKind.Function,
        isExported: true,
        name: "generateFactoryCode",
        parameters: [{ name: "ts", type: `typeof import("${typeScriptModuleName}")` }, { name: "initialNode", type: getTsTypeText("Node") }],
        statements: [
            writer => {
                writer.writeLine(`const writer = new CodeBlockWriter({ newLine: "\\n", indentNumberOfSpaces: 2 });`)
                writer.writeLine("const syntaxKindToName = createSyntaxKindToNameMap();");
                writer.blankLine();
                writer.write("if (ts.isSourceFile(initialNode))").block(() => {
                    writer.writeLine(`writer.write("[");`);
                    writer.write("if (initialNode.statements.length > 0)").block(() => {
                        writer.write("writer.indentBlock(() => ").inlineBlock(() => {
                            writer.write("for (let i = 0; i < initialNode.statements.length; i++)").block(() => {
                                writer.writeLine("const statement = initialNode.statements[i];")
                                writer.writeLine("if (i > 0)");
                                writer.indent().write(`writer.write(",").newLine();`).newLine();
                                writer.writeLine(`writeNodeText(statement);`);
                            });
                        }).write(").newLine();");
                    });
                    writer.writeLine(`writer.write("];");`);
                });
                writer.write("else").block(() => {
                    writer.writeLine("writeNodeText(initialNode);");
                });
                writer.blankLine().writeLine("return writer.toString();");
            },
            writeNodeTextFunction(),
            ...factoryFunctions.map(getFunctionStructure),
            getSyntaxKindToNameFunction(),
            getFlagValuesFunction()
        ]
    }]);

    return newSourceFile.getFullText();

    function* getFactoryFunctions(): IterableIterator<FactoryFunction> {
        const map = new Map<string, FactoryFunction>();

        for (const func of getInternal()) {
            for (const name of func.getKindNames()) {
                if (map.has(name))
                    throw new Error(`Found duplicate name: ${name} (existing: ${map.get(name)!.getName()}, new: ${func.getName()})`);
                map.set(name, func);
            }
            yield func;
        }

        function* getInternal(): IterableIterator<FactoryFunction> {
            for (const symbol of tsSymbol.getExports()) {
                if (!symbol.getName().startsWith("create"))
                    continue;
                const valueDec = symbol.getValueDeclaration();
                if (valueDec == null || !TypeGuards.isFunctionDeclaration(valueDec))
                    continue;
                const returnType = valueDec.getReturnType();
                if (returnType.getProperty("kind") == null)
                    continue;
                //console.log(symbol.getName() + ": " + returnType.getText());
                const factoryFunction = factory.getFactoryFunction(valueDec);
                if (isAllowedFactoryFunction(factoryFunction))
                    yield factoryFunction;
            }
        }
    }

    function writeNodeTextFunction(): FunctionDeclarationStructure {
        return {
            kind: StructureKind.Function,
            name: "writeNodeText",
            parameters: [{ name: "node", type: getTsTypeText("Node") }],
            statements: writer => {
                writer.write("switch (node.kind)").block(() => {
                    for (const factoryFunc of factoryFunctions) {
                        for (const kindName of factoryFunc.getKindNames())
                            writer.writeLine(`case ts.SyntaxKind.${kindName}:`);
                        writer.indent().write(`${factoryFunc.getName()}(node as ${getTsTypeText(factoryFunc.getNode().getName())});`).newLine();
                        writer.indent().write("return;").newLine();
                    }
                    writer.writeLine(`default:`);
                    writer.indentBlock(() => {
                        writer.write("if (node.kind >= ts.SyntaxKind.FirstToken && node.kind <= ts.SyntaxKind.LastToken)").block(() => {
                            writer.writeLine(`writer.write("ts.createToken(ts.SyntaxKind.").write(syntaxKindToName[node.kind]).write(")");`)
                            writer.writeLine("return;")
                        });
                        writer.writeLine(`writer.write("/* Unhandled node kind: ").write(syntaxKindToName[node.kind]).write(" */")`);
                    });
                });
            }
        };
    }

    function getFunctionStructure(func: FactoryFunction): FunctionDeclarationStructure {
        return {
            kind: StructureKind.Function,
            name: func.getName(),
            parameters: [{ name: "node", type: getTsTypeText(func.getNode().getName()) }],
            statements: writer => printBody(writer)
        };

        function printBody(writer: CodeBlockWriter) {
            const params = func.getParameters();
            writer.writeLine(`writer.write("ts.${func.getName()}(");`);
            if (params.length === 1) {
                printParamText(writer, params[0]);
            }
            else if (params.length > 1) {
                writer.writeLine(`writer.newLine();`);
                writer.write("writer.indentBlock(() => ").inlineBlock(() => {
                    for (let i = 0; i < params.length; i++) {
                        const param = params[i];
                        if (i > 0)
                            writer.writeLine(`writer.write(",").newLine();`);
                        printParamText(writer, param);
                    }
                }).write(");").newLine();
            }
            writer.writeLine(`writer.write(")");`);
        }

        function printParamText(writer: CodeBlockWriter, param: Parameter) {
            if (writeCustomParamText(writer, func, param))
                return;

            const prop = func.getNode().getPropertyForParam(param);
            const propAccess = `node.${prop.getName()}`;

            writeNullableIfNecessary(writer, prop.getType(), propAccess, () => writeTypeText());

            function writeTypeText() {
                if (param.isArray()) {
                    const arrayElementType = param.getArrayElementType()!;
                    writeArrayText(writer, propAccess, () => writeTextForType("item", arrayElementType));
                }
                else {
                    writeTextForType(propAccess, param.getType().getNonNullableType());
                }
            }

            // todo: rename
            function writeTextForType(text: string, type: Type) {
                if (isNodeType())
                    writer.write(`writeNodeText(${text})`);
                else if (isSyntaxKindType())
                    writer.write(`writer.write("ts.SyntaxKind.").write(syntaxKindToName[${text}])`);
                else if (type.isString() || type.isStringLiteral() || type.isBoolean() || type.isBooleanLiteral())
                    writer.write(`writer.quote(${text}.toString())`);
                else if (type.getText().endsWith(".NodeFlags"))
                    writer.write(`writer.write(getFlagValues(ts.NodeFlags, "ts.NodeFlags", ${text} || 0, "None"));`);
                else {
                    console.error(`Could not find text for param ${func.getName()}::${param.getName()}`);
                    writer.write(`writer.write("/* unknown */")`);
                }

                function isSyntaxKindType() {
                    // good enough...
                    return isSyntaxKind(type) || type.getUnionTypes().some(isSyntaxKind);

                    function isSyntaxKind(t: Type) {
                        return (t.isEnum() || t.isEnumLiteral()) && t.getText().includes(".SyntaxKind");
                    }
                }

                function isNodeType() {
                    // always default to using the node union type
                    return type.getProperty("kind") != null
                        || type.getUnionTypes().some(t => t.getProperty("kind") != null);
                }
            }
        }
    }

    function getSyntaxKindToNameFunction(): FunctionDeclarationStructure {
        return {
            kind: StructureKind.Function,
            name: "createSyntaxKindToNameMap",
            statements: writer => {
                writer.writeLine("const map: { [kind: number]: string } = {};");
                writer.write("for (const name of Object.keys(ts.SyntaxKind).filter(k => isNaN(parseInt(k, 10))))").block(() => {

                    writer.writeLine(`const value = (ts.SyntaxKind as any)[name] as number;`);
                    writer.writeLine(`if (map[value] == null)`);
                    writer.indent().write(`map[value] = name;`).newLine();
                });
                writer.write("return map;")
            }
        }
    }

    function getFlagValuesFunction(): FunctionDeclarationStructure {
        return {
            kind: StructureKind.Function,
            name: "getFlagValues",
            parameters: [
                { name: "enumObj", type: "any" },
                { name: "enumName", type: "string" },
                { name: "value", type: "number" },
                { name: "defaultName", type: "string" }
            ],
            statements: writer => {
                writer.writeLine("const members: string[] = [];");
                writer.write("for (const prop in enumObj)").block(() => {
                    writer.writeLine(`if (typeof enumObj[prop] === "string")`);
                    writer.indent().write("continue;").newLine();
                    writer.writeLine("if ((enumObj[prop] & value) !== 0)")
                    writer.indent().write(`members.push(enumName + "." + prop);`).newLine();
                });
                writer.writeLine("if (members.length === 0)")
                writer.indent().write(`members.push(enumName + "." + defaultName);`).newLine();
                writer.writeLine(`return members.join(" | ");`);
            }
        }
    }

    function getTsTypeText(typeText: string) {
        return `import("${typeScriptModuleName}").${typeText}`;
    }

    function writeCustomParamText(writer: CodeBlockWriter, func: FactoryFunction, param: Parameter) {
        const funcName = func.getName();
        const paramName = param.getName();
        const initialLength = writer.getLength();

        if (funcName === nameof(ts.createNumericLiteral) && paramName === "numericLiteralFlags")
            writer.write(`writer.write(getFlagValues(ts.TokenFlags, "ts.TokenFlags", (node as any).numericLiteralFlags || 0, "None"));`);
        if (funcName === nameof(ts.createProperty) && paramName === "questionOrExclamationToken") {
            writer.writeLine("if (node.questionToken != null)");
            writer.indent().write(`writer.write("ts.createToken(ts.SyntaxKind.QuestionToken)");`).newLine();
            writer.writeLine("else if (node.exclamationToken != null)");
            writer.indent().write(`writer.write("ts.createToken(ts.SyntaxKind.ExclamationToken)");`).newLine();
            writer.writeLine("else");
            writer.indent().write(`writer.write("undefined");`).newLine();
        }
        if (funcName === nameof(ts.createArrayLiteral) && paramName === "multiLine")
            writer.write("writer.write((node as any).multiLine.toString())");
        if (funcName === nameof(ts.createObjectLiteral) && paramName === "multiLine")
            writer.write("writer.write((node as any).multiLine.toString())");
        if (funcName === nameof(ts.createBlock) && paramName === "multiLine")
            writer.write("writer.write((node as any).multiLine.toString())");
        if (paramName === "modifiers") {
            writeNullableIfNecessary(writer, param.getType(), "node.modifiers", () => {
                writeArrayText(writer, "node.modifiers", () => writer.writeLine(`writer.write("ts.createModifier(ts.SyntaxKind." + syntaxKindToName[item.kind] + ")");`))
            });
        }

        return writer.getLength() !== initialLength;
    }

    function writeArrayText(writer: CodeBlockWriter, propAccess: string, writeItemText: () => void) {
        writer.writeLine(`writer.write("[");`);
        writer.write(`if (${propAccess}.length === 1)`).block(() => {
            writer.writeLine(`const item = ${propAccess}![0];`)
            writeItemText();
        });
        writer.write(`else if (${propAccess}.length > 1)`).block(() => {
            writer.write("writer.indentBlock(() => ").inlineBlock(() => {
                writer.write(`for (let i = 0; i < ${propAccess}!.length; i++)`).block(() => {
                    writer.write(`const item = ${propAccess}![i];`)
                    writer.writeLine("if (i > 0)");
                    writer.indent().write(`writer.write(",").newLine();`).newLine();
                    writeItemText();
                });
            }).write(");").newLine();
        });
        writer.writeLine(`writer.write("]");`);
    }

    function writeNullableIfNecessary(writer: CodeBlockWriter, type: Type, propAccess: string, writeTypeText: () => void) {
        if (type.isNullable()) {
            writer.writeLine(`if (${propAccess} == null)`)
            writer.indent().write(`writer.write("undefined");`).newLine();
            writer.write("else").block(() => {
                writeTypeText();
            });
        }
        else {
            writeTypeText();
        }
    }
}

function isAllowedFactoryFunction(func: FactoryFunction) {
    // some of these could probably be figured out by inspecting
    // the code, but this is the lazy way to do it... I'll just
    // manually maintain this list.
    switch (func.getName()) {
        // handled by createTrue, createFalse, createBigIntLiteral, createNumericLiteral
        case nameof(ts.createLiteral):
        // handled by createVoid
        case nameof(ts.createVoidZero):
        // handled by createBinary
        case nameof(ts.createAssignment):
        case nameof(ts.createLogicalAnd):
        case nameof(ts.createLogicalOr):
        case nameof(ts.createLogicalNot):
        case nameof(ts.createAdd):
        case nameof(ts.createSubtract):
        case nameof(ts.createStrictEquality):
        case nameof(ts.createStrictInequality):
        case nameof(ts.createLessThan):
        case nameof(ts.createComma):
        // handled by createCall
        case nameof(ts.createImmediatelyInvokedFunctionExpression):
        case nameof(ts.createImmediatelyInvokedArrowFunction):
        // handled by createUnionTypeNode and createIntersectionTypeNode
        case nameof(ts.createUnionOrIntersectionTypeNode):
        // handled by createPostfix
        case nameof(ts.createPostfixIncrement):
        // handled by createExportDeclaration
        case nameof(ts.createExternalModuleExport):
        // handled by createExportAssignment
        case nameof(ts.createExportDefault):
        // not used
        case nameof(ts.createNode):
        case nameof(ts.createSourceFile):
        case nameof(ts.createLanguageServiceSourceFile):
        case nameof(ts.createTempVariable):
        case nameof(ts.createLoopVariable):
        case nameof(ts.createUniqueName):
        case nameof(ts.createOptimisticUniqueName):
        case nameof(ts.createFileLevelUniqueName):
        case nameof(ts.createModifiersFromModifierFlags):
        case nameof(ts.createInputFiles):
        case nameof(ts.createBundle):
        case nameof(ts.createUnparsedSourceFile):
        case nameof(ts.createNotEmittedStatement):
        case nameof(ts.createPartiallyEmittedExpression):
        // custom handled
        case nameof(ts.createToken):
        case nameof(ts.createModifier):
            return false;
    }

    return true;
}