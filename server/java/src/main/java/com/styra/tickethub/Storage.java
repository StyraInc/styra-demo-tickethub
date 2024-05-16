package com.styra.tickethub;

import com.fasterxml.jackson.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class Storage {
    @SuppressWarnings("unused")
    public static class Ticket {
        private final int id;
        private final String customer;
        private final String description;
        private boolean resolved;
        private Instant lastUpdated;

        public Ticket(int id, String customer, String description, boolean resolved, Instant lastUpdated) {
            this.id = id;
            this.customer = customer;
            this.description = description;
            this.resolved = resolved;
            this.lastUpdated = Optional.ofNullable(lastUpdated).orElse(Instant.now());
        }

        public Ticket(String customer, String description, boolean resolved, Instant lastUpdated) {
            this(-1, customer, description, resolved, lastUpdated);
        }

        @JsonCreator
        public Ticket(@JsonProperty("consumer") String customer, @JsonProperty("description") String description) {
            this(-1, customer, description, false, null);
        }

        public Ticket withId(int id) {
            return new Ticket(id, customer, this.description, this.resolved, this.lastUpdated);
        }

        public int getId() {
            return id;
        }

        public String getCustomer() {
            return customer;
        }

        public String getDescription() {
            return description;
        }

        public boolean isResolved() {
            return resolved;
        }

        public void setResolved(boolean resolved) {
            this.resolved = resolved;
            this.lastUpdated = Instant.now();
        }

        @JsonGetter("last_updated")
        public String getLastUpdated() {
            return lastUpdated.toString();
        }
    }

    private final Map<String, List<Ticket>> tenants = new ConcurrentHashMap<>();

    public List<Ticket> getTickets(String tenant) {
        return tenants.getOrDefault(tenant, Collections.emptyList());
    }

    public synchronized Ticket addTicket(String tenant, Ticket ticket) {
        var tickets = this.tenants.computeIfAbsent(tenant, (ignored) -> new Vector<>());
        var newTicket = ticket.withId(tickets.size()+1);
        tickets.add(newTicket);
        return newTicket;
    }

    public static Storage create() {
        var storage = new Storage();
        storage.addTicket("acmecorp", new Ticket("Globex", "Dooms day device needs to be refactored", false, Instant.parse("2022-07-19T15:39:53.686Z")));
        storage.addTicket("acmecorp", new Ticket("Globex", "Flamethrower implementation is too heavyweight", true, Instant.parse("2022-07-19T15:39:40.806Z")));
        storage.addTicket("acmecorp", new Ticket("Sirius Cybernetics Corp.", "Latest android exhibit depression tendencies", false, Instant.parse("2022-07-19T15:42:16.526Z")));
        storage.addTicket("acmecorp", new Ticket("Sirius Cybernetics Corp.", "Happy Vertical People Transporters need to be more efficient in determining destination floor", false, Instant.parse("1982-08-05T03:30:03Z")));
        storage.addTicket("acmecorp", new Ticket("Cyberdyne Systems Corp.", "Mimetic polyalloy becomes brittle at low temperatures", false, Instant.parse("2022-07-19T15:42:51.297Z")));
        storage.addTicket("acmecorp", new Ticket("Cyberdyne Systems Corp.", "Temporal dislocation field reacts with exposed metal", true, Instant.parse("2029-03-04T00:00:00Z")));

        storage.addTicket("hooli", new Ticket("Soylent Corp.", "Final ingredient for project 'Green' still undecided", false, Instant.parse("2022-03-04T00:00:00Z")));
        storage.addTicket("hooli", new Ticket("Soylent Corp.", "Customer service center switch board DDoS:ed by (opinionated) ingredient declaration inquiries", true, Instant.parse("2022-04-05T00:00:00Z")));
        storage.addTicket("hooli", new Ticket("Tyrell Corp.", "Replicants become too independent over time", false, Instant.parse("2019-03-04T00:03:20Z")));
        storage.addTicket("hooli", new Ticket("Tyrell Corp.", "Detective Rick Deckard's billing address is unknown", false, Instant.parse("2048-11-22T14:13:42Z")));
        return storage;
    }
}
