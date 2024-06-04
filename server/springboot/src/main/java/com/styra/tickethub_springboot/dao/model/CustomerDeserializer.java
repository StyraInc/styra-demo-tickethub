package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.Optional;

@Component
public class CustomerDeserializer extends StdDeserializer<Customer> {

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    TenantRepository tenantRepository;

    public CustomerDeserializer() {
        this(null);
    }

    public CustomerDeserializer(Class<?> vc) {
        super(vc);
    }

    @Override
    public Customer deserialize(JsonParser jp, DeserializationContext ctxt)
            throws IOException, JsonProcessingException {
        String name = jp.getText();
        Optional<Tenant> tenantBox = tenantRepository.findByName(MDC.get("TENANT_NAME"));
        if (!tenantBox.isPresent()) {
            return null;
        }
        Optional<Customer> customerBox  = customerRepository.findByTenantAndName(tenantBox.get(), name);
        if (!customerBox.isPresent()) {
            return null;
        }
        return customerBox.get();
    }
}
