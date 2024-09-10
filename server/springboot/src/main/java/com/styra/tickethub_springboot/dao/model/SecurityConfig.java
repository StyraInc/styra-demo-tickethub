package com.styra.tickethub_springboot.dao.model;

import java.util.Random;

import com.styra.opa.springboot.OPAAuthorizationManager;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
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

        String opaURL = "http://localhost:8181";
        String opaURLEnv = System.getenv("OPA_URL");
        if (opaURLEnv != null) {
            opaURL = opaURLEnv;
        }
        OPAClient opa = new OPAClient(opaURL);

        AuthorizationManager<RequestAuthorizationContext> am = new OPAAuthorizationManager(opa, "tickets/spring/main");

        // NOTE: The `.csrf(...)` disables CSRF protections. This could
        // be a serious security vulnerability in a production environment.
        // However, since this API is intended for educational and development
        // purposes, it is disabled because it makes it easier to work with
        // locally. If you want to use any of this code for a production
        // service, it is important to re-enable CSRF protection.
        //http.authorizeHttpRequests(authorize -> authorize
        //        .anyRequest().access(am)).csrf(csrf -> csrf.disable());

        //http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am).and().exceptionHandling(exceptionHandling -> exceptionHandling.accessDeniedHandler(dh))).csrf(csrf -> csrf.disable());

        //http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am))
        //    .exceptionHandling(exceptionHandling -> exceptionHandling.accessDeniedHandler(dh))
        //    .csrf(csrf -> csrf.disable());

        //http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am))
        //    .csrf(csrf -> csrf.disable())
        //    .exceptionHandling()
        //    .accessDeniedHandler((request, response, accessDeniedException) -> {
        //        AccessDeniedHandler defaultAccessDeniedHandler = new CustomAccessDeniedHandler();
        //        defaultAccessDeniedHandler.handle(request, response, accessDeniedException);
        //    });

        //http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am))
        //    .csrf(csrf -> csrf.disable())
        //    .exceptionHandling().accessDeniedHandler(accessDeniedHandler());


        //http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am))
        //    .csrf(csrf -> csrf.disable()).exceptionHandling(exceptionHandling ->
        //    exceptionHandling.accessDeniedHandler(accessDeniedHandler())
        //);

        //http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am))
        //    .csrf(csrf -> csrf.disable()).accessDeniedHandler(accessDeniedHandler());
        //
        http.authorizeHttpRequests(authorize -> authorize.anyRequest().access(am))
            .csrf(csrf -> csrf.disable()).exceptionHandling().accessDeniedHandler(accessDeniedHandler());

        System.out.println("QQQQQQ");

        return http.build();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler(){
        return new CustomAccessDeniedHandler();
    }

}
