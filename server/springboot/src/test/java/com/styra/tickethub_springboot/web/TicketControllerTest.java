package com.styra.tickethub_springboot.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.styra.tickethub_springboot.dao.model.Ticket;
import com.styra.tickethub_springboot.dao.model.Customer;
import com.styra.tickethub_springboot.dao.model.Tenant;
import com.styra.tickethub_springboot.dao.model.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@WebMvcTest(TicketController.class)
public class TicketControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private TicketRepository ticketRepository;

  @Autowired
  private ObjectMapper objectMapper;

  @BeforeEach
  public void setUp() {
    MockitoAnnotations.openMocks(this);
  }

  @Test
  public void testGetAllTickets() throws Exception {
    when(ticketRepository.findAll()).thenReturn(Arrays.asList(new Ticket(), new Ticket()));

    mockMvc.perform(MockMvcRequestBuilders.get("/tickets")
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.length()").value(2));
  }

  @Test
  public void testGetTicketById() throws Exception {
    Ticket ticket = new Ticket();
    ticket.setId(1);
    when(ticketRepository.findById(1)).thenReturn(Optional.of(ticket));

    mockMvc.perform(MockMvcRequestBuilders.get("/tickets/1")
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1));
  }

  @Test
  public void testGetTicketById_NotFound() throws Exception {
    when(ticketRepository.findById(anyInt())).thenReturn(Optional.empty());

    mockMvc.perform(MockMvcRequestBuilders.get("/tickets/1")
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isNotFound());
  }

  @Test
  public void testCreateNewTicket() throws Exception {
    Tenant newTenant = new Tenant(42, "testtenant");
    Customer newCustomer = new Customer(42, newTenant, "testcustomer");
    Ticket newTicket = new Ticket(17, newTenant, newCustomer, "testdescription", false, null);

    when(ticketRepository.save(any(Ticket.class))).thenReturn(newTicket);

    mockMvc.perform(MockMvcRequestBuilders.post("/tickets")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(newTicket)))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.customer").value("testcustomer"))
        .andExpect(MockMvcResultMatchers.jsonPath("$.description").value("testdescription"))
        .andExpect(MockMvcResultMatchers.jsonPath("$.tenant").value("testtenant"));
  }

  @Test
  public void testUpdateOrCreateTicket() throws Exception {
    Tenant newTenant = new Tenant(42, "testtenant");
    Customer newCustomer = new Customer(42, newTenant, "testcustomer");
    Ticket newTicket = new Ticket();
    newTicket.setId(1);
    newTicket.setCustomer(newCustomer);

    when(ticketRepository.findById(1)).thenReturn(Optional.of(new Ticket()));
    when(ticketRepository.save(any(Ticket.class))).thenReturn(newTicket);

    mockMvc.perform(MockMvcRequestBuilders.put("/tickets/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(newTicket)))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.customer").value("testcustomer"));
  }

  @Test
  public void testDeleteTicket() throws Exception {
    mockMvc.perform(MockMvcRequestBuilders.delete("/tickets/1"))
        .andExpect(MockMvcResultMatchers.status().isOk());
  }
}
