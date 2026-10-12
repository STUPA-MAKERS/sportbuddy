self:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.services.sportbuddy;
  inherit (lib)
    mkEnableOption
    mkIf
    mkOption
    types
    ;
  packages = self.packages.${pkgs.stdenv.hostPlatform.system};
in
{
  options.services.sportbuddy = {
    enable = mkEnableOption "the SportBuddy backend";

    package = mkOption {
      type = types.package;
      default = packages.backend;
      description = "The backend package with the sportbuddy-backend binary.";
    };

    frontend = mkOption {
      type = types.package;
      default = packages.frontend;
      description = ''
        The built Angular app. A web server serves it and sends /api to the
        backend; this module does not configure the web server.
      '';
    };

    host = mkOption {
      type = types.str;
      default = "127.0.0.1";
      description = "Address the backend listens on.";
    };

    port = mkOption {
      type = types.port;
      default = 3000;
      description = "Port the backend listens on.";
    };

    url = mkOption {
      type = types.str;
      example = "https://sportbuddy.reutlingen.university";
      description = "Public URL of the app: the CORS origin, the links in e-mails and the OIDC callback.";
    };

    database = {
      createLocally = mkOption {
        type = types.bool;
        default = true;
        description = ''
          Create the database and its role in the local PostgreSQL. The
          backend then connects through the Unix socket with peer
          authentication, so it needs no password.
        '';
      };
      name = mkOption {
        type = types.str;
        default = "sportbuddy";
        description = "Name of the database.";
      };
      user = mkOption {
        type = types.str;
        default = "sportbuddy";
        description = "Database role. With createLocally it is also the system user of the service.";
      };
      host = mkOption {
        type = types.str;
        default = "/run/postgresql";
        description = "Database host, or the socket directory.";
      };
      port = mkOption {
        type = types.port;
        default = 5432;
        description = "Database port.";
      };
    };

    smtp = {
      host = mkOption {
        type = types.str;
        description = "SMTP server.";
      };
      port = mkOption {
        type = types.port;
        default = 587;
        description = "SMTP port.";
      };
      secure = mkOption {
        type = types.bool;
        default = false;
        description = "Implicit TLS (port 465). With false, the connection uses STARTTLS.";
      };
      user = mkOption {
        type = types.str;
        description = "SMTP login. The password is SMTP_PASS in environmentFile.";
      };
      from = mkOption {
        type = types.str;
        description = "Sender address of the e-mails.";
      };
    };

    moderationEmail = mkOption {
      type = types.str;
      default = "";
      description = "More recipients of the notices about new reports, separated by commas.";
    };

    oidc = {
      issuer = mkOption {
        type = types.str;
        example = "https://sso.example.org/application/o/sportbuddy/";
        description = "OpenID issuer of the admin sign-in.";
      };
      clientId = mkOption {
        type = types.str;
        default = "sportbuddy";
        description = "OIDC client id. The secret is OIDC_CLIENT_SECRET in environmentFile.";
      };
      scopes = mkOption {
        type = types.str;
        default = "openid profile email";
        description = "Scopes of the sign-in request.";
      };
      groupsClaim = mkOption {
        type = types.str;
        default = "groups";
        description = "Claim with the groups. Dot paths work.";
      };
      adminGroup = mkOption {
        type = types.str;
        default = "STUPA.Sportbuddy.Admin";
        description = "Group that gets access to /admin.";
      };
    };

    environmentFile = mkOption {
      type = types.nullOr types.path;
      default = null;
      description = ''
        File with the secrets: SMTP_PASS, API_SECRET, ALTCHA_HMAC_KEY,
        SESSION_SECRET and OIDC_CLIENT_SECRET. It may also override any other
        variable.
      '';
    };

    environment = mkOption {
      type = types.attrsOf types.str;
      default = { };
      description = "More environment variables of the backend.";
    };
  };

  config = mkIf cfg.enable {
    users.users.${cfg.database.user} = {
      isSystemUser = true;
      group = cfg.database.user;
    };
    users.groups.${cfg.database.user} = { };

    services.postgresql = mkIf cfg.database.createLocally {
      enable = true;
      ensureDatabases = [ cfg.database.name ];
      ensureUsers = [
        {
          name = cfg.database.user;
          ensureDBOwnership = cfg.database.name == cfg.database.user;
        }
      ];
    };

    assertions = [
      {
        assertion = !cfg.database.createLocally || cfg.database.name == cfg.database.user;
        message = "services.sportbuddy: with database.createLocally, database.name must equal database.user (ensureDBOwnership).";
      }
    ];

    systemd.services.sportbuddy = {
      description = "SportBuddy backend";
      wantedBy = [ "multi-user.target" ];
      after = [ "network-online.target" ] ++ lib.optional cfg.database.createLocally "postgresql.service";
      wants = [ "network-online.target" ];
      requires = lib.optional cfg.database.createLocally "postgresql.service";
      environment = {
        NODE_ENV = "production";
        HOST = cfg.host;
        PORT = toString cfg.port;
        FRONTEND_URL = cfg.url;
        DB_HOST = cfg.database.host;
        DB_PORT = toString cfg.database.port;
        DB_USER = cfg.database.user;
        DB_NAME = cfg.database.name;
        SMTP_HOST = cfg.smtp.host;
        SMTP_PORT = toString cfg.smtp.port;
        SMTP_SECURE = lib.boolToString cfg.smtp.secure;
        SMTP_USER = cfg.smtp.user;
        SMTP_FROM = cfg.smtp.from;
        MODERATION_EMAIL = cfg.moderationEmail;
        OIDC_ISSUER = cfg.oidc.issuer;
        OIDC_CLIENT_ID = cfg.oidc.clientId;
        OIDC_REDIRECT_URI = "${cfg.url}/api/admin/auth/callback";
        OIDC_SCOPES = cfg.oidc.scopes;
        OIDC_GROUPS_CLAIM = cfg.oidc.groupsClaim;
        OIDC_ADMIN_GROUP = cfg.oidc.adminGroup;
      }
      // cfg.environment;
      serviceConfig = {
        ExecStart = lib.getExe cfg.package;
        User = cfg.database.user;
        Group = cfg.database.user;
        RuntimeDirectory = "sportbuddy";
        WorkingDirectory = "/run/sportbuddy";
        EnvironmentFile = lib.mkIf (cfg.environmentFile != null) cfg.environmentFile;
        Restart = "on-failure";
        RestartSec = 5;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        NoNewPrivileges = true;
        ProtectKernelTunables = true;
        ProtectKernelModules = true;
        ProtectControlGroups = true;
        RestrictSUIDSGID = true;
        LockPersonality = true;
      };
    };
  };
}
