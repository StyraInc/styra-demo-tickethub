package com.styra.tickethub_springboot.dao.model;

import com.styra.opa.springboot.OPAAuthorizationManager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    OPAAuthorizationManager opaAuthorizationManager;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // NOTE: The `.csrf(...)` disables CSRF protections. This could
        // be a serious security vulnerability in a production environment.
        // However, since this API is intended for educational and development
        // purposes, it is disabled because it makes it easier to work with
        // locally. If you want to use any of this code for a production
        // service, it is important to re-enable CSRF protection.
        http.addFilterBefore(new CustomAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize.anyRequest().access(opaAuthorizationManager))
                .csrf(csrf -> csrf.disable());

        return http.build();
    }

}
