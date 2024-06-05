package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
public class SerializationConfig {

    // These need to be autowired here because some of the deserializers need
    // access to repositories inside of them, and those repositories won't be
    // autowired by Spring Boot if the classes are manually instantiated.
    //
    // See also: https://amydegregorio.com/2020/10/04/why-is-my-autowired-component-null/

    @Autowired
    TenantSerializer tenantSerializer;

    @Autowired
    TenantDeserializer tenantDeserializer;

    @Autowired
    CustomerSerializer customerSerializer;

    @Autowired
    CustomerDeserializer customerDeserializer;

    @Bean
    public Jackson2ObjectMapperBuilder jackson2ObjectMapperBuilder() {
        Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
        SimpleModule module = new SimpleModule();
        module.addSerializer(Tenant.class, tenantSerializer);
        module.addSerializer(Customer.class, customerSerializer);
        module.addDeserializer(Tenant.class, tenantDeserializer);
        module.addDeserializer(Customer.class, customerDeserializer);
        builder.modules(module, new JavaTimeModule());
        return builder;
    }
}
