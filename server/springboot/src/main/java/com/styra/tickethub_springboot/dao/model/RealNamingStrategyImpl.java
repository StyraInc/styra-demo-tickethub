package com.styra.tickethub_springboot.dao.model;

// This is heavily based on: https://stackoverflow.com/a/39164010

import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

import java.io.Serializable;
import java.util.Locale;

public class RealNamingStrategyImpl extends PhysicalNamingStrategyStandardImpl implements Serializable {
    @Override
    public Identifier toPhysicalTableName(Identifier name, JdbcEnvironment context) {
        return new Identifier(name.getText(), true);
    }

    @Override
    public Identifier toPhysicalColumnName(Identifier name, JdbcEnvironment context) {
        return new Identifier(name.getText(), true);
    }

}
