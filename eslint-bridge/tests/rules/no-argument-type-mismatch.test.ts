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
import { rule } from 'rules/no-argument-type-mismatch';
import { RuleTesterTs } from '../RuleTesterTs';

const ruleTester = new RuleTesterTs();
ruleTester.run(`Arguments to built-in functions should match documented types`, rule, {
  valid: [
    {
      code: `
        let str = 'hello';
        str.charAt(5);
        `,
    },
    {
      code: `
        let str = 'hello', idx = 5;
        str.charAt(idx);
        `,
    },
    {
      code: `
        let str = 'hello folks';
        str.replace('folks', 'world');
        `,
    },
    {
      code: `
        let str = 'hello folks', before = 'folks', after = 'world';
        str.replace(before, after);
        `,
    },
    {
      code: `
        let arr = [1, 2, 3];
        arr.concat([4, 5, 6], [7, 8, 9]);
        `,
    },
    {
      code: `
        var x = "5";
        if (unknown()) {
          x = 5;
        }
        str.charAt(x); // one path has right type
      `,
    },
  ],
  invalid: [
    {
      code: `
        let str = 'hello';
        str.charAt("5");
        `,
      errors: 1,
    },
    {
      code: `
        let arr = [1, 2, 3];
        arr.concat('hello', true);
        `,
      errors: 2,
    },
    {
      code: `
        let arr = [1, 2, 3];
        arr.map('hello');
        `,
      errors: 1,
    },
    {
      code: `parseInt(true)`,
      errors: 1,
    },
    {
      code: `Object.create(null); // FP: TypeScript compiler only expects 'object' instead of 'object | null'`,
      errors: 1,
    },
  ],
});
