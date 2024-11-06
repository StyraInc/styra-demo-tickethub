package com.styra.tickethub;

import com.styra.tickethub.Storage.Ticket;
import com.styra.opa.OPAClient;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.glassfish.jersey.servlet.ServletContainer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Map;
import static java.util.Map.entry;
import jakarta.ws.rs.ForbiddenException;


import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Path("/")
public class TicketHub {
    private static final Storage storage = Storage.create();

    private OPAClient opa;

    public TicketHub() {
        String opaURL = "http://localhost:8181";
        String opaURLEnv = System.getenv("OPA_URL");
        if (opaURLEnv != null) {
            opaURL = opaURLEnv;
        }

        opa = new OPAClient(opaURL);
    }

    private @Context
    HttpServletRequest request;

    @GET
    @Path("/tickets")
    @Produces({MediaType.APPLICATION_JSON})
    public Tickets getTickets() {
        authz();
        return new Tickets(storage.getTickets(getTenant()));
    }

    @GET
    @Path("/tickets/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket getTicket(@PathParam("id") int id) {
        authz();

        // This will perform poorly with a large number of tickets, but since
        // this is just a demo it should never have more than a few dozen.
        var tickets = storage.getTickets(getTenant());
        Ticket ticket = null;
        for (Ticket t : tickets) {
            if (t.getId() == id) {
                ticket = t;
                break;
            }
        }
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
        authz();
        return storage.addTicket(getTenant(), ticket);
    }

    @POST
    @Path("/tickets/{id}/resolve")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket resolveTicket(@PathParam("id") int id, TicketStatus status) {
        authz();
        var tickets = storage.getTickets(getTenant());
        Ticket ticket = null;
        for (Ticket t : tickets) {
            if (t.getId() == id) {
                ticket = t;
                break;
            }
        }
        if (ticket == null) {
            throw new NotFoundException();
        }
        ticket.setResolved(status.resolved);
        return ticket;
    }

    private String getTenant() {
        return (String) getSessionAttributes().get("tenant");
    }

    private String getSubject() {
        return (String) getSessionAttributes().get("subject");
    }

    private Map<String, Object> getSessionAttributes() {
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

    private String getSessionPath() {
        return getSessionPath(request);
    }

    static String getSessionPath(HttpServletRequest request) {
        return request.getPathInfo();
    }

    private String getSessionMethod() {
        return getSessionMethod(request);
    }

    static String getSessionMethod(HttpServletRequest request) {
        return request.getMethod();
    }

    private void authz() throws ForbiddenExceptionWithReason {
        String path = getSessionPath();
        String action = getSessionMethod().toLowerCase();

        // An ugly kludge to decide what the action should be for the policy.
        // At a minimum, we probably don't need to recompile the regexes for
        // every single request. [0-9]+ also matches some invalid (non-int)
        // IDs.
        if (path == "/tickets") {
            action = "list";
        }

        if (Pattern.compile("^/tickets/[0-9]+$").matcher(path).find()) {
            action = "get";
        }

        if (Pattern.compile("^/tickets/[0-9]+/resolve$").matcher(path).find()) {
            action = "resolve";
        }

        java.util.Map<String, Object> iMap = java.util.Map.ofEntries(
            entry("path", path),
            entry("method", getSessionMethod()),
            entry("cookie", getSessionAttributes()),
            entry("user", getSessionAttributes().get("subject")),
            entry("tenant", getSessionAttributes().get("tenant")),
            entry("action", action)
        );

        boolean allow = false;
        String reason = null;

        try {
            allow = opa.check("tickets/allow", iMap);
        } catch (Exception e) {
            throw new ForbiddenExceptionWithReason(String.format("OPA request failed due to exception: %s", e), null);
        }

        if (allow) {
            // don't bother getting a reason if the request was allowed
            return;
        }

        try {
            reason = opa.evaluate("tickets/response/reason", iMap);
        } catch (Exception e) {
            throw new ForbiddenExceptionWithReason(String.format("OPA request failed due to exception: %s", e), null);
        }

        throw new ForbiddenExceptionWithReason("access denied by policy", reason);

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
