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

import { Rule } from 'eslint';
import * as estree from 'estree';
import CodePath = Rule.CodePath;

export const ucfgs = new Map<string, any>();

interface Options {
  emit: boolean;
}

export const rule: Rule.RuleModule = {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          emit: {
            type: 'boolean',
          },
        },
      },
    ],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    // maybe there is a better way to properly typecheck this
    const options: Options =
      context.options.length > 0
        ? ((context.options[0] as unknown) as Options)
        : {
            emit: true,
          };

    return {
      onCodePathStart(codePath: CodePath, node: estree.Node) {
        if (node.type === 'Program') {
          // clear ucfgs from previous file to avoid consuming too much memory
          ucfgs.clear();
        }
        console.log('start', codePath.id, node.type);
        const suffix = node.type === 'FunctionDeclaration' && node.id ? node.id.name : node.type;
        ucfgs.set(`${codePath.id}_${suffix}`, {});
      },
      onCodePathEnd(codePath: Rule.CodePath, node: estree.Node) {
        console.log('end', codePath.id, node.type);
      },
      'Program:exit': () => {
        if (options.emit) {
          console.log('emitting to FS');
        }
      },
    };
  },
};
