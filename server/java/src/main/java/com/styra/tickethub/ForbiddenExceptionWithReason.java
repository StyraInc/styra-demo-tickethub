package com.styra.tickethub;

import jakarta.ws.rs.ForbiddenException;

public class ForbiddenExceptionWithReason extends ForbiddenException {
    private String reason;

    public ForbiddenExceptionWithReason(String message, String reason) {
        super(message);
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }
}

