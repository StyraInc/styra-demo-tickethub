package com.styra.tickethub_springboot.dao.model;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Collections;

import java.util.HashMap;
import java.util.Map;

import static java.util.Map.entry;

public class CustomAuthentication implements Authentication {

    private final String tenantName;
    private final String userName;
    private boolean authenticated = true;

    public CustomAuthentication(String tenantName, String userName) {
        this.tenantName = tenantName;
        this.userName = userName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public Object getCredentials() {
        Map<String, Object> credentials = new HashMap<String, Object>();
        return credentials;
    }

    @Override
    public Object getDetails() {
        Map<String, Object> details = new HashMap<String, Object>();
        return details;
    }

    @Override
    public Object getPrincipal() {
        return userName;
    }

    @Override
    public boolean isAuthenticated() {
        return authenticated;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        this.authenticated = isAuthenticated;
    }

    @Override
    public String getName() {
        return userName;
    }

    public String getTenantName() {
        return tenantName;
    }
}
