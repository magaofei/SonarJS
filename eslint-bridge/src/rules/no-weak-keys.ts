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
// https://jira.sonarsource.com/browse/RSPEC-4426

import { Rule } from 'eslint';
import * as estree from 'estree';
import { isIdentifier, getObjectExpressionProperty, getValueOfExpression } from './utils';

const MINIMAL_MODULUS_LENGTH = 2048;
const MINIMAL_DIVISOR_LENGTH = 224;
const WEAK_CURVES = [
  'secp112r1',
  'secp112r2',
  'secp128r1',
  'secp128r2',
  'secp160k1',
  'secp160r1',
  'secp160r2',
  'secp160r2',
  'secp192k1',
  'secp192r1',
  'prime192v2',
  'prime192v3',
  'sect113r1',
  'sect113r2',
  'sect131r1',
  'sect131r2',
  'sect163k1',
  'sect163r1',
  'sect163r2',
  'sect193r1',
  'sect193r2',
  'c2tnb191v1',
  'c2tnb191v2',
  'c2tnb191v3',
];

export const rule: Rule.RuleModule = {
  create(context: Rule.RuleContext) {
    function getNumericValue(node: estree.Node | undefined) {
      const literal = getValueOfExpression<estree.Literal>(context, node, 'Literal');
      if (literal && typeof literal.value === 'number') {
        return literal.value;
      }
      return undefined;
    }

    function checkRsaAndDsaOptions(algorithm: string, options: estree.Node) {
      const modulusProperty = getObjectExpressionProperty(options, 'modulusLength');
      const modulusLength = getNumericValue(modulusProperty?.value);
      if (modulusProperty && modulusLength && modulusLength < MINIMAL_MODULUS_LENGTH) {
        context.report({
          node: modulusProperty,
          message: `Use a modulus length of at least ${MINIMAL_MODULUS_LENGTH} bits for ${algorithm} cipher algorithm.`,
        });
      }
      const divisorProperty = getObjectExpressionProperty(options, 'divisorLength');
      const divisorLength = getNumericValue(divisorProperty?.value);
      if (divisorProperty && divisorLength && divisorLength < MINIMAL_DIVISOR_LENGTH) {
        context.report({
          node: divisorProperty,
          message: `Use a divisor length of at least ${MINIMAL_DIVISOR_LENGTH} bits for ${algorithm} cipher algorithm.`,
        });
      }
    }

    function checkEcCurve(options: estree.Node) {
      const namedCurveProperty = getObjectExpressionProperty(options, 'namedCurve');
      const namedCurve = getValueOfExpression<estree.Literal>(
        context,
        namedCurveProperty?.value,
        'Literal',
      )?.value?.toString();
      if (namedCurveProperty && namedCurve && WEAK_CURVES.includes(namedCurve)) {
        context.report({
          node: namedCurveProperty,
          message: `${namedCurve} doesn't provide enough security. Use a stronger curve.`,
        });
      }
    }

    return {
      CallExpression: (node: estree.Node) => {
        const callExpression = node as estree.CallExpression;
        const { callee } = callExpression;
        if (
          callee.type === 'MemberExpression' &&
          isIdentifier(callee.property, 'generateKeyPair', 'generateKeyPairSync')
        ) {
          if (callExpression.arguments.length < 2) {
            return;
          }
          const [algorithmArg, options] = callExpression.arguments;
          const optionsArg = getValueOfExpression<estree.ObjectExpression>(
            context,
            options,
            'ObjectExpression',
          );
          if (!optionsArg) {
            return;
          }
          const algorithm = getValueOfExpression<estree.Literal>(context, algorithmArg, 'Literal')
            ?.value;
          if (algorithm === 'rsa' || algorithm === 'dsa') {
            checkRsaAndDsaOptions(algorithm, optionsArg);
          } else if (algorithm === 'ec') {
            checkEcCurve(optionsArg);
          }
        }
      },
    };
  },
};
