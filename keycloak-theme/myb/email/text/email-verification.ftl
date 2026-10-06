${msg("emailVerificationGreeting", user.firstName!"")}

${msg("emailVerificationIntro")}

${msg("emailVerificationAddressLabel")}: ${user.email}

${msg("emailVerificationButton")}:
${link}

${msg("emailVerificationExpiry", linkExpirationFormatter(linkExpiration))}
${msg("emailVerificationIgnore")}

${msg("emailVerificationAppPrompt")}
https://myb-platform.com/

${msg("emailVerificationFooter")}
