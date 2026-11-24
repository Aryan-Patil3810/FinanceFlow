package com.financeflow.auth.security;

import com.financeflow.user.entity.User;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;

    private final String jwtSecret;

    private final long jwtExpiration;

    public JwtService(
            @Value("${JWT_SECRET}") String jwtSecret,
            @Value("${JWT_EXPIRATION:86400000}") long jwtExpiration
    ) {
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
        this.jwtEncoder = createJwtEncoder(jwtSecret);
    }

    private JwtEncoder createJwtEncoder(String secret) {

        SecretKey secretKey = new SecretKeySpec(
                secret.getBytes(),
                "HmacSHA256"
        );

        return new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(
                new ImmutableSecret<>(secretKey)
        );
    }

    public String generateToken(User user) {

        Instant issuedAt = Instant.now();

        Instant expiresAt = issuedAt.plus(
                jwtExpiration,
                ChronoUnit.MILLIS
        );

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("firstName", user.getFirstName())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();

        JwsHeader header = JwsHeader.with(
                MacAlgorithm.HS256
        ).build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(
                        header,
                        claims
                )
        ).getTokenValue();
    }
}