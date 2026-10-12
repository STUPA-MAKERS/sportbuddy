{
  description = "SportBuddy — NestJS backend + Angular frontend monorepo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  # The frontend compiles the STUPA ui-kit from the git submodule frontend/vendor/ui-kit.
  inputs.self.submodules = true;
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      nodejs = pkgs.nodejs_22;

      backend = pkgs.buildNpmPackage {
        pname = "sportbuddy-backend";
        version = "1.0.0";
        src = ./backend;
        inherit nodejs;
        npmDepsHash = "sha256-tHPgNjaUM4LWvNe9MvOnrh93pHzc4tMUnJmaUd/Pqyo=";
        npmBuildScript = "build";
        CI = "true";
        # NestJS "nest build" emits compiled JS into dist/. Runtime email
        # templates live alongside it (see backend/Dockerfile).
        installPhase = ''
          runHook preInstall
          mkdir -p $out
          cp -r dist $out/dist
          cp -r templates $out/templates
          cp package.json $out/package.json
          runHook postInstall
        '';
      };

      frontend = pkgs.buildNpmPackage {
        pname = "sportbuddy-frontend";
        version = "0.0.0";
        src = ./frontend;
        inherit nodejs;
        npmDepsHash = "sha256-W3fq6C6/3L25WSiVPcH89IjQTEWxPmwbzSSs34unQhQ=";
        npmBuildScript = "build";
        # Angular CLI otherwise prompts for analytics consent and hangs.
        env.NG_CLI_ANALYTICS = "false";
        CI = "true";
        # @angular/build:application emits the browser bundle into
        # dist/frontend/browser (see frontend/Dockerfile).
        installPhase = ''
          runHook preInstall
          mkdir -p $out
          cp -r dist/frontend/browser/. $out/
          runHook postInstall
        '';
      };
    in {
      packages.${system} = {
        default = backend;
        backend = backend;
        frontend = frontend;
      };
      devShells.${system}.default = pkgs.mkShell {
        packages = [ nodejs ];
        shellHook = ''
          echo "sportbuddy dev shell — node $(node --version)"
          # Drop into the user's interactive zsh (loads ~/.zshrc); guarded so
          # `nix develop -c <cmd>` and non-interactive uses still run in bash.
          [[ $- == *i* ]] && exec ${pkgs.zsh}/bin/zsh
        '';
      };
    };
}
