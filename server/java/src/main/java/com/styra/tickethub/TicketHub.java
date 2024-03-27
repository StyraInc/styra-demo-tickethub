package com.styra.tickethub;

import com.styra.tickethub.Storage.Ticket;
import com.styra.tickethub.Porcelain;

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

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.styra.opa.models.operations.*;
import com.styra.opa.models.operations.ExecutePolicyWithInputRequest;
import com.styra.opa.models.operations.ExecutePolicyWithInputRequestBody;
import com.styra.opa.models.operations.ExecutePolicyWithInputResponse;
import com.styra.opa.models.shared.*;
import com.styra.opa.models.shared.Explain;
import com.styra.opa.models.shared.GzipAcceptEncoding;
import com.styra.opa.models.shared.GzipContentEncoding;
import com.styra.opa.*;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Map;
import static java.util.Map.entry;
import jakarta.ws.rs.NotAllowedException;


import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/")
public class TicketHub {
    private static final Storage storage = Storage.create();

    private Porcelain porc;

    public TicketHub() {
        String opaURL = "http://localhost:8181";
        String opaURLEnv = System.getenv("OPA_URL");
        if (opaURLEnv != null) {
            opaURL = opaURLEnv;
        }
        System.out.printf("DEBUG: using OPA URL: %s\n", opaURL);

        porc = new Porcelain(opaURL);
    }

    private @Context
    HttpServletRequest request;

    @GET
    @Path("/tickets")
    @Produces({MediaType.APPLICATION_JSON})
    public Tickets getTickets() {
        if (!authz()) {
            throw new NotAllowedException("Not authorized");
        }
        return new Tickets(storage.getTickets(getTenant()));
    }

    @GET
    @Path("/tickets/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket getTicket(@PathParam("id") int id) {
        if (!authz()) {
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
        if (!authz()) {
            throw new NotAllowedException("Not authorized");
        }
        return storage.addTicket(getTenant(), ticket);
    }

    @POST
    @Path("/tickets/{id}/resolve")
    @Produces(MediaType.APPLICATION_JSON)
    public Ticket resolveTicket(@PathParam("id") int id, TicketStatus status) {
        if (!authz()) {
            throw new NotAllowedException("Not authorized");
        }
        var tickets = storage.getTickets(getTenant());
        var ticket = tickets.get(id);
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

    private boolean authz() {
        System.out.printf("DEBUG: %s %s %s\n", getSessionPath(), getSessionMethod(), getSessionAttributes());

        java.util.Map iMap = java.util.Map.ofEntries(
            entry("path", getSessionPath()),
            entry("method", getSessionMethod()),
            entry("cookie", getSessionAttributes()),
            entry("user", getSessionAttributes().get("subject")),
            entry("tenant", getSessionAttributes().get("tenant")),
            entry("action", getSessionMethod().toLowerCase())
        );

        Object out;
        boolean allow;

        try {
            out = porc.ExecutePolicy(iMap, "tickets");
        } catch (Exception e) {
            System.out.printf("ERROR: request threw exception: %s\n", e);
            return false;
        }

        System.out.printf("DEBUG: policy evaluation result: %s (%s)\n", out, out.getClass());
        allow = (boolean) ((java.util.LinkedHashMap) out).get("allow");
        System.out.printf("DEBUG: allow is: %b\n", allow);

        return allow;

        /*
        // TODO: this can probably be done once and re-used?
        Opa sdk = Opa.builder().build();

        ExecutePolicyWithInputRequest req = ExecutePolicyWithInputRequest.builder()
            .path("main")
            .requestBody(ExecutePolicyWithInputRequestBody.builder()
                    .input(Input.of(iMap)).build())
            .pretty(false)
            .provenance(false)
            .explain(Explain.NOTES)
            .metrics(false)
            .instrument(false)
            .strictBuiltinErrors(false)
            .build();

        try {

            ExecutePolicyWithInputResponse res = sdk.executePolicyWithInput()
                .request(req)
                .call();

            boolean allow = false;

            if (res.successfulPolicyEvaluation().isPresent()) {
                Object out = res.successfulPolicyEvaluation().get().result().get().value();
                System.out.printf("DEBUG: policy evaluation result: %s (%s)\n", out, out.getClass());
                allow = (boolean) ((java.util.LinkedHashMap) out).get("allow");
                System.out.printf("DEBUG: allow is: %b\n", allow);
            } else {
                System.out.printf("DEBUG: policy evaluation failed: %s\n", res);
            }

            return allow;

        } catch (Exception e) {
            System.out.printf("ERROR: request threw exception: %s\n", e);
            return false;
        }*/
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
