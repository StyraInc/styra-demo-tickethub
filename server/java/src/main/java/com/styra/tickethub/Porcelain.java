package com.styra.tickethub;

import com.styra.opa.Opa;

import com.styra.opa.models.operations.ExecutePolicyWithInputRequest;
import com.styra.opa.models.operations.ExecutePolicyWithInputRequestBody;
import com.styra.opa.models.operations.ExecutePolicyWithInputResponse;

import com.styra.opa.models.shared.Explain;
import com.styra.opa.models.shared.Input;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

// TODO: select an appropriate name and move this into the SDK
public class Porcelain {

    // Stores the state needed to communicate with OPA, such as the HTTP client
    // and configuration information. This is re-used across requests.
    private Opa sdk;

    // Instantiates a new instance of the Speakeasy generated SDK internally
    // with default settings.
    public Porcelain() {
        sdk = Opa.builder().build();
    }


    public Porcelain(String opaURL) {
        sdk = Opa.builder().serverURL(opaURL).build();
    }

    // Use a custom instance of the Speakeasy generated SDK. This can allow for
    // modifying configuration options that are not otherwise exposed in the
    // porcelain API.
    public Porcelain(Opa sdk) {
        this.sdk = sdk;
    }

    public boolean check(java.util.Map<String, Object> input, String path) throws Exception {
        return query(input, path);
    }

    public boolean check(String input, String path) throws Exception {
        return query(input, path);
    }

    public boolean check(boolean input, String path) throws Exception {
        return query(input, path);
    }

    public boolean check(double input, String path) throws Exception {
        return query(input, path);
    }

    public boolean check(java.util.List<Object> input, String path) throws Exception {
        return query(input, path);
    }

    public <T> T query(java.util.Map<String, Object> input, String path) throws Exception {
        return queryMachinery(Input.of(input), path);
    }

    public <T> T query(String input, String path) throws Exception {
        return queryMachinery(Input.of(input), path);
    }

    public <T> T query(boolean input, String path) throws Exception {
        return queryMachinery(Input.of(input), path);
    }

    public <T> T query(double input, String path) throws Exception {
        return queryMachinery(Input.of(input), path);
    }

    public <T> T query(java.util.List<Object> input, String path) throws Exception {
        return queryMachinery(Input.of(input), path);
    }

    // TODO: wrap exception types with something we control.
    private <T> T queryMachinery(Input input, String path) throws Exception {
        ExecutePolicyWithInputRequest req = ExecutePolicyWithInputRequest.builder()
            .path(path)
            .requestBody(ExecutePolicyWithInputRequestBody.builder()
                    .input(input).build())
            .pretty(false)
            .provenance(false)
            .explain(Explain.NOTES)
            .metrics(false)
            .instrument(false)
            .strictBuiltinErrors(false)
            .build();

        ExecutePolicyWithInputResponse res = sdk.executePolicyWithInput()
            .request(req)
            .call();

        if (res.successfulPolicyEvaluation().isPresent()) {
            Object out = res.successfulPolicyEvaluation().get().result().get().value();
            ObjectMapper mapper = new ObjectMapper();
            T typedResult = mapper.convertValue(out, new TypeReference<T>() {});
            return typedResult;
        } else {
            return null;
        }
    }
}
