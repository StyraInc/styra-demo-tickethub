package com.styra.tickethub_springboot.web.errors;

public class TicketNotFoundException extends RuntimeException {

  private Long id;

  public TicketNotFoundException(Long id) {
    super("Could not find ticket " + id);
  }
}
