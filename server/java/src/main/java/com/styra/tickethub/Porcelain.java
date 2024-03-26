package com.styra.tickethub;

import com.styra.opa.Opa;

import com.styra.opa.models.operations.ExecutePolicyWithInputRequest;
import com.styra.opa.models.operations.ExecutePolicyWithInputRequestBody;
import com.styra.opa.models.operations.ExecutePolicyWithInputResponse;

import com.styra.opa.models.shared.Explain;
import com.styra.opa.models.shared.Input;

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

    // Use a custom instance of the Speakeasy generated SDK. This can allow for
    // modifying configuration options that are not otherwise exposed in the
    // porcelain API.
    public Porcelain(Opa sdk) {
        this.sdk = sdk;
    }

    // TODO: support other types besides map.
    //
    // TODO: is java.lang.Object the simplest way to handle the different
    // return types we might want? This will push type errors across the
    // Java/Rego boundary into runtime.
    //
    // TODO: wrap exception types with something we control.
    public java.lang.Object ExecutePolicy(java.util.Map input, String path) throws Exception {
        return executePolicyMachinery(Input.of(input), path);
    }

    public java.lang.Object ExecutePolicy(String input, String path) throws Exception {
        return executePolicyMachinery(Input.of(input), path);
    }

    public java.lang.Object ExecutePolicy(boolean input, String path) throws Exception {
        return executePolicyMachinery(Input.of(input), path);
    }

    public java.lang.Object ExecutePolicy(double input, String path) throws Exception {
        return executePolicyMachinery(Input.of(input), path);
    }

    // TODO: array inputs

    private java.lang.Object executePolicyMachinery(Input input, String path) throws Exception {
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
            return out;
        } else {
            return null;
        }
    }
}
