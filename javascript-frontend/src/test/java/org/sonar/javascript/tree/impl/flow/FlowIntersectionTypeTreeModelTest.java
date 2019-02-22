/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2019 SonarSource SA
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
package org.sonar.javascript.tree.impl.flow;

import org.junit.Test;
import org.sonar.javascript.utils.JavaScriptTreeModelTest;
import org.sonar.plugins.javascript.api.tree.Tree.Kind;
import org.sonar.plugins.javascript.api.tree.flow.FlowIntersectionTypeTree;

import static org.assertj.core.api.Assertions.assertThat;

public class FlowIntersectionTypeTreeModelTest extends JavaScriptTreeModelTest {

  @Test
  public void test() throws Exception {
    // var x: (A & B & C) | (D);
    FlowIntersectionTypeTree tree = parse("var x: & A & B & C | D", Kind.FLOW_INTERSECTION_TYPE);

    assertThat(tree.is(Kind.FLOW_INTERSECTION_TYPE)).isTrue();
    assertThat(tree.startAndToken()).isNotNull();
    assertThat(tree.subTypes()).hasSize(3);
    assertThat(tree.subTypes().getSeparators()).hasSize(2);
    assertThat(tree.subTypes().getSeparator(0).text()).isEqualTo("&");
    assertThat(tree.parent().is(Kind.FLOW_UNION_TYPE)).isTrue();
  }

}
