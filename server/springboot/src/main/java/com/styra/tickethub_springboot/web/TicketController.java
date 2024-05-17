package com.styra.tickethub_springboot.web;

import com.styra.tickethub_springboot.dao.model.Ticket;
import com.styra.tickethub_springboot.dao.model.TicketRepository;
import com.styra.tickethub_springboot.web.errors.TicketNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// This code was initially based on this guide
// https://howtodoinjava.com/spring-boot/spring-boot-rest-api-example/
//
// The code examples initially used were retrieved from here:
// https://github.com/lokeshgupta1981/Spring-Boot3-Demos/tree/main/rest-api-crud-example

@RestController
public class TicketController {

  @Autowired
  TicketRepository ticketRepository;

  @GetMapping("/tickets")
  List<Ticket> all() {
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
