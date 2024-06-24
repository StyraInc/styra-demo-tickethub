package com.styra.tickethub_springboot.dao.model;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// As far as I can tell, there is no way to directly access HTTP headers from
// deserializers in SpringBoot, so we have to register this special interceptor
// class to extract them and put them into this MDC thing.

@Component
public class RequestHeaderInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String authHeader = request.getHeader("Authorization");

        var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
        if (components.length != 3) {
            System.out.println("ERROR: invalid auth header: " + authHeader);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header is malformed");
        }
        String tenantName = components[1].trim();
        String userName = components[2].trim();

        MDC.put("TENANT_NAME", tenantName);
        MDC.put("USER_NAME", userName);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        MDC.clear();
    }
}
