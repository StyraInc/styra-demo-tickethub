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

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        string pgConnString = Environment.GetEnvironmentVariable("DATABASE_CONN_STR") ?? "Host=localhost;Database=postgres;Username=postgres;Password=schmickethub";
        optionsBuilder.UseNpgsql(pgConnString, npgsqlOptions => npgsqlOptions.UseNodaTime());
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Users_pkey");

            entity.HasIndex(e => new { e.Tenant, e.Name }, "Users_tenant_and_name_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.Tenant).HasColumnName("tenant");

            entity.HasOne(d => d.TenantNavigation).WithMany(p => p.Users)
                .HasForeignKey(d => d.Tenant)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Users_tenant_fkey");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Customers_pkey");

            entity.HasIndex(e => new { e.Tenant, e.Name }, "Customers_tenant_name_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .HasColumnName("phone");
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
            entity.Property(e => e.Region)
                .HasMaxLength(255)
                .HasColumnName("region");
        });

        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Tickets_pkey");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Customer).HasColumnName("customer");
            entity.Property(e => e.Tenant).HasColumnName("tenant");
            entity.Property(e => e.Assignee).HasColumnName("assignee");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.LastUpdated)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("last_updated");
            entity.Property(e => e.Resolved)
                .HasDefaultValue(false)
                .HasColumnName("resolved");

            entity.HasOne(d => d.CustomerNavigation).WithMany(p => p.Tickets)
                .HasForeignKey(d => d.Customer)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Tickets_customer_fkey");

            entity.HasOne(d => d.TenantNavigation).WithMany(p => p.Tickets)
                .HasForeignKey(d => d.Tenant)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Tickets_tenant_fkey");

            entity.HasOne(d => d.UserNavigation).WithMany(p => p.Tickets)
                .HasForeignKey(d => d.Assignee)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Tickets_assignee_fkey");

            // Try manually designating the Navigation properties.
            entity.Navigation(e => e.CustomerNavigation);
            entity.Navigation(e => e.TenantNavigation);
            entity.Navigation(e => e.UserNavigation);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
