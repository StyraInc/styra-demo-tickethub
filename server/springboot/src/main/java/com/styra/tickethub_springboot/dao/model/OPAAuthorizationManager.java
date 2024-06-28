package com.styra.tickethub_springboot.dao.model;

import org.springframework.security.core.GrantedAuthority;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import com.styra.opa.OPAClient;

import java.util.function.Supplier;
import java.util.Map;
import java.util.HashMap;
import java.util.Collection;
import java.util.Enumeration;

import static java.util.Map.entry;

public class OPAAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private OPAClient opa;

    private static final String SubjectType = "java_authentication";
    private static final String RequestResourceType = "endpoint";
    private static final String RequestContextType = "http";

    public OPAAuthorizationManager(OPAClient opa) {
        this.opa = opa;
    }

    private Map<String, Object> makeRequestInput(Supplier<Authentication> authentication, RequestAuthorizationContext object) {
        Object subjectId = authentication.get().getPrincipal();
        Object subjectDetails = authentication.get().getDetails();
        Collection<? extends GrantedAuthority> subjectAuthorities = authentication.get().getAuthorities();

        HttpServletRequest request = object.getRequest();
        String resourceId = request.getServletPath();

        String actionName = request.getMethod();
        String actionProtocol = request.getProtocol();
        Enumeration<String> headerNamesEnumeration = request.getHeaderNames();
        HashMap<String, String> headers = new HashMap();
        while (headerNamesEnumeration.hasMoreElements()) {
            String headerName = headerNamesEnumeration.nextElement();
            String headerValue = request.getHeader(headerName);
            if (headerValue == null) {
                continue;
            }
            headers.put(headerName, headerValue);
        }

        String contextRemoteAddr = request.getRemoteAddr();
        String contextRemoteHost = request.getRemoteHost();
        Integer contextRemotePort = request.getRemotePort();

        java.util.Map<String, Object> iMap = java.util.Map.ofEntries(
            entry("subject", java.util.Map.ofEntries(
                entry("type", SubjectType),
                entry("id", subjectId),
                entry("details", subjectDetails),
                entry("authorities", subjectAuthorities)
            )),
            entry("resource", java.util.Map.ofEntries(
                entry("type", RequestResourceType),
                entry("id", resourceId)
            )),
            entry("action", java.util.Map.ofEntries(
                entry("name", actionName),
                entry("protocol", actionProtocol),
                entry("headers", headers)
            )),
            entry("context", java.util.Map.ofEntries(
                entry("type", RequestContextType),
                entry("host", contextRemoteHost),
                entry("ip", contextRemoteAddr),
                entry("port", contextRemotePort)
            ))
        );

        System.out.printf("XXX iMap: %s\n", iMap);

        return iMap;
    }

    private OPAResponse opaMachinery(Supplier<Authentication> authentication, RequestAuthorizationContext object) {
        Map<String, Object> iMap = makeRequestInput(authentication, object);
        OPAResponse resp = null;
        try {
            resp = opa.evaluate("tickets/spring/main", iMap, OPAResponse.class);
        } catch (Exception e) {
            System.out.printf("ERROR: exception from OPA client: %s\n", e);
            return null;
        }
        return resp;
    }

    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext object) {
        OPAResponse resp = this.opaMachinery(authentication, object);
        if (resp == null) {
            return new AuthorizationDecision(false);
        }
        return new AuthorizationDecision(resp.getDecision());
    }

    public void verify(Supplier<Authentication> authentication, RequestAuthorizationContext object) {
        OPAResponse resp = this.opaMachinery(authentication, object);
        if (resp == null) {
            throw new AccessDeniedException("null response from policy");
        }

        boolean allow = resp.getDecision();
        String reason = "access denied by policy";
        if (resp.getContext() != null) {
            reason = resp.getContext().getReason();
        }

        if (allow) {
            return;
        }

        throw new AccessDeniedException(reason);
    }
}
