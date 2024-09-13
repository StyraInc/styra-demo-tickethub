package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;

import com.styra.opa.springboot.OPAAccessDeniedException;
import com.styra.opa.springboot.OPAAuthorizationDecision;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final AuthorizationManager<RequestAuthorizationContext> authorizationManager;

    public CustomAccessDeniedHandler(AuthorizationManager<RequestAuthorizationContext> authorizationManager) {
        this.authorizationManager = authorizationManager;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {

        if (accessDeniedException instanceof OPAAccessDeniedException) {
            System.out.println("ZZZZZZZZZZZZZZZ OPA type");
        } else {
            System.out.println("ZZZZZZZZZZZZZZZ Spring type");
            System.out.println(accessDeniedException.getCause());
        }

        RequestAuthorizationContext context = new RequestAuthorizationContext(request);
        Supplier<Authentication> auth = () -> SecurityContextHolder.getContext().getAuthentication();

        AuthorizationDecision dec = this.authorizationManager.check(auth, context);

        //response.setContentType("application/json;charset=UTF-8");
        //response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        Map<String, Object> responseBody = new HashMap<>();
        //responseBody.put("timestamp", System.currentTimeMillis());
        responseBody.put("status", 403);
        responseBody.put("error", "Forbidden");
        responseBody.put("reason", accessDeniedException.getMessage());
        responseBody.put("dec", dec);
        //responseBody.put("path", request.getRequestURI());
        //

        System.out.println("XXXXXXXXXXXXXXXXXX custom handler called!");

        ObjectMapper mapper = new ObjectMapper();

        response.getWriter().write(mapper.writeValueAsString(responseBody));
    }
}
