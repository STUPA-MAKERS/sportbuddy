# Boots the module with a local PostgreSQL and checks that the backend reaches
# its database through the socket (peer authentication) and answers.
self: pkgs:
pkgs.testers.runNixOSTest {
  name = "sportbuddy-module";
  nodes.machine = {
    imports = [ self.nixosModules.default ];
    services.sportbuddy = {
      enable = true;
      url = "http://localhost";
      smtp = {
        host = "127.0.0.1";
        user = "noreply@example.org";
        from = "noreply@example.org";
      };
      oidc.issuer = "http://127.0.0.1:9/";
      environmentFile = pkgs.writeText "sportbuddy.env" ''
        API_SECRET=test
        ALTCHA_HMAC_KEY=test
        SESSION_SECRET=test-session-secret-test-session-secret
        OIDC_CLIENT_SECRET=test
      '';
    };
  };
  testScript = ''
    machine.wait_for_unit("postgresql.service")
    machine.wait_for_unit("sportbuddy.service")
    machine.wait_until_succeeds("curl -sf http://127.0.0.1:3000/health")
    machine.succeed("curl -sf 'http://127.0.0.1:3000/api/requests' | grep -q items")
    machine.fail("ss -ltn | grep -q '0.0.0.0:3000'")
  '';
}
