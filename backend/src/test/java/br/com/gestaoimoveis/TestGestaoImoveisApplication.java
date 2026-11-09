package br.com.gestaoimoveis;

import org.springframework.boot.SpringApplication;

public class TestGestaoImoveisApplication {

    public static void main(String[] args) {
        SpringApplication.from(GestaoImoveisApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
