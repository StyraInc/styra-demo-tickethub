package com.styra.tickethub_springboot.dao.model;

/**
 * This class models the data to be returned from an OPA-SpringBoot policy
 * under the context key. It is used for deserialization.
 */
public class OPAResponseContext {
    private String reason;

    public String getReason() {
        return this.reason;
    }

    public void setReason(String newReason) {
        this.reason = newReason;
    }
}
