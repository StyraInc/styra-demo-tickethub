package com.styra.tickethub_springboot.web.errors;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


import java.net.URI;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class ApplicationExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  ResponseEntity<ProblemDetail> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
    List<String> details = new ArrayList<>();
    for (FieldError error : ex.getBindingResult().getFieldErrors()) {
      details.add(error.getDefaultMessage());
    }
    ProblemDetail body = ProblemDetail
        .forStatusAndDetail(HttpStatusCode.valueOf(404), ex.getLocalizedMessage());
    body.setTitle("Bad Request");
    body.setProperty("details", details);
    return ResponseEntity.badRequest()
        .body(body);
  }

  @ExceptionHandler(TicketNotFoundException.class)
  public ProblemDetail handleTicketNotFoundException(
      TicketNotFoundException ex, WebRequest request) {

    ProblemDetail body = ProblemDetail
        .forStatusAndDetail(HttpStatusCode.valueOf(404), ex.getLocalizedMessage());
    body.setTitle("Ticket Not Found");
    body.setProperty("hostname", "localhost");
    return body;
  }

    //@ExceptionHandler(AccessDeniedException.class)
    //public ResponseEntity accessDeniedException(AccessDeniedException e) throws AccessDeniedException  {
    //    // https://stackoverflow.com/a/64845732
    //
    //    System.out.println("YYYYYYYYYYY global controller");
    //
    //    throw e;
    //}

    @ExceptionHandler(value = {AccessDeniedException.class})
    public void commence(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse,
                         AccessDeniedException accessDeniedException) throws IOException {

        System.out.println("ZZZZZZZZ");
    }
}
