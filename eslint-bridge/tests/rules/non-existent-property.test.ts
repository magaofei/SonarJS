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
import { RuleTesterTs } from '../RuleTesterTs';
import { rule } from 'rules/non-existent-property';

const ruleTesterTs = new RuleTesterTs();

const testCases = {
  valid: [
    {
      code: `
      var x = Array.xxx;
            `,
    },
    {
      code: `
      function primitive_wrappers(x) {
        new String(x).foo; // Noncompliant
        new Number(x).foo; // Noncompliant
        new Boolean(x).foo; // Noncompliant
      }
          `,
    },
    {
      code: `
      function unknownObj() {
        var a = {}
        return a.foo;
      }
            `,
    },
    {
      code: `
      function ember_api() {
        "foo".camelize();
        "foo".capitalize();
        "foo".classify();
        "foo".dasherize();
        "foo".decamelize();
        "foo".fmt();
        "foo".loc();
        "foo".underscore();
        "foo".w();
      }
            `,
    },
  ],
  invalid: [
    {
      code: `
      function foo() {
        var s = "";
        s.length;
        s.lenght; // Noncompliant
      //^^^^^^^^
      }
            `,
      errors: 1,
    },
    {
      code: `
      function assignment_nok() {
        var s = "";
        x = s.lenght; // Noncompliant {{Remove this access to "lenght" property, it doesn't exist, as a built-in, on a String.}}
        s.lenght = 0; // Noncompliant
        x = Array.xxx; // FN {{Remove this access to "xxx" property, it doesn't exist, as a built-in, on this object.}}
      }
            `,
      errors: 2,
    },
    {
      code: `
      function single_issue_per_tree() {
        var s = "";
        if (condition) {
          s = "other";
        }
        s.lenght; // Noncompliant
      }
            `,
      errors: 1,
    },
    {
      code: `
      var s = foo() || "";
      if (s.bar) {// Noncompliant
        s.bar();// Noncompliant
      }
            `,
      errors: 2,
    },
  ],
};

ruleTesterTs.run('todo', rule, testCases);
