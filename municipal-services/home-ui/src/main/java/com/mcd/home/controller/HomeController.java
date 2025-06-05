package com.mcd.home.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/v1/index")
    public String index() {
        return "index";
    }

}