package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class TenantDeserializer extends StdDeserializer<Tenant> {

    @Autowired
    TenantRepository tenantRepository;

    public TenantDeserializer() {
        this(null);
    }

    public TenantDeserializer(Class<?> vc) {
        super(vc);
    }

    @Override
    public Tenant deserialize(JsonParser jp, DeserializationContext ctxt)
            throws IOException, JsonProcessingException {
        String name = jp.getText();
        Optional<Tenant> tenantBox = tenantRepository.findByName(name);
        if (!tenantBox.isPresent()) {
            return null;
        }
        return tenantBox.get();
    }
}
