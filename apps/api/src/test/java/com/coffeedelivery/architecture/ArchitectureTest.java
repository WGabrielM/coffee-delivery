package com.coffeedelivery.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

/** Enforces the slice architecture on the real code. Do not weaken a rule to make a change pass. */
class ArchitectureTest {

  private static final JavaClasses CLASSES =
      new ClassFileImporter()
          .withImportOption(new ImportOption.DoNotIncludeTests())
          .importPackages("com.coffeedelivery");

  private final ArchitectureRules rules = new ArchitectureRules("com.coffeedelivery");

  @Test
  void domainIsIndependent() {
    rules.domainIsIndependent().check(CLASSES);
  }

  @Test
  void applicationDoesNotUseOuterLayers() {
    rules.applicationDoesNotUseOuterLayers().check(CLASSES);
  }

  @Test
  void interfacesDoNotUseInfrastructure() {
    rules.interfacesDoNotUseInfrastructure().check(CLASSES);
  }

  @Test
  void slicesDoNotUseEachOthersOuterLayers() {
    rules.slicesDoNotUseEachOthersOuterLayers().check(CLASSES);
  }

  @Test
  void slicesAreFreeOfCycles() {
    rules.slicesAreFreeOfCycles().check(CLASSES);
  }

  @Test
  void useCasesHaveOnePublicMethodNamedExecute() {
    rules.useCasesHaveOnePublicMethodNamedExecute().check(CLASSES);
  }

  @Test
  void requestHandlersHaveOnePublicMethodNamedHandle() {
    rules.requestHandlersHaveOnePublicMethodNamedHandle().check(CLASSES);
  }
}
