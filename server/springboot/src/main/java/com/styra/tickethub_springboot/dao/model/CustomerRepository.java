package com.styra.tickethub_springboot.dao.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByTenant(Tenant tenant);
    Optional<Customer> findByTenantAndId(Tenant tenant, Long id);
    Optional<Customer> findByTenantAndName(Tenant tenant, String name);
}
