package com.coffeedelivery.e2e;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import javax.sql.DataSource;

/**
 * Counts what the application asks of the database, for the tests that prove how many statements
 * and connections a use case needs. It wraps a {@link DataSource} in JDK dynamic proxies (a data
 * source, its connections, and their statements) and keeps:
 *
 * <ul>
 *   <li>the number of connections taken from the data source, and
 *   <li>one entry per execution, such as {@code executeUpdate: INSERT INTO ...}. A batch is one
 *       execution ({@code executeBatch}), however many rows it carries.
 * </ul>
 *
 * Call {@link #reset()} before the action to measure.
 */
public final class StatementCounter {

  private static final Set<String> EXECUTIONS =
      Set.of(
          "execute",
          "executeQuery",
          "executeUpdate",
          "executeLargeUpdate",
          "executeBatch",
          "executeLargeBatch");

  private final List<String> statements = new CopyOnWriteArrayList<>();
  private final AtomicInteger connections = new AtomicInteger();

  public void reset() {
    statements.clear();
    connections.set(0);
  }

  /** One entry per statement execution since the last {@link #reset()}, in order. */
  public List<String> statements() {
    return List.copyOf(statements);
  }

  /** The connections taken from the data source since the last {@link #reset()}. */
  public int connections() {
    return connections.get();
  }

  /** The data source, counting. */
  DataSource wrap(DataSource target) {
    return proxy(
        DataSource.class,
        target,
        (method, result, arguments) -> {
          if (method.getName().equals("getConnection")) {
            connections.incrementAndGet();
            return wrapConnection((Connection) result);
          }
          return result;
        });
  }

  private Connection wrapConnection(Connection target) {
    return proxy(
        Connection.class,
        target,
        (method, result, arguments) -> {
          String name = method.getName();
          boolean makesStatement =
              name.equals("prepareStatement")
                  || name.equals("prepareCall")
                  || name.equals("createStatement");
          if (makesStatement && result instanceof Statement statement) {
            String sql = arguments != null && arguments[0] instanceof String text ? text : null;
            return wrapStatement(statement, sql);
          }
          return result;
        });
  }

  private Statement wrapStatement(Statement target, String sql) {
    Class<? extends Statement> type =
        target instanceof PreparedStatement ? PreparedStatement.class : Statement.class;
    return proxy(
        type,
        target,
        (method, result, arguments) -> {
          if (EXECUTIONS.contains(method.getName())) {
            String text =
                sql != null ? sql : (arguments != null ? String.valueOf(arguments[0]) : "");
            statements.add(method.getName() + ": " + text.strip().replaceAll("\\s+", " "));
          }
          return result;
        });
  }

  /** What to do with the result of a call on the real object. */
  private interface Observer {
    Object after(Method method, Object result, Object[] arguments) throws Throwable;
  }

  @SuppressWarnings("unchecked")
  private static <T> T proxy(Class<T> type, Object target, Observer observer) {
    InvocationHandler handler =
        (proxy, method, arguments) -> {
          Object result;
          try {
            result = method.invoke(target, arguments);
          } catch (InvocationTargetException exception) {
            throw exception.getCause();
          }
          return observer.after(method, result, arguments);
        };
    return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, handler);
  }
}
