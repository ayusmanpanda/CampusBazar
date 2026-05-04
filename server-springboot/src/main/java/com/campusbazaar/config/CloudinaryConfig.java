package com.campusbazaar.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class CloudinaryConfig {

    private final AppProperties props;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", props.getCloudinary().getCloudName(),
                "api_key", props.getCloudinary().getApiKey(),
                "api_secret", props.getCloudinary().getApiSecret(),
                "secure", true
        ));
    }
}
