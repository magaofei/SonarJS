/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2020 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// https://jira.sonarsource.com/browse/RSPEC-3782

import { Rule } from 'eslint';
import * as estree from 'estree';
import { isRequiredParserServices } from '../utils/isRequiredParserServices';
import ts from 'typescript';
import { TSESTree } from '@typescript-eslint/experimental-utils';

export const rule: Rule.RuleModule = {
  create(context: Rule.RuleContext) {
    const services = context.parserServices;
    if (!isRequiredParserServices(services)) {
      return {};
    }

    const typechecker = services.program.getTypeChecker();

    function isAssignableTo(expected: ts.Type, actual: ts.Type) {
      return (
        (actual.flags & ts.TypeFlags.Any) !== 0 ||
        (expected.flags & ts.TypeFlags.Any) !== 0 ||
        isEqualTo(expected, actual) ||
        (expected.isUnion() && expected.types.some(type => isEqualTo(type, actual)))
      );
    }

    function isEqualTo(expected: ts.Type, actual: ts.Type) {
      return (
        expected.flags === actual.flags ||
        (typechecker.typeToString(expected) === 'number' && actual.isNumberLiteral()) ||
        (typechecker.typeToString(expected) === 'string' && actual.isStringLiteral())
      );
    }

    function isFunctionLikeDeclaration(
      declaration: ts.Declaration,
    ): declaration is ts.FunctionLikeDeclarationBase {
      return [
        ts.SyntaxKind.FunctionDeclaration,
        ts.SyntaxKind.FunctionExpression,
        ts.SyntaxKind.ArrowFunction,
        ts.SyntaxKind.MethodDeclaration,
        ts.SyntaxKind.MethodSignature,
        ts.SyntaxKind.Constructor,
        ts.SyntaxKind.GetAccessor,
        ts.SyntaxKind.SetAccessor,
      ].includes(declaration.kind);
    }

    function hasRestParameter(declaration: ts.FunctionLikeDeclarationBase) {
      const { parameters } = declaration;
      return parameters.length > 0 && parameters[parameters.length - 1].dotDotDotToken;
    }

    function checkMismatch(parameter: ts.ParameterDeclaration, argument: estree.Node) {
      if (parameter.type) {
        const parameterType = parameter.dotDotDotToken
          ? typechecker.getTypeFromTypeNode((parameter.type as ts.ArrayTypeNode).elementType)
          : typechecker.getTypeFromTypeNode(parameter.type);
        const argumentType = typechecker.getTypeAtLocation(
          services.esTreeNodeToTSNodeMap.get(argument as TSESTree.Node),
        );
        if (!isAssignableTo(parameterType, argumentType)) {
          context.report({
            message: `Change this argument to the documented type: ${typechecker.typeToString(
              parameterType,
            )}.`,
            node: argument,
          });
        }
      }
    }

    return {
      CallExpression: (node: estree.Node) => {
        const call = node as estree.CallExpression;
        const signature = typechecker.getResolvedSignature(
          services.esTreeNodeToTSNodeMap.get(call as TSESTree.Node) as ts.CallLikeExpression,
        );
        if (signature) {
          const declaration = signature.declaration;
          if (declaration && isFunctionLikeDeclaration(declaration)) {
            const { parameters } = declaration;
            const [...args] = call.arguments;
            const len = Math.min(parameters.length, args.length);
            for (let i = 0; i < len; ++i) {
              checkMismatch(parameters[i], args[i]);
            }
            if (args.length > len && hasRestParameter(declaration)) {
              const param = parameters[parameters.length - 1];
              for (let i = len; i < args.length; ++i) {
                checkMismatch(param, args[i]);
              }
            }
          }
        }
      },
    };
  },
};
