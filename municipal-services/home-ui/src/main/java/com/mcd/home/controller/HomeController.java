package com.mcd.home.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/v1/index")
    public String index() {
        return "index";
    }

    @GetMapping("/income-codes")
    public String income() { return "income_table"; }

    @GetMapping("/expenditure-codes")
    public String expenditure() { return "expenditure_table"; }

}