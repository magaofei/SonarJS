import { rule, ucfgs } from 'rules/ucfg';
import { Linter, SourceCode, RuleTester } from 'eslint';
import { parseJavaScriptSourceFile } from 'parser';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018, sourceType: 'module' } });

/**
 * this is used to run standard RuleTester asserts (schema, ...)
 */
ruleTester.run('ucfg', rule, {
  valid: [
    {
      code: `const x = foo();`,
      options: [{ emit: true }],
    },
    {
      code: `const x = foo();`,
      options: [{ emit: false }],
    },
  ],
  invalid: [
    // this rule never reports an issue
  ],
});

test('translate ucfgs', () => {
  testUcfgs(`const x = foo();`, new Map([['s1_Program', {}]]));
});

test('translate source with function', () => {
  testUcfgs(
    `
    let x = 1;
    fun();
    bar();
    function fun() {}
    function bar() {}
    `,
    new Map([
      ['s1_Program', {}],
      ['s2_fun', {}],
      ['s3_bar', {}],
    ]),
  );
});

function testUcfgs(code: string, expected: Map<string, any>, emit = false): void {
  const linter = new Linter();
  linter.defineRule('ucfg', rule);

  const source = parseJavaScriptSourceFile(code);
  if (source instanceof SourceCode) {
    const messages = linter.verify(
      source,
      { rules: { ucfg: ['error', { emit }] }, parserOptions: { ecmaVersion: 2018 } },
      'file.ts',
    );
    // no issues should be reported
    expect(messages).toEqual([]);

    console.log(ucfgs);
    expect(ucfgs).toStrictEqual(expected);
  } else {
    fail(`Parsing error: ${source}`);
  }
}
