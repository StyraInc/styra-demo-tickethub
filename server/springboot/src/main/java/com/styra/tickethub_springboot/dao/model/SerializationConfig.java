package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;


@Configuration
public class SerializationConfig {

    @Bean
    public Jackson2ObjectMapperBuilder jackson2ObjectMapperBuilder() {
        Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
        SimpleModule module = new SimpleModule();
        module.addSerializer(Tenant.class, new TenantSerializer());
        module.addSerializer(Customer.class, new CustomerSerializer());
        module.addDeserializer(Customer.class, new CustomerDeserializer());
        module.addDeserializer(Tenant.class, new TenantDeserializer());
        builder.modules(module, new JavaTimeModule());
        return builder;
    }
}
