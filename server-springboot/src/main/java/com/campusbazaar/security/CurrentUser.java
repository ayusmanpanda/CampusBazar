package com.campusbazaar.security;

import com.campusbazaar.model.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class CurrentUser implements UserDetails {

    private final User user;

    public String getId() { return user.getId(); }
    public String getRole() { return user.getRole().name(); }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name().toUpperCase()));
    }
    @Override public String getPassword() { return user.getPassword(); }
    @Override public String getUsername() { return user.getEmail(); }
    @Override public boolean isAccountNonExpired() { return !user.isDeleted(); }
    @Override public boolean isAccountNonLocked() { return !user.isBanned(); }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return user.isVerified() && !user.isDeleted() && !user.isBanned(); }
}
