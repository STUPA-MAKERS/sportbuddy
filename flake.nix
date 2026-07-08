{
  description = "SportBuddy — NestJS backend + Angular frontend monorepo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
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
        npmDepsHash = "sha256-dEz4+czwjuG0Yhu3cqtkemZK3+7UMnJktM24ZcMZw+I=";
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
        npmDepsHash = "sha256-vxJZgdaXcr44PsHwj7qpEMVBCPyqwT8PxQXD9bk6BLI=";
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
      devShells.${system}.default = pkgs.mkShell { packages = [ nodejs ]; };
    };
}
