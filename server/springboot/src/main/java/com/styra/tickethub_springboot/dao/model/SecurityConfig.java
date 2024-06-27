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
import java.util.logging.Logger;
import static java.util.logging.Level.ALL;
import java.util.logging.ConsoleHandler;
import java.util.logging.Handler;

import com.styra.opa.openapi.OpaApiClient;
import com.styra.opa.openapi.utils.HTTPClient;

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
        // NOTE: The `.csrf(...)` disables CSRF protections. This could
        // be a serious security vulnerability in a production environment.
        // However, since this API is intended for educational and development
        // purposes, it is disabled because it makes it easier to work with
        // locally. If you want to use any of this code for a production
        // service, it is important to re-enable CSRF protection.
        http.authorizeHttpRequests(authorize -> authorize
                .anyRequest().access(customAuthManager())).csrf(csrf -> csrf.disable());

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
            HttpServletRequest request = object.getRequest();
            // NOTE: it is possible that authHeader could be null. In this
            // case, the server will throw a null pointer exception, and Spring
            // will bounce the request. This is the "correct" behavior in the
            // sense that it prevents access to any endpoints if the auth
            // header is missing, but in a production setting, this case should
            // be handled a little more gracefully.
            String authHeader = request.getHeader("authorization");

            // TODO: opa client object should be re-used
            String opaURL = "http://localhost:8181";
            String opaURLEnv = System.getenv("OPA_URL");
            if (opaURLEnv != null) {
                opaURL = opaURLEnv;
            }

            //OPAClient opa = new OPAClient(opaURL);

            Logger logger = Logger.getLogger("mylogger");
            Handler handlerObj = new ConsoleHandler();
            handlerObj.setLevel(ALL);
            logger.addHandler(handlerObj);
            logger.setLevel(ALL);
            logger.setUseParentHandlers(false);

            HTTPClient client = new LatencyMeasuringHTTPClient(logger);
            OpaApiClient apiClient = OpaApiClient.builder().serverURL(opaURL).client(client).build();
            OPAClient opa = new OPAClient(apiClient);

            Tenant tenant = tenantFromHeader(authHeader);

            String user = userFromHeader(authHeader);

            java.util.Map<String, Object> iMap = opaInputFromRequest(user, tenant.getName(), request);

            boolean allow;

            try {
                allow = opa.check("tickets/allow", iMap);
            } catch (Exception e) {
                System.out.printf("ERROR: got exception from opa client: %s\n", e);
                return new AuthorizationDecision(false);
            }

            return new AuthorizationDecision(allow);
        };
    }


}
