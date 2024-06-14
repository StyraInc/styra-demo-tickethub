package com.styra.tickethub_springboot.dao.model;

import java.util.Random;

import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.slf4j.MDC;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestWrapper;

import com.styra.opa.OPAClient;

import java.util.Map;
import static java.util.Map.entry;

import java.util.List;
import java.util.Optional;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize
                .anyRequest().access(customAuthManager()));

        return http.build();
    }

    private Tenant tenantFromHeader(String authHeader) {
        var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
        String tenantName;
        if (components.length != 3) {
            return null;
        }
        tenantName = components[1].trim();
        Optional<Tenant> tenantBox = tenantRepository.findByName(tenantName);
        if (!tenantBox.isPresent()) {
            return null;
        }
        return tenantBox.get();
    }

    private String userFromHeader(String authHeader) {
        var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
        String user;
        if (components.length != 3) {
            return null;
        }
        user = components[2].trim();
        return user;
    }

    private Map<String, Object> opaInputFromRequest(String user, String tenant, HttpServletRequest request) {
        // This method handles mapping the information we extracted from
        // the authorization header into a suitable input for the OPA policy
        // (user, tenant, action).
        //
        // In a production setting, there would be an extra step to map the
        // bearer token to some kind of user account rather than just pulling
        // the user string right from the "token". 

        String method = request.getMethod();
        String servletPath = request.getServletPath();

        System.out.printf("DEBUG: servletPath is %s\n", servletPath);
        System.out.printf("DEBUG: url is %s\n", request.getRequestURL());
        System.out.printf("DEBUG: 'method is %s\n", method);
        System.out.printf("DEBUG: '%s' matches /^/tickets/[0-9]+$/: %s\n", servletPath, servletPath.matches("^/tickets/[0-9]+$"));
        System.out.printf("DEBUG: '%s' matches /^/tickets/[0-9]+/resolve$/: %s\n", servletPath, servletPath.matches("^/tickets/[0-9]+/resolve$"));
        System.out.printf("DEBUG: '%s' == '/tickets': %s\n", servletPath, servletPath.equals("/tickets"));

        String action = "";

        if (method.equals("GET") && servletPath.equals("/tickets")) {
            action = "list";
        } else if (method.equals("GET") && servletPath.matches("^/tickets/[0-9]+$")) {
            action = "get";
        } else if (method.equals("POST") && servletPath.equals("/tickets")) {
            action = "create";
        } else if (method.equals("PUT") && servletPath.matches("^/tickets/[0-9]+$")) {
            action = "overwrite";
        } else if (method.equals("POST") && servletPath.matches("^/tickets/[0-9]+/resolve$")) {
            action = "resolve";
        }

        java.util.Map<String, Object> iMap = java.util.Map.ofEntries(
            entry("user", user),
            entry("tenant", tenant),
            entry("action", action)
        );

        return iMap;
    }

    @Bean
    AuthorizationManager<RequestAuthorizationContext> customAuthManager() {
        return (authentication, object) -> {
            System.out.printf("DEBUG: getting auth decision, authn='%s' object='%s'\n", authentication, object.toString());
            System.out.printf("DEBUG: request for auth: '%s'\n", object.getRequest());

            HttpServletRequest request = object.getRequest();
            String authHeader = request.getHeader("authorization");
            System.out.printf("DEBUG: authorization header: %s\n", authHeader);

            //boolean nextBoolean = new Random().nextBoolean();
            //System.out.println("nextBoolean=" + nextBoolean);
            //return new AuthorizationDecision(nextBoolean);

            // TODO: opa client object should be re-used
            String opaURL = "http://localhost:8181";
            String opaURLEnv = System.getenv("OPA_URL");
            if (opaURLEnv != null) {
                opaURL = opaURLEnv;
            }
            System.out.printf("DEBUG: using OPA URL: %s\n", opaURL);

            OPAClient opa = new OPAClient(opaURL);

            Tenant tenant = tenantFromHeader(authHeader);

            String user = userFromHeader(authHeader);

            java.util.Map<String, Object> iMap = opaInputFromRequest(user, tenant.getName(), request);

            System.out.printf("DEBUG: OPA input is: %s\n", iMap);

            boolean allow;

            try {
                allow = opa.check("tickets/allow", iMap);
            } catch (Exception e) {
                System.out.printf("DEBUG: exception while obtaining policy decision: %s\n", e);
                return new AuthorizationDecision(false);
            }

            System.out.printf("policy decision was: %s\n", allow);

            return new AuthorizationDecision(allow);
        };
    }


}
