package com.styra.tickethub_springboot.dao.model;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

// This custom authN filter implements the simplified authorization header
// setup that the TicketHub demo uses.

public class CustomAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // NOTE: we can't just use the MDC versions of the header information,
        // because this filter runs before the request header interceptor does.
        // We could consider moving the MDC.put() calls here perhaps, or else
        // just use the session authN information instead of MDC.

        String authHeader = request.getHeader("Authorization");
        var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
        if (components.length == 3) {
            String tenantName = components[1].trim();
            String userName = components[2].trim();

            Authentication auth = new CustomAuthentication(tenantName, userName);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}

