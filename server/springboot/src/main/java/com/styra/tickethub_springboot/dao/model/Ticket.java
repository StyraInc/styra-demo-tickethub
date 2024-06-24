package com.styra.tickethub_springboot.dao.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.Optional;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = Ticket.TABLE_NAME)
public class Ticket {
  public static final String TABLE_NAME = "Tickets";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name="id")
  private Integer id;

  @NotBlank(message = "Ticket tenant must not be blank")
  @JoinColumn(name = "tenant", referencedColumnName = "id")
  @ManyToOne
  private Tenant tenant;

  @NotBlank(message = "Ticket customer must not be blank")
  @JoinColumn(name="customer", referencedColumnName = "id")
  @ManyToOne
  private Customer customer;

  @Column(name="description")
  private String description;

  // We need to explicitly set a default value here because Spring does not
  // know about the NOT NULL constraint on the column, will try to generate SQL
  // that puts NULL in this column, and then promptly throw a
  // org.springframework.dao.DataIntegrityViolationException.
  @Column(name="resolved")
  private Boolean resolved = false;

  // https://github.com/spring-projects/spring-boot/issues/2225#issuecomment-70092564
  @Column(name="last_updated")
  @JsonProperty("last_updated")
  @JsonFormat(shape = JsonFormat.Shape.STRING)
  private Instant lastUpdated;

  // https://stackoverflow.com/a/221827
  @PreUpdate
  @PrePersist
  protected void onUpdate() {
    lastUpdated = Instant.now();
  }
}
