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
// https://jira.sonarsource.com/browse/RSPEC-S3759

import { Rule } from 'eslint';
import * as estree from 'estree';
import * as ts from 'typescript';
import { isRequiredParserServices } from '../utils/isRequiredParserServices';
import { getTypeFromTreeNode } from './utils';

const emberProperties = [
  'camelize',
  'capitalize',
  'classify',
  'dasherize',
  'decamelize',
  'fmt',
  'loc',
  'underscore',
  'w',
  'quote',
];

export const rule: Rule.RuleModule = {
  create(context: Rule.RuleContext) {
    const services = context.parserServices;
    if (!isRequiredParserServices(services)) {
      return {};
    }

    function isEmberPropertyAccess(type: ts.Type, propertyName: string) {
      return (type.flags & ts.TypeFlags.StringLike) !== 0 && emberProperties.includes(propertyName);
    }
    return {
      MemberExpression: (node: estree.Node) => {
        const { object, property } = node as estree.MemberExpression;
        const type = getTypeFromTreeNode(object, services);
        const props = type.getProperties();
        if (property.type !== 'Identifier') {
          return;
        }
        if (type.flags & ts.TypeFlags.Object) {
          return;
        }
        if (
          !props.some(p => p.name === property.name) &&
          !isEmberPropertyAccess(type, property.name)
        ) {
          context.report({ node: property, message: 'todo' });
        }
      },
    };
  },
};
