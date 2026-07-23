<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false showAnotherWayIfPresent=true>
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="robots" content="noframe, noindex, nofollow">
      <title>${msg("loginTitle",(realm.displayName!""))}</title>
      <link rel="icon" href="${url.resourcesPath}/img/favicon.ico">
      <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
          <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
      </#if>
      <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
          <script type="text/javascript" src="${url.resourcesPath}/${script}"></script>
        </#list>
      </#if>
    </head>

    <body class="${bodyClass}">
      <myb-auth-layout>
        <div class="login-wrapper">
          <div class="login-card">
            <div class="login-header">
              <div class="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.9"/>
                  <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" opacity="0.55"/>
                  <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.55"/>
                  <rect x="13" y="13" width="9" height="9" rx="2" fill="currentColor" opacity="0.9"/>
                </svg>
              </div>
              <h1 class="brand-title">${msg("welcomeToMYB")}</h1>
            </div>

            <#nested>

          </div>
        </div>
      </myb-auth-layout>
    </body>
  </html>
</#macro>

<@registrationLayout bodyClass="login-page" displayMessage=false; section>
  ${section}
</@registrationLayout>