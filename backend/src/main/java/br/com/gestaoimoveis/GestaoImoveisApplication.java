package br.com.gestaoimoveis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestaoImoveisApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestaoImoveisApplication.class, args);
    }

}
