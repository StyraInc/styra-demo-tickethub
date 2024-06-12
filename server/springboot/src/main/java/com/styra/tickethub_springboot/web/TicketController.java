package com.styra.tickethub_springboot.web;

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

  @GetMapping("/tickets")
  Map<String, List<Ticket>> all(@RequestHeader("authorization") String authHeader) {
    verifyAuth(authHeader, "list");
    return java.util.Map.ofEntries(entry("tickets", ticketRepository.findByTenant(tenantFromHeader(authHeader))));
  }

  @GetMapping("/tickets/{id}")
  Ticket getById(@RequestHeader("authorization") String authHeader, @PathVariable Integer id) {
    verifyAuth(authHeader, "get");

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
    verifyAuth(authHeader, "create");
    newTicket.setTenant(tenantFromHeader(authHeader));
    return ticketRepository.save(newTicket);
  }

  //@DeleteMapping("/tickets/{id}")
  //void delete(@RequestHeader("authorization") String authHeader, @PathVariable Integer id) {
  //  verifyAuth(authHeader, "delete");
  //  ticketRepository.deleteById(id);
  //}

  @PutMapping("/tickets/{id}")
  Ticket updateOrCreate(@RequestHeader("authorization") String authHeader, @RequestBody Ticket newTicket, @PathVariable Integer id) {
    verifyAuth(authHeader, "modify");

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
  Ticket resolve(@RequestHeader("authorization") String authHeader, @PathVariable Integer id) {
    verifyAuth(authHeader, "resolve");
    Ticket t = getById(authHeader, id);
    t.setResolved(true);
    return ticketRepository.save(t);
  }
}
