package com.styra.tickethub_springboot.web.errors;

public class TicketNotFoundException extends RuntimeException {

  private Integer id;

  public TicketNotFoundException(Integer id) {
    super("Could not find ticket " + id);
  }
}
