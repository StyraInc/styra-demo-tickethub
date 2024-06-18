package com.styra.tickethub_springboot.web;

import com.styra.tickethub_springboot.dao.model.ResolveState;
import com.styra.tickethub_springboot.dao.model.Ticket;
import com.styra.tickethub_springboot.dao.model.Tenant;
import com.styra.tickethub_springboot.dao.model.TicketRepository;
import com.styra.tickethub_springboot.dao.model.TenantRepository;
import com.styra.tickethub_springboot.dao.model.CustomerRepository;
import com.styra.tickethub_springboot.web.errors.TicketNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.styra.opa.OPAClient;

import java.util.Map;
import static java.util.Map.entry;

import java.util.List;
import java.util.Optional;

// This code was initially based on this guide
// https://howtodoinjava.com/spring-boot/spring-boot-rest-api-example/
//
// The code examples initially used were retrieved from here:
// https://github.com/lokeshgupta1981/Spring-Boot3-Demos/tree/main/rest-api-crud-example

@RestController
public class TicketController {

  @Autowired
  TicketRepository ticketRepository;

  @Autowired
  TenantRepository tenantRepository;

  @Autowired
  CustomerRepository customerRepository;

  // It would be nice to somehow unify the MDC version of the user and tenant
  // that are extracted earlier on and the @RequestHeader logic in this file.
  // Maybe the solution is to just use the MDC versions everywhere?

  private Tenant tenantFromHeader(String authHeader) {
      var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
      String tenantName;
      if (components.length != 3) {
          System.out.println("ERROR: invalid auth header: " + authHeader);
          throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header is malformed");
      }
      tenantName = components[1].trim();
      Optional<Tenant> tenantBox = tenantRepository.findByName(tenantName);
      if (!tenantBox.isPresent()) {
          throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header specifies nonexistant tenant");
      }
      return tenantBox.get();
  }

  private String userFromHeader(String authHeader) {
      var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
      String user;
      if (components.length != 3) {
          System.out.println("ERROR: invalid auth header: " + authHeader);
          throw new ResponseStatusException(HttpStatus.FORBIDDEN, "auth header is malformed");
      }
      user = components[2].trim();
      return user;
  }

  @GetMapping("/tickets")
  Map<String, List<Ticket>> all(@RequestHeader("authorization") String authHeader) {
      return java.util.Map.ofEntries(entry("tickets", ticketRepository.findByTenant(tenantFromHeader(authHeader))));
  }

  @GetMapping("/tickets/{id}")
  Ticket getById(@RequestHeader("authorization") String authHeader, @PathVariable Integer id) {
    List<Ticket> matches = ticketRepository.findByTenantAndId(tenantFromHeader(authHeader), id);

    if (matches.size() == 0) {
        throw new TicketNotFoundException(id);
    } else if (matches.size() == 1) {
        return matches.get(0);
    } else {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "multiple matches to ticket lookup by ID, this code should be unreachable");
    }
  }

  @PostMapping("/tickets")
  Ticket createNew(@RequestHeader("authorization") String authHeader, @Valid @RequestBody Ticket newTicket) {
    newTicket.setTenant(tenantFromHeader(authHeader));
    return ticketRepository.save(newTicket);
  }

  @PutMapping("/tickets/{id}")
  Ticket updateOrCreate(@RequestHeader("authorization") String authHeader, @RequestBody Ticket newTicket, @PathVariable Integer id) {
    try {
      Ticket t = getById(authHeader, id);
      t.setCustomer(newTicket.getCustomer());
      t.setDescription(newTicket.getDescription());
      t.setResolved(newTicket.getResolved());
      t.setTenant(newTicket.getTenant());
      return ticketRepository.save(t);

    } catch (TicketNotFoundException e) {
      newTicket.setId(id);
      newTicket.setTenant(tenantFromHeader(authHeader));
      return ticketRepository.save(newTicket);

    }
  }

  @PostMapping("/tickets/{id}/resolve")
  Ticket resolve(@RequestHeader("authorization") String authHeader, @RequestBody ResolveState targetState, @PathVariable Integer id) {
    Ticket t = getById(authHeader, id);
    t.setResolved(targetState.getResolved());
    return ticketRepository.save(t);
  }
}
