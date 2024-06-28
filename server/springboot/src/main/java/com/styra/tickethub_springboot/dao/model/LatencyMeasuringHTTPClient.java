package com.styra.tickethub_springboot.dao.model;

// This is based on the SpeakeasyHTTPClient that was generated for the Java
// SDK, but has been modified to allow injecting additional headers.

import com.styra.opa.openapi.utils.HTTPClient;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.net.http.HttpRequest.Builder;

/**
 * This HTTPClient implementation also injects additional headers provided to
 * its constructor into each HTTP request that it sends. This is meant to be
 * used as the HTTP client implementation for instances of the Speakeasy
 * generated OPA SDK.
 */
public class LatencyMeasuringHTTPClient implements HTTPClient {

    private Map<String, String> headers;

    /**
     * Instantiates a new HTTP client suitable for use with the Speakeasy SDK,
     * but with additional headers included in every request.
     *
     * @param extraHeaders The extra headers to include.
     */
    public LatencyMeasuringHTTPClient(Map<String, String> extraHeaders) {
        headers = extraHeaders;
    }

    /**
     * If instantiated with this constructor, OPAHTTPClient will be initialized
     * with an empty list of extra headers to inject.
     */
    public LatencyMeasuringHTTPClient() {
        headers = new HashMap<String, String>();
    }

    /**
     * This method implements compatibility with the
     * com.styra.opa.sdk.utils.HTTPClient interface.
     */
    @Override
    public HttpResponse<InputStream> send(HttpRequest request)
            throws IOException, InterruptedException, URISyntaxException {

        long fStartTime = System.nanoTime();


        // At this point, the HTTP request has already been built, so there
        // is no way to add a new header, see:
        //
        //     https://stackoverflow.com/questions/73298866/
        //
        // Consequentially, we need to make a new builder and copy all of the
        // existing request data into it.

        Builder b = HttpRequest.newBuilder(request.uri());
        b.method(
                request.method(),
                request.bodyPublisher().orElse(HttpRequest.BodyPublishers.noBody()));

        Map<String, List<String>> existingHeaders = request.headers().map();
        for (String headerKey : existingHeaders.keySet()) {
            // .map() gives us a list of strings, but .header() only accepts
            // a scalar, so we have to do the conversion ourselves.
            String value = String.join(" ", existingHeaders.get(headerKey));
            b.header(headerKey, value);
        }

        for (String headerKey : headers.keySet()) {
            b.header(headerKey, headers.get(headerKey));
        }

        if (request.timeout().isPresent()) {
            b.timeout(request.timeout().get());
        }

        if (request.version().isPresent()) {
            b.version(request.version().get());
        }

        HttpRequest newRequest = b.build();

        HttpClient client = HttpClient.newHttpClient();

        long startTime = System.nanoTime();
        HttpResponse<InputStream> response = client.send(newRequest, HttpResponse.BodyHandlers.ofInputStream());
        long endTime = System.nanoTime();

        long sendLatency = endTime - startTime;
        long overheadLatency = (endTime - fStartTime) - sendLatency;

        System.out.printf("DEBUG: sendLatency=%fms overheadLatency=%fms\n", sendLatency/1000000.0, overheadLatency/1000000.0);

        return response;
    }
}
