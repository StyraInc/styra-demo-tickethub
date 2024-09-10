
package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        //response.setContentType("application/json;charset=UTF-8");
        //response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        Map<String, Object> responseBody = new HashMap<>();
        //responseBody.put("timestamp", System.currentTimeMillis());
        responseBody.put("status", 403);
        responseBody.put("error", "Forbidden");
        responseBody.put("reason", accessDeniedException.getMessage());
        //responseBody.put("path", request.getRequestURI());
        //

        System.out.println("XXXXXXXXXXXXXXXXXX custom handler called!");

        ObjectMapper mapper = new ObjectMapper();

        response.getWriter().write(mapper.writeValueAsString(responseBody));
    }
}
