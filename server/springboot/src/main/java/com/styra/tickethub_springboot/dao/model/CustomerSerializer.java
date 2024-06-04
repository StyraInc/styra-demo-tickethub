package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;

public class CustomerSerializer extends StdSerializer<Customer> {

    protected CustomerSerializer(Class<Customer> t) {
        super(t);
    }

    public CustomerSerializer(){
        this(null);
    }

    @Override
    public void serialize(Customer tenant, JsonGenerator gen, SerializerProvider provider) throws IOException {
        gen.writeString(tenant.getName());
    }
}
