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
import com.styra.opa.springboot.OPAResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private AuthorizationManager<RequestAuthorizationContext> authorizationManager;

    /**
     * This method is used to set the authorization manager, it must be called
     * before the first time the handler is used. Normally, you would want to
     * do this with the constructor, but that runs afoul of some esoteric java
     * bean runtime issue, possibly because this class is declared with
     * @component.
     *
     * @param authorizationManager
     * @return
     */
    public void setManager(AuthorizationManager<RequestAuthorizationContext> authorizationManager) {
        this.authorizationManager = authorizationManager;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {

        //  Reconstruct the decision that would have lead to this decision.
        RequestAuthorizationContext context = new RequestAuthorizationContext(request);
        Supplier<Authentication> auth = () -> SecurityContextHolder.getContext().getAuthentication();
        AuthorizationDecision dec = this.authorizationManager.check(auth, context);

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("status", 403);
        responseBody.put("error", "Forbidden");

        if (dec instanceof OPAAuthorizationDecision) {
            OPAResponse opaResp = ((OPAAuthorizationDecision) dec).getOPAResponse();
            String reason = opaResp.getReasonForDecision("en");
            if (reason  != null) {
                responseBody.put("reason", reason);
            }
        } 

        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(responseBody));
    }
}
