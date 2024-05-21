package com.styra.tickethub_springboot.web;

import com.styra.tickethub_springboot.dao.model.Ticket;
import com.styra.tickethub_springboot.dao.model.TicketRepository;
import com.styra.tickethub_springboot.web.errors.TicketNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.styra.opa.OPAClient;

import java.util.Map;
import static java.util.Map.entry;

import java.util.List;

// This code was initially based on this guide
// https://howtodoinjava.com/spring-boot/spring-boot-rest-api-example/
//
// The code examples initially used were retrieved from here:
// https://github.com/lokeshgupta1981/Spring-Boot3-Demos/tree/main/rest-api-crud-example

@RestController
public class TicketController {

  private boolean doAuth(String authHeader, String action) {
      // TODO: opa client object should be re-used
      String opaURL = "http://localhost:8181";
      String opaURLEnv = System.getenv("OPA_URL");
      if (opaURLEnv != null) {
          opaURL = opaURLEnv;
      }
      System.out.printf("DEBUG: using OPA URL: %s\n", opaURL);

      OPAClient opa = new OPAClient(opaURL);

      var components = authHeader.split("\\s*[\\s+/]\\s*", 3);
      String tenant;
      String user;

      System.out.printf("DEBUG: components %s\n", components);

      if (components.length != 3) {
        System.out.println("ERROR: invalid auth header: " + authHeader);
        return false;
      }
      tenant = components[1].trim();
      user = components[2].trim();

      java.util.Map<String, Object> iMap = java.util.Map.ofEntries(
          entry("user", user),
          entry("tenant", tenant),
          entry("action", action)
          );

      System.out.printf("DEBUG: OPA input is: %s\n", iMap);

      boolean allow;

      try {
        allow = opa.check("tickets/allow", iMap);
      } catch (Exception e) {
        System.out.printf("ERROR: request threw exception: %s\n", e);
        return false;
      }

      return allow;
  }

  @Autowired
  TicketRepository ticketRepository;

  @GetMapping("/tickets")
  List<Ticket> all(@RequestHeader("authorization") String authHeader) {
    doAuth(authHeader, "list");
    return ticketRepository.findAll();
  }

  @GetMapping("/tickets/{id}")
  Ticket getById(@PathVariable Long id) {

    return ticketRepository.findById(id)
        .orElseThrow(() -> new TicketNotFoundException(id));
  }

  @PostMapping("/tickets")
  Ticket createNew(@Valid @RequestBody Ticket newTicket) {
    return ticketRepository.save(newTicket);
  }

  @DeleteMapping("/tickets/{id}")
  void delete(@PathVariable Long id) {
    ticketRepository.deleteById(id);
  }

  @PutMapping("/tickets/{id}")
  Ticket updateOrCreate(@RequestBody Ticket newTicket, @PathVariable Long id) {

    return ticketRepository.findById(id)
        .map(ticket -> {
          ticket.setCustomer(newTicket.getCustomer());
          ticket.setDescription(newTicket.getDescription());
          ticket.setResolved(newTicket.getResolved());
          return ticketRepository.save(ticket);
        })
        .orElseGet(() -> {
          newTicket.setId(id);
          return ticketRepository.save(newTicket);
        });
  }

  @PostMapping("/tickets/{id}/resolve")
  void resolve(@PathVariable Long id) {
    Ticket t = getById(id);
    t.setResolved(true);
  }
}
