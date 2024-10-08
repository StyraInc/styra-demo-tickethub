package com.styra.tickethub;

import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.util.HashMap;
import java.util.Map;

import static java.util.Map.entry;

@Provider
public class ForbiddenExceptionWithReasonMapper implements ExceptionMapper<ForbiddenExceptionWithReason> {

    @Override
    public Response toResponse(ForbiddenExceptionWithReason exception) {

        ObjectMapper mapper = new ObjectMapper();
        Map<String, String> payload = new HashMap<>();
        payload.put("message", exception.getMessage());

        if (exception.getReason() != null) {
            payload.put("reason", exception.getReason());
        }

        try {
            String json = mapper.writeValueAsString(payload);

            return Response.status(Response.Status.FORBIDDEN)
                           .entity(json)
                           .type(MediaType.APPLICATION_JSON)
                           .build();

        } catch (JsonProcessingException e) {

            return Response.status(Response.Status.FORBIDDEN)
                           .entity("{\"message\": \"exception while formatting JSON (this should never happen)\"}")
                           .type(MediaType.APPLICATION_JSON)
                           .build();

        }

    }
}

