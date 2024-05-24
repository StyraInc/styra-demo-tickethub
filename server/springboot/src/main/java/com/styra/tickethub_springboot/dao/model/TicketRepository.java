package com.styra.tickethub_springboot.dao.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByTenant(String tenant);
    List<Ticket> findByTenantAndId(String tenant, Long id);
}
