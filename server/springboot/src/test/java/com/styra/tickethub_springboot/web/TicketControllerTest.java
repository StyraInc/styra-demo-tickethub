package com.styra.tickethub_springboot.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.styra.tickethub_springboot.dao.model.Ticket;
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
    ticket.setId(1L);
    when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

    mockMvc.perform(MockMvcRequestBuilders.get("/tickets/1")
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1));
  }

  @Test
  public void testGetTicketById_NotFound() throws Exception {
    when(ticketRepository.findById(anyLong())).thenReturn(Optional.empty());

    mockMvc.perform(MockMvcRequestBuilders.get("/tickets/1")
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(MockMvcResultMatchers.status().isNotFound());
  }

  @Test
  public void testCreateNewTicket() throws Exception {
    Ticket newTicket = new Ticket(17L, "testtenant", "testcustomer", "testdescription", false, null);

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
    Ticket newTicket = new Ticket();
    newTicket.setId(1L);
    newTicket.setCustomer("updated customer");

    when(ticketRepository.findById(1L)).thenReturn(Optional.of(new Ticket()));
    when(ticketRepository.save(any(Ticket.class))).thenReturn(newTicket);

    mockMvc.perform(MockMvcRequestBuilders.put("/tickets/1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(newTicket)))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andExpect(MockMvcResultMatchers.jsonPath("$.customer").value("updated customer"));
  }

  @Test
  public void testDeleteTicket() throws Exception {
    mockMvc.perform(MockMvcRequestBuilders.delete("/tickets/1"))
        .andExpect(MockMvcResultMatchers.status().isOk());
  }
}
