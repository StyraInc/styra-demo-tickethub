package com.styra.tickethub_springboot;

import com.styra.tickethub_springboot.dao.model.Ticket;
import com.styra.tickethub_springboot.dao.model.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.time.Instant;

@SpringBootApplication
public class App implements CommandLineRunner {

  public static void main(String[] args) {
    SpringApplication.run(App.class, args);
  }

  @Autowired
  TicketRepository ticketRepository;

  @Override
  public void run(String... args) throws Exception {
    //ticketRepository.save(new Ticket(null, "acmecorp", "Globex", "Dooms day device needs to be refactored", false, Instant.parse("2022-07-19T15:39:53.686Z")));
    //ticketRepository.save(new Ticket(null, "acmecorp", "Globex", "Flamethrower implementation is too heavyweight", true, Instant.parse("2022-07-19T15:39:40.806Z")));
    //ticketRepository.save(new Ticket(null, "acmecorp", "Sirius Cybernetics Corp.", "Latest android exhibit depression tendencies", false, Instant.parse("2022-07-19T15:42:16.526Z")));
    //ticketRepository.save(new Ticket(null, "acmecorp", "Sirius Cybernetics Corp.", "Happy Vertical People Transporters need to be more efficient in determining destination floor", false, Instant.parse("1982-08-05T03:30:03Z")));
    //ticketRepository.save(new Ticket(null, "acmecorp", "Cyberdyne Systems Corp.", "Mimetic polyalloy becomes brittle at low temperatures", false, Instant.parse("2022-07-19T15:42:51.297Z")));
    //ticketRepository.save(new Ticket(null, "acmecorp", "Cyberdyne Systems Corp.", "Temporal dislocation field reacts with exposed metal", true, Instant.parse("2029-03-04T00:00:00Z")));
    //ticketRepository.save(new Ticket(null, "hooli", "Soylent Corp.", "Final ingredient for project 'Green' still undecided", false, Instant.parse("2022-03-04T00:00:00Z")));
    //ticketRepository.save(new Ticket(null, "hooli", "Soylent Corp.", "Customer service center switch board DDoS:ed by (opinionated) ingredient declaration inquiries", true, Instant.parse("2022-04-05T00:00:00Z")));
    //ticketRepository.save(new Ticket(null, "hooli", "Tyrell Corp.", "Replicants become too independent over time", false, Instant.parse("2019-03-04T00:03:20Z")));
    //ticketRepository.save(new Ticket(null, "hooli", "Tyrell Corp.", "Detective Rick Deckard's billing address is unknown", false, Instant.parse("2048-11-22T14:13:42Z")));
    //
  }
}
