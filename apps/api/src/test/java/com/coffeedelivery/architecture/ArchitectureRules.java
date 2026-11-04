package com.coffeedelivery.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;
import java.util.List;

/**
 * The slice architecture as rules. The package layout is {@code <base>.<slice>.<layer>}, with the
 * layers {@code domain}, {@code application}, {@code infrastructure}, and {@code interfaces}. The
 * {@code shared} package is not a slice. The base package is a parameter so the same rules run on
 * the real code and on fixtures that break them on purpose.
 */
final class ArchitectureRules {

  private final String base;

  ArchitectureRules(String basePackage) {
    this.base = basePackage;
  }

  ArchRule domainIsIndependent() {
    return noClasses()
        .that()
        .resideInAPackage(base + ".*.domain..")
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(
            base + ".*.application..",
            base + ".*.infrastructure..",
            base + ".*.interfaces..",
            "org.springframework..",
            "tools.jackson..",
            "com.fasterxml.jackson..")
        .as("domain depends on no other layer, on Spring, or on a JSON library");
  }

  ArchRule applicationDoesNotUseOuterLayers() {
    return noClasses()
        .that()
        .resideInAPackage(base + ".*.application..")
        .should()
        .dependOnClassesThat()
        .resideInAnyPackage(base + ".*.infrastructure..", base + ".*.interfaces..")
        .as("application does not depend on infrastructure or interfaces");
  }

  ArchRule interfacesDoNotUseInfrastructure() {
    return noClasses()
        .that()
        .resideInAPackage(base + ".*.interfaces..")
        .should()
        .dependOnClassesThat()
        .resideInAPackage(base + ".*.infrastructure..")
        .as("interfaces do not depend on infrastructure");
  }

  ArchRule slicesDoNotUseEachOthersOuterLayers() {
    return classes()
        .should(notUseAnotherSlicesOuterLayers())
        .as("a slice does not use another slice's infrastructure or interfaces");
  }

  ArchRule slicesAreFreeOfCycles() {
    return SlicesRuleDefinition.slices()
        .matching(base + ".(*)..")
        .should()
        .beFreeOfCycles()
        .as("slices form no cycle");
  }

  ArchRule useCasesHaveOnePublicMethodNamedExecute() {
    return classes()
        .that()
        .haveSimpleNameEndingWith("UseCase")
        .should(haveOnePublicMethodNamed("execute"))
        .as("every use case has exactly one public method, execute");
  }

  ArchRule requestHandlersHaveOnePublicMethodNamedHandle() {
    return classes()
        .that()
        .haveSimpleNameEndingWith("RequestHandler")
        .should(haveOnePublicMethodNamed("handle"))
        .as("every request handler has exactly one public method, handle");
  }

  private ArchCondition<JavaClass> notUseAnotherSlicesOuterLayers() {
    return new ArchCondition<>("not use another slice's infrastructure or interfaces") {
      @Override
      public void check(JavaClass origin, ConditionEvents events) {
        String originSlice = sliceOf(origin.getPackageName());
        for (Dependency dependency : origin.getDirectDependenciesFromSelf()) {
          String targetPackage = dependency.getTargetClass().getPackageName();
          String targetSlice = sliceOf(targetPackage);
          if (targetSlice != null
              && !targetSlice.equals(originSlice)
              && isOuterLayer(layerOf(targetPackage))) {
            events.add(SimpleConditionEvent.violated(dependency, dependency.getDescription()));
          }
        }
      }
    };
  }

  private static ArchCondition<JavaClass> haveOnePublicMethodNamed(String name) {
    return new ArchCondition<>("have exactly one public method, named " + name) {
      @Override
      public void check(JavaClass item, ConditionEvents events) {
        List<String> publicMethods =
            item.getMethods().stream()
                .filter(method -> method.getModifiers().contains(JavaModifier.PUBLIC))
                .filter(method -> !method.getModifiers().contains(JavaModifier.SYNTHETIC))
                .map(JavaMethod::getName)
                .toList();
        boolean satisfied = publicMethods.size() == 1 && publicMethods.get(0).equals(name);
        String message =
            item.getName()
                + " has the public methods "
                + publicMethods
                + " (expected only "
                + name
                + ")";
        events.add(
            satisfied
                ? SimpleConditionEvent.satisfied(item, message)
                : SimpleConditionEvent.violated(item, message));
      }
    };
  }

  /** The slice of a package, or null for the base package itself and for {@code shared}. */
  private String sliceOf(String packageName) {
    String prefix = base + ".";
    if (!packageName.startsWith(prefix)) {
      return null;
    }
    String slice = packageName.substring(prefix.length()).split("\\.")[0];
    return slice.equals("shared") ? null : slice;
  }

  private String layerOf(String packageName) {
    String prefix = base + ".";
    if (!packageName.startsWith(prefix)) {
      return null;
    }
    String[] segments = packageName.substring(prefix.length()).split("\\.");
    return segments.length > 1 ? segments[1] : null;
  }

  private static boolean isOuterLayer(String layer) {
    return "infrastructure".equals(layer) || "interfaces".equals(layer);
  }
}
