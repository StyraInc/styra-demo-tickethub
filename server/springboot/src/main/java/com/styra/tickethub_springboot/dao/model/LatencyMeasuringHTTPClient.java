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

import com.styra.opa.utils.OPAHTTPClient;

/**
 * This HTTPClient implementation also injects additional headers provided to
 * its constructor into each HTTP request that it sends. This is meant to be
 * used as the HTTP client implementation for instances of the Speakeasy
 * generated OPA SDK.
 */
public class LatencyMeasuringHTTPClient extends OPAHTTPClient {

    @Override
    public HttpResponse<InputStream> send(HttpRequest request)
            throws IOException, InterruptedException, URISyntaxException {

        long startTime = System.nanoTime();
     HttpResponse<InputStream> response = super.send(request);
        long endTime = System.nanoTime();

        long sendLatency = endTime - startTime;

        System.out.printf("DEBUG: sendLatency=%fms\n", sendLatency/1000000.0);

        return response;
    }
}
