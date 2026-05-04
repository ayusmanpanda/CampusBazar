package com.campusbazaar.controller;

import com.campusbazaar.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public Map<String, Object> publicProfile(@PathVariable String id) {
        return userService.publicProfile(id);
    }
}
