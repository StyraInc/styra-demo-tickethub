package com.styra.tickethub_springboot.dao.model;

import java.util.Random;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

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

    @Bean
    AuthorizationManager customAuthManager() {
        return (authentication, object) -> {
            boolean nextBoolean = new Random().nextBoolean();
            System.out.println("nextBoolean=" + nextBoolean);
            return new AuthorizationDecision(nextBoolean);
        };
    }

    private Tenant tenantFromHeader(String authHeader) {
        var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
        String tenantName;
        if (components.length != 3) {
            //System.out.println("ERROR: invalid auth header: " + authHeader);
            //throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header is malformed");
            return null;
        }
        tenantName = components[1].trim();
        Optional<Tenant> tenantBox = tenantRepository.findByName(tenantName);
        if (!tenantBox.isPresent()) {
            //throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header specifies nonexistant tenant");
            return null;
        }
        return tenantBox.get();
    }

    private String userFromHeader(String authHeader) {
        var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
        String user;
        if (components.length != 3) {
            //System.out.println("ERROR: invalid auth header: " + authHeader);
            //throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header is malformed");
            return null;
        }
        user = components[2].trim();
        return user;
    }

    private void verifyAuth() {
        // TODO: opa client object should be re-used
        String opaURL = "http://localhost:8181";
        String opaURLEnv = System.getenv("OPA_URL");
        if (opaURLEnv != null) {
            opaURL = opaURLEnv;
        }
        System.out.printf("DEBUG: using OPA URL: %s\n", opaURL);

        OPAClient opa = new OPAClient(opaURL);

        Optional<Tenant> tenantBox = tenantRepository.findByName(MDC.get("TENANT_NAME"));
        if (!tenantBox.isPresent()) {
            return null;
        }

        String user = MDC.get("USER_NAME");

        // TODO: figure out how to map object to OPA input??

        java.util.Map<String, Object> iMap = java.util.Map.ofEntries(
                entry("user", user),
                entry("tenant", tenant.getName()),
                entry("action", action)
                );

        System.out.printf("DEBUG: OPA input is: %s\n", iMap);

        boolean allow;

        try {
            allow = opa.check("tickets/allow", iMap);
        } catch (Exception e) {
            System.out.printf("DEBUG: exception while obtaining policy decision: %s\n", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "failed to obtain policy decision");
        }

        System.out.printf("policy decision was: %s\n", allow);

        if (!allow) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "access denined by policy");
        }
    }
}
