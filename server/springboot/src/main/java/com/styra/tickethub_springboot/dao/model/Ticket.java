package com.styra.tickethub_springboot.dao.model;

import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
  private Long id;

  @NotBlank(message = "Ticket tenant must not be blank")
  private String tenant;

  @NotBlank(message = "Ticket customer must not be blank")
  private String customer;

  private String description;

  private Boolean resolved;

  private Instant lastUpdated;

  // https://stackoverflow.com/a/221827
  @PreUpdate
  @PrePersist
  protected void onUpdate() {
    lastUpdated = Optional.ofNullable(lastUpdated).orElse(Instant.now());
  }
}
