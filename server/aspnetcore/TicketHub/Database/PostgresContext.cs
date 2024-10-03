using Microsoft.EntityFrameworkCore;

namespace TicketHub.Database;

public partial class PostgresContext : DbContext
{
    public PostgresContext()
    {
    }

    public PostgresContext(DbContextOptions<PostgresContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<Tenant> Tenants { get; set; }

    public virtual DbSet<Ticket> Tickets { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        string pgConnString = Environment.GetEnvironmentVariable("DATABASE_CONN_STR") ?? "Host=localhost;Database=postgres;Username=postgres;Password=schmickethub";
        optionsBuilder.UseNpgsql(pgConnString, npgsqlOptions => npgsqlOptions.UseNodaTime());
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Customers_pkey");

            entity.HasIndex(e => new { e.Tenant, e.Name }, "Customers_tenant_name_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.Tenant).HasColumnName("tenant");

            entity.HasOne(d => d.TenantNavigation).WithMany(p => p.Customers)
                .HasForeignKey(d => d.Tenant)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Customers_tenant_fkey");
        });

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tenants_pkey");

            entity.HasIndex(e => e.Name, "Tenants_name_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tickets_pkey");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Customer).HasColumnName("customer");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.LastUpdated)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("last_updated");
            entity.Property(e => e.Resolved)
                .HasDefaultValue(false)
                .HasColumnName("resolved");
            entity.Property(e => e.Tenant).HasColumnName("tenant");

            entity.HasOne(d => d.CustomerNavigation).WithMany(p => p.Tickets)
                .HasForeignKey(d => d.Customer)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Tickets_customer_fkey");

            entity.HasOne(d => d.TenantNavigation).WithMany(p => p.Tickets)
                .HasForeignKey(d => d.Tenant)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Tickets_tenant_fkey");

            // Try manually designating the Navigation properties.
            entity.Navigation(e => e.CustomerNavigation);
            entity.Navigation(e => e.TenantNavigation);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
