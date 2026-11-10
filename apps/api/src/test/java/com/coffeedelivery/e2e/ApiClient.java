package com.coffeedelivery.e2e;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.util.Map;

/** A tiny HTTP client for the end-to-end tests, bound to the random port of the running API. */
public final class ApiClient {

  private final HttpClient client = HttpClient.newHttpClient();
  private final int port;

  public ApiClient(int port) {
    this.port = port;
  }

  public HttpResponse<String> get(String path) {
    return send(HttpRequest.newBuilder(uri(path)).GET().build());
  }

  public HttpResponse<String> post(String path, String jsonBody) {
    return post(path, jsonBody, Map.of());
  }

  public HttpResponse<String> post(String path, String jsonBody, Map<String, String> headers) {
    HttpRequest.Builder request =
        HttpRequest.newBuilder(uri(path))
            .header("Content-Type", "application/json")
            .POST(BodyPublishers.ofString(jsonBody));
    headers.forEach(request::header);
    return send(request.build());
  }

  private URI uri(String path) {
    return URI.create("http://localhost:" + port + path);
  }

  private HttpResponse<String> send(HttpRequest request) {
    try {
      return client.send(request, BodyHandlers.ofString());
    } catch (Exception exception) {
      throw new IllegalStateException("Request failed: " + request.uri(), exception);
    }
  }
}
