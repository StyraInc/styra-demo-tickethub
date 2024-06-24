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
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.Optional;

public class ResolveState {
  @JsonProperty("resolved")
  private boolean resolved;

  // For whatever reason, Spring is not automatically creating the getters and
  // setters for this class so I have written them out manually.

  public boolean getResolved() {
      return resolved;
  }

  public void setResolved(boolean newResolved) {
      this.resolved = newResolved;
  }

}
