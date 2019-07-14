import * as ts from "typescript-3.5.3";

[
  ts.createInterfaceDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createIdentifier("Interface"),
    undefined,
    undefined,
    [
      ts.createPropertySignature(
        undefined,
        ts.createIdentifier("prop"),
        undefined,
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      ),
      ts.createPropertySignature(
        [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
        ts.createIdentifier("readonlyProp"),
        undefined,
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      ),
      ts.createIndexSignature(
        undefined,
        undefined,
        [ts.createParameter(
          undefined,
          undefined,
          undefined,
          ts.createIdentifier("test"),
          undefined,
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          undefined
        )],
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      )
    ]
  ),
  ts.createInterfaceDeclaration(
    undefined,
    undefined,
    ts.createIdentifier("OtherInterface"),
    undefined,
    undefined,
    [
      ts.createMethodSignature(
        undefined,
        [ts.createParameter(
          undefined,
          undefined,
          undefined,
          ts.createIdentifier("p"),
          undefined,
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          undefined
        )],
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ts.createIdentifier("method"),
        undefined
      ),
      ts.createConstructSignature(
        undefined,
        [ts.createParameter(
          undefined,
          undefined,
          undefined,
          ts.createIdentifier("p"),
          undefined,
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          undefined
        )],
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      )
    ]
  ),
  ts.createClassDeclaration(
    undefined,
    undefined,
    ts.createIdentifier("Class"),
    undefined,
    undefined,
    [
      ts.createProperty(
        undefined,
        undefined,
        ts.createIdentifier("prop"),
        ts.createToken(ts.SyntaxKind.ExclamationToken),
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      ),
      ts.createConstructor(
        undefined,
        undefined,
        [ts.createParameter(
          undefined,
          undefined,
          undefined,
          ts.createIdentifier("testing"),
          undefined,
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          undefined
        )],
        ts.createBlock(
          [],
          true
        )
      ),
      ts.createMethod(
        undefined,
        undefined,
        undefined,
        ts.createIdentifier("method"),
        undefined,
        undefined,
        [],
        undefined,
        ts.createBlock(
          [ts.createReturn(ts.createNumericLiteral("5"))],
          true
        )
      )
    ]
  ),
  ts.createClassDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.DeclareKeyword)],
    ts.createIdentifier("Class2"),
    undefined,
    undefined,
    [
      ts.createProperty(
        undefined,
        [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
        ts.createIdentifier("other"),
        undefined,
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      ),
      ts.createMethod(
        undefined,
        undefined,
        undefined,
        ts.createIdentifier("method"),
        undefined,
        undefined,
        [ts.createParameter(
          undefined,
          undefined,
          undefined,
          ts.createIdentifier("p"),
          undefined,
          ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          undefined
        )],
        ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      )
    ]
  ),
  ts.createVariableStatement(
    undefined,
    ts.createVariableDeclarationList(
      [ts.createVariableDeclaration(
        ts.createIdentifier("myVar"),
        undefined,
        ts.createNumericLiteral("6")
      )],
      ts.NodeFlags.Const
    )
  ),
  ts.createVariableStatement(
    undefined,
    ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          ts.createIdentifier("myVar2"),
          undefined,
          ts.createNumericLiteral("6")
        ),
        ts.createVariableDeclaration(
          ts.createIdentifier("myVar3"),
          ts.createUnionTypeNode([
            ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
          ]),
          undefined
        )
      ],
      ts.NodeFlags.Let
    )
  ),
  ts.createVariableStatement(
    undefined,
    ts.createVariableDeclarationList(
      [ts.createVariableDeclaration(
        ts.createIdentifier("otherVar"),
        undefined,
        ts.createBinary(
          ts.createNumericLiteral("4"),
          ts.createToken(ts.SyntaxKind.PlusToken),
          ts.createBinary(
            ts.createNumericLiteral("5"),
            ts.createToken(ts.SyntaxKind.AsteriskToken),
            ts.createNumericLiteral("12")
          )
        )
      )],
      ts.NodeFlags.None
    )
  ),
  ts.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    ts.createIdentifier("Function"),
    undefined,
    [ts.createParameter(
      undefined,
      undefined,
      undefined,
      ts.createIdentifier("p"),
      undefined,
      ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      undefined
    )],
    ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    ts.createBlock(
      [ts.createReturn(ts.createNumericLiteral("5"))],
      true
    )
  ),
  ts.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    ts.createIdentifier("test"),
    undefined,
    [],
    undefined,
    ts.createBlock(
      [],
      false
    )
  )
];
