package com.styra.tickethub;

import com.styra.run.Input;
import com.styra.run.StyraRun;
import com.styra.run.servlet.ProxyServlet;
import com.styra.run.servlet.rbac.RbacServletHelper;
import com.styra.run.servlet.session.TenantSessionManager;
import com.styra.tickethub.Storage.Ticket;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAllowedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.glassfish.jersey.servlet.ServletContainer;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/")
public class TicketHub {
    private record TicketStatus(boolean resolved) {
    }

    private record Tickets(List<Ticket> tickets) {
    }

    private static final Storage storage = Storage.create();
    private static final StyraRun styraRun = StyraRun.builder(
                    System.getenv("STYRA_URL"),
                    System.getenv("STYRA_TOKEN"))
            .build();
    private static final TenantSessionManager sessionManager = new TenantSessionManager(TicketHub::getSessionAttributes);

    private @Context
    HttpServletRequest request;

    @GET
    @Path("/tickets")
    @Produces({MediaType.APPLICATION_JSON})
    public Tickets getTickets() {
        var allowed = styraRun.check("/tickets/read/allow", new Input<>(getSessionAttributes())).join();
        if (!allowed) {
            throw new NotAllowedException("Not authorized");
        }
        return new Tickets(storage.getTickets(getTenant()));
    }

    @GET
    @Path("/tickets/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket getTicket(@PathParam("id") int id) {
        var allowed = styraRun.check("/tickets/read/allow", new Input<>(getSessionAttributes())).join();
        if (!allowed) {
            throw new NotAllowedException("Not authorized");
        }
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
        var allowed = styraRun.check("/tickets/create/allow", new Input<>(getSessionAttributes())).join();
        if (!allowed) {
            throw new NotAllowedException("Not authorized");
        }
        return storage.addTicket(getTenant(), ticket);
    }

    @POST
    @Path("/tickets/{id}/resolve")
    @Produces(MediaType.APPLICATION_JSON)
    public void resolveTicket(@PathParam("id") int id, TicketStatus status) {
        var allowed = styraRun.check("/tickets/resolve/allow", new Input<>(getSessionAttributes())).join();
        if (!allowed) {
            throw new NotAllowedException("Not authorized");
        }
        var tickets = storage.getTickets(getTenant());
        var ticket = tickets.get(id);
        if (ticket == null) {
            throw new NotFoundException();
        }
        ticket.setResolved(status.resolved);
    }

    private String getTenant() {
        return (String) getSessionAttributes().get("tenant");
    }

    private String getSubject() {
        return (String) getSessionAttributes().get("subject");
    }

    Map<String, Object> getSessionAttributes() {
        return getSessionAttributes(request);
    }

    static Map<String, Object> getSessionAttributes(HttpServletRequest request) {
        var cookies = request.getCookies();
        return Arrays.stream(cookies != null ? cookies : new Cookie[]{})
                .filter(cookie -> "user".equals(cookie.getName()))
                .findAny()
                .map(cookie -> {
                    var components = cookie.getValue().split("\\s*/\\s*", 2);
                    Map<String, Object> map = new HashMap<>();
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

        root.addServlet(new ServletHolder(new ProxyServlet<>(styraRun, sessionManager)), "/api/authz");

        RbacServletHelper.addRbacServlets(root, "/api/rbac", styraRun, sessionManager, null);

        server.start();
        server.join();
    }
}
