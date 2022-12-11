package com.styra.tickethub;

import com.styra.tickethub.Storage.Ticket;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.glassfish.jersey.servlet.ServletContainer;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/")
public class TicketHub {
    private static final Storage storage = Storage.create();

    private @Context
    HttpServletRequest request;

    @GET
    @Path("/tickets")
    @Produces({MediaType.APPLICATION_JSON})
    public Tickets getTickets() {
        return new Tickets(storage.getTickets(getTenant()));
    }

    @GET
    @Path("/tickets/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket getTicket(@PathParam("id") int id) {
        var tickets = storage.getTickets(getTenant());
        var ticket = tickets.get(id);
        if (ticket == null) {
            throw new NotFoundException();
        }
        return ticket;
    }

    @POST
    @Path("/tickets")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket addTicket(Ticket ticket) {
        return storage.addTicket(getTenant(), ticket);
    }

    @POST
    @Path("/tickets/{id}/resolve")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket resolveTicket(@PathParam("id") int id, TicketStatus status) {
        var tickets = storage.getTickets(getTenant());
        var ticket = tickets.get(id);
        if (ticket == null) {
            throw new NotFoundException();
        }
        ticket.setResolved(status.resolved);
        return ticket;
    }

    private String getTenant() {
        return getSessionAttributes().get("tenant");
    }

    private String getSubject() {
        return getSessionAttributes().get("subject");
    }

    Map<String, String> getSessionAttributes() {
        var cookies = request.getCookies();
        return Arrays.stream(cookies != null ? cookies : new Cookie[]{})
                .filter(cookie -> "user".equals(cookie.getName()))
                .findAny()
                .map(cookie -> {
                    var components = cookie.getValue().split("\\s*/\\s*", 2);
                    Map<String, String> map = new HashMap<>();
                    if (components.length > 0) {
                        map.put("tenant", components[0].trim());
                    }
                    if (components.length > 1) {
                        map.put("subject", components[1].trim());
                    }
                    return map;
                }).orElse(Map.of());
    }

    public static void main(String... args) throws Exception {
        var port = Integer.parseInt(System.getProperty("SERVER_PORT", "4000"));
        var server = new Server(port);
        var root = new ServletContextHandler();
        server.setHandler(root);

        var apiHolder = root.addServlet(ServletContainer.class, "/api/*");
        apiHolder.setInitOrder(0);
        apiHolder.setInitParameter("jersey.config.server.provider.packages", TicketHub.class.getPackageName());

        server.start();
        server.join();
    }

    private record TicketStatus(boolean resolved) {
    }

    private record Tickets(List<Ticket> tickets) {
    }
}
