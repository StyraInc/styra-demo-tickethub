package com.styra.tickethub;

import com.styra.tickethub.Storage.Ticket;
import com.styra.tickethub.Tickethub.ResourceServlet.Alias;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.resource.PathResource;
import org.eclipse.jetty.util.resource.Resource;
import org.glassfish.jersey.servlet.ServletContainer;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.PathMatcher;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;

import static jakarta.servlet.DispatcherType.REQUEST;

@Path("/")
public class Tickethub {
    private record TicketStatus(boolean resolved) {}
    private record Tickets(List<Ticket> tickets) {}

    private static final Storage storage = Storage.create();

    private @Context HttpServletRequest request;

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
    public void resolveTicket(@PathParam("id") int id, TicketStatus status) {
        var tickets = storage.getTickets(getTenant());
        var ticket = tickets.get(id);
        if (ticket == null) {
            throw new NotFoundException();
        }
        ticket.setResolved(status.resolved);
    }

    private String getTenant() {
        return (String) request.getAttribute("tenant");
    }

    private String getUser() {
        return (String) request.getAttribute("user");
    }

    public static void main(String... args) throws Exception {
        var port = Integer.parseInt(System.getProperty("SERVER_PORT", "4000"));
        var server = new Server(port);
        var root = new ServletContextHandler();
        server.setHandler(root);

        root.addFilter(SessionFilter.class, "/*", EnumSet.of(REQUEST));

        var apiHolder = root.addServlet(ServletContainer.class, "/api/*");
        apiHolder.setInitOrder(0);
        apiHolder.setInitParameter("jersey.config.server.provider.packages", Tickethub.class.getPackageName());

        server.start();
        server.join();
    }

    public static class SessionFilter implements Filter {
        @Override
        public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
                throws IOException, ServletException {
            var httpReq = (HttpServletRequest) req;
            var cookies = httpReq.getCookies();
            if (cookies != null) {
                Arrays.stream(cookies)
                        .filter(cookie -> "user".equals(cookie.getName()))
                        .findAny()
                        .ifPresent(cookie -> {
                            var components = cookie.getValue().split("/");
                            req.setAttribute("tenant", components[0].trim());
                            req.setAttribute("user", components[1].trim());
                        });
            }

            chain.doFilter(req, resp);
        }
    }

    public static class ResourceServlet extends DefaultServlet {
        public record Alias(PathMatcher glob, String file) {
            private static final FileSystem fs = FileSystems.getDefault();
            Alias(String glob, String file) {
                this(fs.getPathMatcher(String.format("glob:%s", glob)), file);
            }
        }

        private final List<Alias> aliases;

        public ResourceServlet(List<Alias> aliases) {
            this.aliases = aliases;
        }

        @Override
        public Resource getResource(String pathInContext) {
            var path = java.nio.file.Path.of(pathInContext);
            return super.getResource(aliases.stream()
                    .filter(alias -> alias.glob.matches(path))
                    .findFirst()
                    .map(alias -> alias.file)
                    .orElse(pathInContext));
        }
    }
}
