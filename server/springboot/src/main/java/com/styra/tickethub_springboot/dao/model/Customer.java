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
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import java.time.Instant;
import java.util.Optional;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = Customer.TABLE_NAME)
@JsonDeserialize(using = CustomerDeserializer.class)
@JsonSerialize(using = CustomerSerializer.class)
public class Customer {
  public static final String TABLE_NAME = "Customers";

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name="id")
  private Integer id;

  @NotBlank(message = "Customer tenant must not be blank")
  @JoinColumn(name = "tenant", referencedColumnName = "id")
  @ManyToOne
  private Tenant tenant;

  @NotBlank(message = "Customer name must not be blank")
  @Column(name="name")
  private String name;
}
