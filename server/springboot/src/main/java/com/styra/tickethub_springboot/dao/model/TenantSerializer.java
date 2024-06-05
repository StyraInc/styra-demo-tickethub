package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class TenantSerializer extends StdSerializer<Tenant> {

    protected TenantSerializer(Class<Tenant> t) {
        super(t);
    }

    public TenantSerializer(){
        this(null);
    }

    @Override
    public void serialize(Tenant tenant, JsonGenerator gen, SerializerProvider provider) throws IOException {
        gen.writeString(tenant.getName());
    }
}
