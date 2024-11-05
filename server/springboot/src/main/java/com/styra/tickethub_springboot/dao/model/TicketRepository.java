package com.styra.tickethub_springboot.dao.model;

import com.styra.tickethub_springboot.App;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryRewriter;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository
    extends JpaRepository<Ticket, Integer>, QueryRewriter {
    @Query(
        value = "SELECT t.id, t.customer, t.description, t.last_updated, t.resolved, t.tenant FROM \"Tickets\" t LEFT JOIN \"Tenants\" t1 ON t1.id=t.tenant WHERE t1.name=:#{#tenant.name}",
        nativeQuery = true,
        queryRewriter = TicketRepository.class
    )
    List<Ticket> findByTenant(@Param("tenant") Tenant tenant);

    List<Ticket> findByTenantAndId(Tenant tenant, Integer id);

    @Override
    default String rewrite(String query, Sort sort) {
        // Omitted:
        // 1. get conditions from OPA, after feeding it query and user information
        // 2. convert conditions to SQL WHERE clause
        //
        // SQL logging uncovered **a lot** of queries happening for "list tickets".
        // I'd assume that they're done automatically by Spring Data JPA, to ensure
        // relationships etc; but it also means they are under the radar of this rewriter.
        // However, I'd envision that there's one rewriter that would be used with all
        // the repositories, so maybe we would end up covering call queries after all.
        String rewritten = query + " AND t.resolved = false"; // leading space is crucial
        Logger logger = LoggerFactory.getLogger(App.class);
        logger.info("rewritten: " + rewritten);
        return rewritten;
    }
}
