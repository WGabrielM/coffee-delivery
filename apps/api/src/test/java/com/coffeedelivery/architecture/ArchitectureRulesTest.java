package com.coffeedelivery.architecture;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import java.util.function.Function;
import org.junit.jupiter.api.Test;

/**
 * Proves that each architecture rule catches the violation it exists for. The fixtures under {@code
 * architecture.fixtures} break the rules on purpose; {@code clean} follows all of them.
 */
class ArchitectureRulesTest {

  private static final String FIXTURES = "com.coffeedelivery.architecture.fixtures";
  private static final String CLEAN = FIXTURES + ".clean";
  private static final String VIOLATIONS = FIXTURES + ".violations";

  private static final JavaClasses CLEAN_CLASSES = new ClassFileImporter().importPackages(CLEAN);
  private static final JavaClasses VIOLATING_CLASSES =
      new ClassFileImporter().importPackages(VIOLATIONS);

  private final ArchitectureRules cleanRules = new ArchitectureRules(CLEAN);
  private final ArchitectureRules violationRules = new ArchitectureRules(VIOLATIONS);

  @Test
  void cleanCodePassesEveryRule() {
    assertThatCode(
            () -> {
              cleanRules.domainIsIndependent().check(CLEAN_CLASSES);
              cleanRules.applicationDoesNotUseOuterLayers().check(CLEAN_CLASSES);
              cleanRules.interfacesDoNotUseInfrastructure().check(CLEAN_CLASSES);
              cleanRules.slicesDoNotUseEachOthersOuterLayers().check(CLEAN_CLASSES);
              cleanRules.slicesAreFreeOfCycles().check(CLEAN_CLASSES);
              cleanRules.useCasesHaveOnePublicMethodNamedExecute().check(CLEAN_CLASSES);
              cleanRules.requestHandlersHaveOnePublicMethodNamedHandle().check(CLEAN_CLASSES);
            })
        .doesNotThrowAnyException();
  }

  @Test
  void domainMayNotUseSpring() {
    assertViolation(ArchitectureRules::domainIsIndependent, "SpringLeak");
  }

  @Test
  void domainMayNotUseApplication() {
    assertViolation(ArchitectureRules::domainIsIndependent, "LayerLeak");
  }

  @Test
  void applicationMayNotUseInfrastructure() {
    assertViolation(ArchitectureRules::applicationDoesNotUseOuterLayers, "AppLeak");
  }

  @Test
  void interfacesMayNotUseInfrastructure() {
    assertViolation(ArchitectureRules::interfacesDoNotUseInfrastructure, "IfaceLeak");
  }

  @Test
  void aSliceMayNotUseAnotherSlicesInfrastructure() {
    assertViolation(ArchitectureRules::slicesDoNotUseEachOthersOuterLayers, "CrossUser");
  }

  @Test
  void slicesMayNotFormACycle() {
    assertViolation(ArchitectureRules::slicesAreFreeOfCycles, "cyclea");
  }

  @Test
  void aUseCaseWithAnExtraPublicMethodFails() {
    assertViolation(
        ArchitectureRules::useCasesHaveOnePublicMethodNamedExecute, "TwoMethodsUseCase");
  }

  @Test
  void aUseCaseWhoseMethodIsNotExecuteFails() {
    assertViolation(ArchitectureRules::useCasesHaveOnePublicMethodNamedExecute, "WrongNameUseCase");
  }

  @Test
  void aRequestHandlerWithAnExtraPublicMethodFails() {
    assertViolation(
        ArchitectureRules::requestHandlersHaveOnePublicMethodNamedHandle,
        "TwoMethodsRequestHandler");
  }

  private void assertViolation(Function<ArchitectureRules, ArchRule> rule, String culprit) {
    ArchRule archRule = rule.apply(violationRules);
    assertThatThrownBy(() -> archRule.check(VIOLATING_CLASSES))
        .isInstanceOf(AssertionError.class)
        .hasMessageContaining(culprit);
  }
}
