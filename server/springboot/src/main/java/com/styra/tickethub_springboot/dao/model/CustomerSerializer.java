package com.styra.tickethub_springboot.dao.model;

import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomerSerializer extends StdSerializer<Customer> {

    protected CustomerSerializer(Class<Customer> t) {
        super(t);
    }

    public CustomerSerializer(){
        this(null);
    }

    @Override
    public void serialize(Customer customer, JsonGenerator gen, SerializerProvider provider) throws IOException {
        gen.writeString(customer.getName());
    }
}
