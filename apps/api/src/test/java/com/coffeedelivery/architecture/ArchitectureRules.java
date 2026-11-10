package com.coffeedelivery.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaCodeUnit;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.domain.JavaModifier;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import com.tngtech.archunit.library.dependencies.SlicesRuleDefinition;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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

  /**
   * The decision of spec 036: {@code application} may use {@code @Service} and the exceptions of
   * {@code shared.error}, and nothing else of Spring or of the web.
   */
  ArchRule applicationUsesOnlyItsOwnLayersAndTheAllowedLibraries() {
    return classes()
        .that()
        .resideInAPackage(base + ".*.application..")
        .should()
        .onlyDependOnClassesThat()
        .resideInAnyPackage(
            base + ".*.domain..",
            base + ".*.application..",
            base + ".shared.error..",
            "java..",
            "org.springframework.stereotype..")
        .as(
            "application depends on domain, application, shared.error, java, and Spring"
                + " stereotypes only");
  }

  ArchRule infrastructureDoesNotUseInterfaces() {
    return noClasses()
        .that()
        .resideInAPackage(base + ".*.infrastructure..")
        .should()
        .dependOnClassesThat()
        .resideInAPackage(base + ".*.interfaces..")
        .as("infrastructure does not depend on interfaces");
  }

  ArchRule sharedDoesNotUseASlice() {
    return classes()
        .that()
        .resideInAPackage(base + ".shared..")
        .should(notDependOnAnySlice())
        .as("shared does not depend on any slice");
  }

  ArchRule restControllersAreRequestHandlersInInterfaces() {
    return classes()
        .that()
        .areAnnotatedWith("org.springframework.web.bind.annotation.RestController")
        .should()
        .resideInAPackage(base + ".*.interfaces..")
        .andShould()
        .haveSimpleNameEndingWith("RequestHandler")
        .as("every @RestController is in interfaces and named *RequestHandler");
  }

  ArchRule servicesAreUseCasesInApplication() {
    return classes()
        .that()
        .areAnnotatedWith("org.springframework.stereotype.Service")
        .should()
        .resideInAPackage(base + ".*.application..")
        .andShould()
        .haveSimpleNameEndingWith("UseCase")
        .as("every @Service is in application and named *UseCase");
  }

  ArchRule requestHandlersDependOnExactlyOneUseCase() {
    return classes()
        .that()
        .haveSimpleNameEndingWith("RequestHandler")
        .should(dependOnExactlyOneUseCase())
        .as("every request handler depends on exactly one use case");
  }

  /**
   * An entry point is a request handler or a scheduled job ({@code *Job}): each use case has
   * exactly one (spec 038 added the first job).
   */
  ArchRule useCasesHaveExactlyOneEntryPoint() {
    return classes()
        .that()
        .haveSimpleNameEndingWith("UseCase")
        .should(haveExactlyOneEntryPoint())
        .as("every use case is used by exactly one request handler or scheduled job");
  }

  ArchRule domainHasNoFloatingPointOrBigDecimal() {
    return classes()
        .that()
        .resideInAPackage(base + ".*.domain..")
        .should(haveNoFloatingPointOrBigDecimalTypes())
        .as("domain has no double, float, Double, Float, or BigDecimal (money is whole cents)");
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

  private ArchCondition<JavaClass> notDependOnAnySlice() {
    return new ArchCondition<>("not depend on any slice") {
      @Override
      public void check(JavaClass origin, ConditionEvents events) {
        for (Dependency dependency : origin.getDirectDependenciesFromSelf()) {
          if (sliceOf(dependency.getTargetClass().getPackageName()) != null) {
            events.add(SimpleConditionEvent.violated(dependency, dependency.getDescription()));
          }
        }
      }
    };
  }

  private static ArchCondition<JavaClass> dependOnExactlyOneUseCase() {
    return new ArchCondition<>("depend on exactly one use case") {
      @Override
      public void check(JavaClass handler, ConditionEvents events) {
        List<String> useCases =
            handler.getDirectDependenciesFromSelf().stream()
                .map(Dependency::getTargetClass)
                .filter(target -> target.getSimpleName().endsWith("UseCase"))
                .map(JavaClass::getName)
                .distinct()
                .toList();
        String message = handler.getName() + " depends on the use cases " + useCases;
        events.add(
            useCases.size() == 1
                ? SimpleConditionEvent.satisfied(handler, message)
                : SimpleConditionEvent.violated(handler, message + " (expected exactly one)"));
      }
    };
  }

  private static ArchCondition<JavaClass> haveExactlyOneEntryPoint() {
    return new ArchCondition<>("be used by exactly one request handler or scheduled job") {
      @Override
      public void check(JavaClass useCase, ConditionEvents events) {
        List<String> handlers =
            useCase.getDirectDependenciesToSelf().stream()
                .map(Dependency::getOriginClass)
                .filter(
                    origin ->
                        origin.getSimpleName().endsWith("RequestHandler")
                            || origin.getSimpleName().endsWith("Job"))
                .map(JavaClass::getName)
                .distinct()
                .toList();
        String message = useCase.getName() + " is used by the entry points " + handlers;
        events.add(
            handlers.size() == 1
                ? SimpleConditionEvent.satisfied(useCase, message)
                : SimpleConditionEvent.violated(useCase, message + " (expected exactly one)"));
      }
    };
  }

  private static final Set<String> FORBIDDEN_NUMBER_TYPES =
      Set.of("double", "float", "java.lang.Double", "java.lang.Float", "java.math.BigDecimal");

  private static ArchCondition<JavaClass> haveNoFloatingPointOrBigDecimalTypes() {
    return new ArchCondition<>(
        "have no double, float, or BigDecimal in a field, parameter, or return") {
      @Override
      public void check(JavaClass domainClass, ConditionEvents events) {
        domainClass
            .getFields()
            .forEach(
                field -> {
                  if (FORBIDDEN_NUMBER_TYPES.contains(field.getRawType().getName())) {
                    events.add(
                        SimpleConditionEvent.violated(
                            field,
                            field.getDescription()
                                + " has the type "
                                + field.getRawType().getName()));
                  }
                });
        for (JavaCodeUnit unit : codeUnits(domainClass)) {
          unit.getRawParameterTypes()
              .forEach(
                  type -> {
                    if (FORBIDDEN_NUMBER_TYPES.contains(type.getName())) {
                      events.add(
                          SimpleConditionEvent.violated(
                              unit, unit.getDescription() + " takes a " + type.getName()));
                    }
                  });
          if (FORBIDDEN_NUMBER_TYPES.contains(unit.getRawReturnType().getName())) {
            events.add(
                SimpleConditionEvent.violated(
                    unit,
                    unit.getDescription() + " returns a " + unit.getRawReturnType().getName()));
          }
        }
      }
    };
  }

  private static List<JavaCodeUnit> codeUnits(JavaClass javaClass) {
    List<JavaCodeUnit> units = new ArrayList<>();
    units.addAll(javaClass.getMethods());
    units.addAll(javaClass.getConstructors());
    return units;
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
