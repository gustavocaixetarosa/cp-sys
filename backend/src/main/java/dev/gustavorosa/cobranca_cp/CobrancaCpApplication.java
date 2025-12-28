package dev.gustavorosa.cobranca_cp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CobrancaCpApplication {

	public static void main(String[] args) {
		SpringApplication.run(CobrancaCpApplication.class, args);
	}

}
